'use strict'

import { COMPONENT_NO_ATTR, COMPONENT_REFS_ATTR, OF_ATTR, DEFAULT_TRANSPARENT_COLOR } from '../common/define.js'
import { pointOnScreen } from '../common/math.js'
import { Component } from './component.js'
import { addAppendingPinPoint } from './appending-point.js'

function findBottom(draw, points) {
  let bottom = points[0]
  points.forEach(item => {
    const idx = draw.index(item)
    // console.log(idx, item)
    if ((idx != -1) && (idx < draw.index(bottom))) bottom = item
  })
  // if(draw.index(bottom) < 0)
    // console.log('something wrong', points)
  return bottom
}

export function putBehindPoints(draw, points, cover, element) {
    // TODO: The order of the element should only be manipulated when the component first time constructed in editor.
    // After that, user can change the order of the component, and that order should be keeped even after reconstruction.
    //
    // find the most bottom point
    // FIXME: there's a bug in svgjs. somehow it's possible have an element with index = -1
    // even it's indeed a child of draw. (weird)
    const bottom = findBottom(draw, points)
    if (draw.index(bottom) > 0) {
      cover.insertBefore(bottom)
      element.insertBefore(cover)
    }
}

///
/// Shape
///

export class ShapeComponent extends Component {
  constructor({draw, element, cover, points /*, isHiddenPoint */}) {
    console.assert(draw, "draw is required")
    console.assert(element, "element is required")
    console.assert(cover, "cover is required")
    console.assert(points, "points is required")

    super({draw, element})
    const point_refs = points.map(p => p.attr(COMPONENT_NO_ATTR))
    const refs = point_refs.join(',')
    if (refs.length > 1) { // Axis has no refs to other components.
      // console.log(this, refs, refs.length)
      element.attr(COMPONENT_REFS_ATTR, point_refs.join(','))
    }
    this.points = points
    cover.attr(OF_ATTR, this.component_no)
      .attr('fill', DEFAULT_TRANSPARENT_COLOR) // fill with transparent color
    this.cover = cover

    // selectable by mousedown
    const mousedown = evt => {
      /*
      if (!isHiddenPoint) { // hidden point has no component.
        let pointComponents = points.map(p => p.component)
        if (element.hasClass('selected')) unselectComponent(pointComponents) 
        else selectComponent(pointComponents)
      }*/
      this.toggleSelected()
      evt.stopPropagation()
    }
    cover.on('mousedown', mousedown)
      .on('mouseenter', () => {
        if (!draw.dragTarget && !draw.dragSelectStart) {
          element.addClass('hover')
          cover.addClass('hover')
        }
      }).on('mouseleave', () => {
        element.removeClass('hover')
        cover.removeClass('hover')
      })
    element.on('mousedown', mousedown)
  }
  remove() {
    this.cover.remove()
    super.remove()
  }
  /// order interface, keep the cover over the element
  forward() { // override super
    this.cover.forward()
    this.element.forward()
    if (this.cover.next()?.hasClass('cover')) { // forward twice for the cover of previous component
      this.cover.forward()
      this.element.forward()
    }
  }
  backward() { // override super
    if (this.element.prev()?.hasClass('cover')) { // backward twice for the cover of previous component
      this.element.backward()
      this.cover.backward()
    }
    this.element.backward()
    this.cover.backward()
  }
  back() { // override super
    const selectBox = this.draw.findOne('.ui-select-box')
    selectBox.after(this.cover)
    selectBox.after(this.element)
  }
  front() { // override super
    this.element.front()
    this.cover.front()
  }
}

export class FillableShape extends ShapeComponent {
  constructor({draw, element, cover, points, isHiddenPoint}) {
    super({draw, element, cover, points, isHiddenPoint})
  }
}

export class LineBaseShape extends ShapeComponent {
  constructor({draw, element, cover, points, isHiddenPoint}) {
    super({draw, element, cover, points, isHiddenPoint})

    this.isAppending = null

    if (!isHiddenPoint) this.tracePoints(points, () => {
      element.fire('update')
    })
  }
  startPoint() {
    const p = this.points[0]
    let coord = {x: p.cx(), y: p.cy()}
    if (p.component)
      coord = pointOnScreen(p.component)
    return coord
  }
  direction() {
    const [p1, p2] = this.points
    // hidden points won't be transformed
    let coord1 = { x: p1.cx(), y: p1.cy() }
    let coord2 = { x: p2.cx(), y: p2.cy() }
    if (p1.component && p2.component) { // element of a component may be transformed
      coord1 = pointOnScreen(p1.component)
      coord2 = pointOnScreen(p2.component)
    }
    const dx = coord2.x - coord1.x
    const dy = coord2.y - coord1.y
    const length = Math.sqrt(dx ** 2 + dy **2)
    return {x: dx/length , y: dy/length}
  }
  // Appendable Interface
  endAppendMode() {
    if (this.isAppending) {
      this.isAppending.remove()
      this.isAppending = null
    }
  }
  toggleAppendMode(draw) {
    if (!this.isAppending) {
      const componentRef = this.component_no
      this.isAppending = addAppendingPinPoint({draw, componentRef})
      return
    } 
    this.endAppendMode()
  }
  getAttributes() {
    return ['id', 'class', 'cx', 'cy', 'text', 'stroke']
  }
}

