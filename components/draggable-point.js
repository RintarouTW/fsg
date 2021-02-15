'use strict'

import { POINT_RADIUS, COMPONENT_NO_ATTR, COMPONENT_REFS_ATTR, FSG_DRAGGING_ATTR } from '../common/define.js'
import { projectPointOnLine } from '../common/math.js'
import { componentByNo } from './component.js'
import { SelectablePoint } from './point.js'
import { currentStrokeColor } from '../module/color_picker.js'

function setStyle(element) {
  const strokeColor = currentStrokeColor()
  element.attr('stroke', strokeColor)
}

///
/// DraggablePoint
///
export class DraggablePoint extends SelectablePoint {
  constructor({draw, element, override}) {
    if (!override) {
      element.on('mousedown', evt => {
        element.lastEvent = 'mousedown'
        element.fire('dragstart', { dragTarget: element})
        evt.stopPropagation()
      }).on('mouseup', () => {
        if (element.lastEvent == 'mousedown') this.toggleSelected()
        element.lastEvent = 'mouseup'
        element.fire('dragend')
      }).on('mousemove', () => {
        element.lastEvent = 'mousemove'
      }).on('dragstart', () => {
        element.attr(FSG_DRAGGING_ATTR, true)
        draw.dragTarget = element
      }).on('dragend', () => {
        element.attr(FSG_DRAGGING_ATTR, null)
        draw.dragTarget = null
      }).on('dragmove', () => {
        element.fire('update', { target: this })
      })
      override = true
    }
    super({draw, element, override})
  }
}

///
/// Point
/// Selectable and Draggable point without cover
/// @attributes (state): 
///  - geometry: r, cx, cy
///  - style: fill, stroke
///  - relation: component_no
///  - text: label
/// 

export class Point extends DraggablePoint {
  constructor({ draw, element }) {
    super({draw, element})
  }
}

export function addPoint({ draw, coord, element, component_no }) {
  if (!coord) coord = { x: 0, y: 0 }
  if (!element) {
    element = draw.circle(POINT_RADIUS)
      .move(coord.x - POINT_RADIUS/2, coord.y - POINT_RADIUS/2)
      .attr('class', 'point component')
    setStyle(element)
  }
  if (component_no) element.attr(COMPONENT_NO_ATTR, component_no)
  return new Point({ draw, element })
}


///
/// PinPoint
/// pinned on the target component.
/// location relative to the target component.
/// auto removed when target component is removed.
/// draggable
///

export class PinPoint extends DraggablePoint {
  constructor({ draw, type, componentRef, element }) {
    const override = true
    super({ draw, element, override})

    this.type = type

    element.attr(COMPONENT_REFS_ATTR, componentRef)

    // override for better performance
    element.on('mousedown', evt => {
      // console.log('mousedown')
      element.lastEvent = 'mousedown'
      element.fire('dragstart', { dragTarget: element })
      evt.stopPropagation()
    }).on('mouseup', () => {
      if (element.lastEvent == 'mousedown') this.toggleSelected()
      element.lastEvent = 'mouseup'
      element.fire('dragend')
    }).on('mousemove', () => {
      element.lastEvent = 'mousemove'
    }).on('dragstart', () => {
      // console.log('drag start')
      element.attr(FSG_DRAGGING_ATTR, true)
      draw.dragTarget = element
    }).on('dragend', () => {
      // console.log('dragend')
      element.attr(FSG_DRAGGING_ATTR, null)
      this.calcState()
      draw.dragTarget = null
    }).on('dragmove', () => {
      // console.log('dragmove')
      element.fire('update', { target: this })
    })

    // watch components
    const targetComponent = componentByNo(draw, componentRef)
    targetComponent.element.on('update', this.update.bind(this))
    targetComponent.element.on('remove', this.remove.bind(this))
    this.targetComponent = targetComponent
    this.calcState()
  }
  remove() {
    this.targetComponent.element.off('update', this.update)
    super.remove()
  }
  calcState() {
    const element = this.element
    // console.log(this.type)
    if (this.type == 'line') { // remember the length
      const line = this.targetComponent
      const start = line.startPoint()
      const direction = line.direction()
      const dx = element.cx() - start.x
      const dy = element.cy() - start.y
      if (dx != 0) this.distance = dx / direction.x
      else if (dy != 0) this.distance = dy / direction.y
      else this.distance = 0
    } else { // remember the unit vector
      const circle = this.targetComponent
      const radius = circle.radius
      if (radius == 0) {
        this.unitVector = { x: 0, y: 0 }
      } else {
        const start = { x: circle.element.cx(), y: circle.element.cy() }
        const end = { x: element.cx(), y: element.cy() }
        this.unitVector = { x: (end.x - start.x) / radius, y: (end.y - start.y) / radius }
      }
    }
  }
  update() {
    // on drag mode: (working likes appending)
    //   point should be mouse position while appending
    // non appending mode:
    //   attached to line:
    //      keep the distance to the center of line?
    //   attched to circle:
    //      keep the angle(unit direction relative to the center of the circle)
    //
    // console.log(this.draw.dragTarget)
    if (this.draw.dragTarget == this.element) { // on dragging
      if (this.type == 'line') {
        const line = this.targetComponent
        const projectPoint = projectPointOnLine(this.draw.mousePosition, line.startPoint(), line.direction())
        this.element.center(projectPoint.x, projectPoint.y)
      } else {
        const circle = this.targetComponent.element
        const radius = this.targetComponent.radius
        if (radius == 0) return
        const center = { x: circle.cx(), y: circle.cy() }
        const v = { x: this.draw.mousePosition.x - center.x, y : this.draw.mousePosition.y - center.y }
        const ratio = radius / Math.sqrt( v.x ** 2 + v.y ** 2)
        const coord = { x: center.x + v.x * ratio, y: center.y + v.y * ratio }
        this.element.center(coord.x, coord.y)
      }
      this.element.fire('update')
      return
    }
    if (this.type == 'line') {
      const line = this.targetComponent
      const start = line.startPoint()
      const direction = line.direction()
      const coord = { x: start.x + direction.x * this.distance, y: start.y + direction.y * this.distance}
      this.element.center(coord.x, coord.y)
    } else {
      const targetComponent = this.targetComponent
      const circle = targetComponent.element
      const radius = targetComponent.radius
      if (radius == 0) return
      const center = { x: circle.cx(), y: circle.cy() }
      const v = this.unitVector
      const coord = { x: center.x + v.x * radius, y: center.y + v.y * radius }
      this.element.center(coord.x, coord.y)
    }
    this.element.fire('update')
  }
}

//
// ref components: lines, circle, polygon
//
export function addPinPoint({ draw, coord, type, componentRef, element, component_no })  {
  if (!element) element = draw.circle(POINT_RADIUS)
    .move(coord.x - POINT_RADIUS/2, coord.y - POINT_RADIUS/2)
    .attr('class', 'pin-point component')
  if (component_no) element.attr(COMPONENT_NO_ATTR, component_no)
  return new PinPoint({ draw, type, componentRef, element })
}

