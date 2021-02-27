'use strict'

import { 
  NO_ATTR,
  REFS_ATTR,
  OF_ATTR,
  DEFAULT_LABEL_OFFSET_X,
  DEFAULT_LABEL_OFFSET_Y,
  CLASS_FSG_UI_SELECT_BOX,
  FSG_SELECTED_ATTR,
  FSG_HOVER_ATTR,
} from '../common/define.js'

import { isRightButton } from '../common/common.js'

export function init_component_system(draw) {
  draw.fsg.component = {}
  const list = draw.find(`[${NO_ATTR}]`)
  let max_no = 0
  list.forEach(item => {
    const no = Number(item.attr(NO_ATTR))
    if (no > max_no) max_no = no
    // console.log(item)
  })
  draw.fsg.component.max_no = max_no
  draw.fsg.component.all = []
  // console.log(max_no)
}

export function deinit_component_system(draw) {
  // clean up is important to load another .svg
  draw.fsg.component.all.forEach(item => {
    item.remove()
  })
  draw.fsg.component.all = []
}

export function componentByNo(draw, no) {
  const found = draw.fsg.component.all.find(item => item.no == Number(no))
  console.assert(found, 'component not found', no)
  return found
}

function labelOf(draw, no) {
  const labels = draw.find('.label')
  return labels.toArray().find(item => no == Number(item.attr(OF_ATTR)) )
}

///
/// Component
/// - All states should be stored within element's attributes, 
///   so it could be restored via DOM string directly.
/// - A component may own multiple elements(such as cover, ref points, etc..)
///   the owned elements should have the attribute(of) to indicate it's owned by which component(no)
/// - A component referenced other components should have refs to indicate the compoents it referenced.
/// - A component that owned other elements should be resposible to re-construct those elements.
/// - A component should be removed when referenced components/owned elements were removed.
/// 

export class Component {
  constructor({draw, element, refs}) {
    console.assert(draw, 'draw is required')
    console.assert(element, 'element is required')
    console.assert(draw === element.parent(), 'element must be the child of draw')

    this.draw = draw
    this.element = element
    element.component = this
    // component no
    let no = element.attr(NO_ATTR)
    if(typeof no === 'undefined') {
      draw.fsg.component.max_no++
      no = draw.fsg.component.max_no
      element.attr(NO_ATTR, no)
    }
    this.no = Number(no) 

    // Label
    const labelText = element.attr('label')
    if (labelText) this.addLabel(draw, labelText)

    // Watch referenced components
    if (refs) {
      console.assert(refs instanceof Array, 'refs must be array')
      element.attr(REFS_ATTR, refs.join(','))
      this.refComponents = refs.map(no => componentByNo(draw, no))
      this.refComponents.forEach(target => {
        target.element.on('update', this.update.bind(this))
        target.element.on('remove', this.remove.bind(this))
      })
    }

    draw.fsg.component.all.push(this)
  }
  update() {
    // do nothing by default, subclass should override this.
  }
  remove() {
    this.refComponents?.forEach(target => {
      target.element.off('remove', this.remove)
      target.element.off('update', this.update)
    })

    this.removeLabel()
    this.element.fire('remove').remove()
    this.draw.fsg.component.all = this.draw.fsg.component.all.filter(item => item !== this)
  }
  center() {
    return { x: this.element.cx(), y: this.element.cy() }
  }
  /// DOM element order interface
  forward() {
    this.element.forward()
    if (this.element.next()?.hasClass('cover')) this.element.forward() // forward again to skip cover
  }
  backward() {
    if (this.element.prev()?.hasClass('cover')) this.element.backward() // forward again to skip cover
    this.element.backward()
  }
  back() {
    const selectBox = this.draw.findOne('.' + CLASS_FSG_UI_SELECT_BOX)
    selectBox.after(this.element)
  }
  front() {
    this.element.front()
  }
  /// default undo interface, redo is handled by the history module automatically.
  undo() {
    this.remove()
  }
  /// Inspectable Attribute Inerface
  getAttributes() {
    return ['id', 'class', 'cx', 'cy', 'text', 'fill', 'stroke']
  }
  getAttribute(attributeName) {
    if (attributeName == 'text') return this.getText()
    return this.element.attr(attributeName)
  }
  setAttribute(attributeName, value) {
    if (attributeName == 'text') {
      attributeName = 'label' // use 'label' instead 'text' in element attribute
      this.element.attr(attributeName, value)
      this.setText(value)
      return
    }
    this.element.attr(attributeName, value)
  }
  /// Label(text) interface
  setText(text) {
    if (!text || text.length == 0) {
      this.removeLabel()
      return
    }
    if (!this.label) 
      this.addLabel(text)
    else
      this.label.text(text)
  }
  getText() {
    return (this.label) ? this.label.text() : ''
  }
  addLabel(text) {
    const draw = this.draw
    const target = this.element

    // search for label of this component if exists
    let label = labelOf(draw, this.no)
    if (!label)  {
      const targetCenter = this.center()
      const position = { x: targetCenter.x + DEFAULT_LABEL_OFFSET_X, y: -targetCenter.y + DEFAULT_LABEL_OFFSET_Y}
      label = draw.text(text)
        .attr('class', 'label')
        .attr('offset_x', DEFAULT_LABEL_OFFSET_X)
        .attr('offset_y', DEFAULT_LABEL_OFFSET_Y)
        .attr(OF_ATTR, target.attr(NO_ATTR))
        .flip('y')
        .move(position.x, position.y)
      draw.add(label)
    } 
    // make label to be draggable
    label.on('mousedown', evt => {
      if (isRightButton(evt)) return // reserved for menu(do nothing so far)
      draw.dragStart = { x: label.cx(), y: label.cy() }
      label.lastEvent = 'mousedown'
      label.fire('dragstart', { dragTarget: label })
      evt.stopPropagation()
    }).on('mouseup', () => {
      if (isRightButton(evt)) return // reserved for menu(do nothing so far)
      label.lastEvent = 'mouseup'
      label.fire('dragend')
    }).on('mousemove', () => {
      label.lastEvent = 'mousemove'
    }).on('dragstart', () => {
      label.orgValue = {x: label.cx(), y: label.cy()}
      draw.dragTarget = label
    }).on('dragend', () => {
      draw.dragTarget = null
      const targetCenter = this.center()
      const offset = { dx: label.x() - targetCenter.x, dy: label.y() + targetCenter.y }
      label.attr('offset_x', offset.dx).attr('offset_y', offset.dy)
    })

    target.on('update', () => {
      const offsetX = label.attr('offset_x')
      const offsetY = label.attr('offset_y')
      const targetCenter = this.center()
      const position = { x: targetCenter.x + offsetX, y: -targetCenter.y + offsetY}
      // const position = { x: target.cx() + offsetX, y: -target.cy() + offsetY }
      label.move(position.x, position.y)
    })

    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if(mutation.attributeName == 'label') {
          let value = target.node.getAttribute('label')
          if (!value) value = ''

          const offsetX = label.attr('offset_x')
          const offsetY = label.attr('offset_y')
          // console.log(offsetX, offsetY)
          const targetCenter = this.center()
          const position = { x: targetCenter.x + offsetX, y: -targetCenter.y + offsetY}
          // bug fix:
          // update label location for the label which is located at (0,0) and not visible.
          label.text(value).move(position.x, position.y)
        }
      })
    })
    observer.observe(target.node, {attributes : true})
    this.observer = observer
    this.label = label
  }
  removeLabel() {
    if (!this.label) return
    this.observer.disconnect()
    this.observer = null
    this.label.remove()
    this.label = null
  }
}

//
// override : true if the subclass wants to deal with the events by itself,
// keeps the event handlers simple would be good for performance.
//
export class SelectableComponent extends Component {
  constructor({draw, element, refs, override}) {
    super({draw, element, refs})

    if (!override) {
      // Mouse Hover
      element.on('mouseenter', () => {
        if (!draw.dragTarget && !draw.selectStart) {
          element.attr(FSG_HOVER_ATTR, true)
        }
      }).on('mouseleave', () => {
        element.attr(FSG_HOVER_ATTR, null)
      })

      // Selection
      element.on('mousedown', evt => {
        if (isRightButton(evt)) return // reserved for menu(do nothing so far)
        element.lastEvent = 'mousedown'
        evt.stopPropagation()
      }).on('mouseup', evt => {
        if (isRightButton(evt)) return // reserved for menu(do nothing so far)
        if (element.lastEvent == 'mousedown') this.toggleSelected()
        element.lastEvent = 'mouseup'
      })
    }

    // Select by default
    selectComponent(this.draw, this)
  }
  remove() {
    unselectComponent(this.draw, this)
    super.remove()
  }
  /// toggling selection
  toggleSelected() {
    this.isSelected() ? unselectComponent(this.draw, this) : selectComponent(this.draw, this)
  }
  isSelected() {
    return this.element.attr(FSG_SELECTED_ATTR)
  }
  // selection looks only, called by selection module
  select() {
    this.element.attr(FSG_SELECTED_ATTR, true)
  }
  unselect() {
    this.element.attr(FSG_SELECTED_ATTR, null)
      .attr(FSG_HOVER_ATTR, null)
  }
}
