'use strict'

import { 
  COMPONENT_NO_ATTR,
  OF_ATTR,
  DEFAULT_LABEL_OFFSET_X,
  DEFAULT_LABEL_OFFSET_Y
} from '../common/define.js'

export function init_component(draw) {
  draw.fsg.component = {}
  const list = draw.find('.component')
  let max_component_no = 0
  list.forEach(item => {
    const component_no = Number(item.attr(COMPONENT_NO_ATTR))
    if (component_no > max_component_no) max_component_no = component_no
    // console.log(item)
  })
  draw.fsg.component.max_component_no = max_component_no
  draw.fsg.component.allComponents = []
  // console.log(max_component_no)
}

export function deinit_allcomponents(draw) {
  // clean up is important to load another .svg
  draw.fsg.component.allComponents.forEach(item => {
    item.remove()
  })
  draw.fsg.component.allComponents = []
}

export function componentByNo(draw, no) {
  const found = draw.fsg.component.allComponents.find(item => item.component_no == Number(no))
  console.assert(found, 'component not found', no)
  return found
}

function labelOf(draw, no) {
  const labels = draw.find('.label')
  let found = null
  labels.each(item => {
    if(no == Number(item.attr(OF_ATTR)))
      found = item
  })
  // console.assert(found, 'label not found')
  return found
}

///
/// Component
///

export class Component {
  constructor({draw, element}) {
    console.assert(draw, 'draw is required')
    console.assert(element, 'element is required')
    console.assert(draw === element.parent(), 'element must be the child of draw')

    //
    // draw.add(element) // don't call add, or it'll change the order of the element
    //
    this.draw = draw
    this.element = element
    element.component = this
    let component_no = element.attr(COMPONENT_NO_ATTR)
    if(typeof component_no === 'undefined') {
      draw.fsg.component.max_component_no++
      component_no = draw.fsg.component.max_component_no
      element.attr(COMPONENT_NO_ATTR, component_no)
    }
    this.component_no = Number(component_no) 

    // Label
    const labelText = element.attr('label')
    if (labelText) this.addLabel(draw, labelText)

    draw.fsg.component.allComponents.push(this)
  }
  watchUpdate(targets, callback) {
    targets.forEach(target => {
      target.on('update', evt => {
        callback(evt)
      })
    })
  }
  remove() {
    this.removeLabel()
    this.element.fire('remove')
    this.element.remove()
    this.draw.fsg.component.allComponents = this.draw.fsg.component.allComponents.filter(item => item !== this)
  }
  center() {
    return { x: this.element.cx(), y: this.element.cy() }
  }
  /// order interface
  forward() {
    this.element.forward()
    if (this.element.next()?.hasClass('cover')) this.element.forward() // forward again to skip cover
  }
  backward() {
    if (this.element.prev()?.hasClass('cover')) this.element.backward() // forward again to skip cover
    this.element.backward()
  }
  back() {
    const selectBox = this.draw.findOne('.ui-select-box')
    selectBox.after(this.element)
  }
  front() {
    this.element.front()
  }
  /// default undo interface, redo is handled by history automatically.
  undo() {
    this.remove()
  }
  /// Attribute Inerface
  getAttributes() {
    return ['id', 'class', 'cx', 'cy', 'text', 'fill', 'stroke']
  }
  getAttribute(attributeName) {
    if (attributeName == 'text')
      return this.getText()
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
  /// label interface
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
    let label = labelOf(draw, this.component_no)
    if (!label)  {
      const position = { x: target.cx() + DEFAULT_LABEL_OFFSET_X, y: -target.cy() + DEFAULT_LABEL_OFFSET_Y}
      label = draw.text(text)
        .attr('class', 'label')
        .attr('offset_x', DEFAULT_LABEL_OFFSET_X)
        .attr('offset_y', DEFAULT_LABEL_OFFSET_Y)
        .attr(OF_ATTR, target.attr(COMPONENT_NO_ATTR))
        .flip('y')
        .move(position.x, position.y)
      draw.add(label)
    } 
    // make label to be draggable
    label.on('mousedown', evt => {
      label.lastEvent = 'mousedown'
      label.fire('dragstart', { dragTarget: label })
      evt.stopPropagation()
    }).on('mouseup', () => {
      label.lastEvent = 'mouseup'
      label.fire('dragend')
    }).on('mousemove', () => {
      label.lastEvent = 'mousemove'
    }).on('dragstart', () => {
      draw.dragTarget = label
    }).on('dragend', () => {
      draw.dragTarget = null
      const offset = { dx: label.x() - target.cx(), dy: label.y() + target.cy() }
      label.attr('offset_x', offset.dx).attr('offset_y', offset.dy)
    })

    this.watchUpdate([target], () => {
      const offsetX = label.attr('offset_x')
      const offsetY = label.attr('offset_y')
      const position = { x: target.cx() + offsetX, y: -target.cy() + offsetY }
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
          const position = { x: target.cx() + offsetX, y: -target.cy() + offsetY }
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
  constructor({draw, element, override}) {
    super({draw, element})

    if (!override) {
      // Mouse Hover
      element.on('mouseenter', () => {
        if (!draw.dragTarget && !draw.dragSelectStart) {
          element.addClass('hover')
        }
      }).on('mouseleave', () => {
        element.removeClass('hover')
      })

      // Selection
      element.on('mousedown', evt => {
        element.lastEvent = 'mousedown'
        evt.stopPropagation()
      }).on('mouseup', () => {
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
    return this.element.hasClass('selected')
  }
  // selection looks only, called by selection module
  select() {
    this.element.addClass('selected')
  }
  unselect() {
    this.element.removeClass('selected')
    this.element.removeClass('hover')
  }
}
