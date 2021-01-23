'use strict'

import { POINT_RADIUS } from '../common/define.js'
import { projectPointOnLine } from '../common/math.js'
import { componentByNo } from './component.js'

///
/// AppendingPinPoint
/// pin on the target component.
/// location relative to the target component.
/// auto removed when target component is removed.
///

export class AppendingPinPoint {
  constructor({ draw, componentRef, element }) {

    this.element = element
    element.component = this

    // works like being dragged
    draw.dragTarget = element

    element.on('dragmove', () => {
      element.fire('update', { target: this })
    })
    // watch the target component
    const targetComponent = componentByNo(draw, componentRef)
    console.assert(targetComponent, 'cant find target compoenent', componentRef)
    targetComponent.element.on('update', this.update.bind(this))
    targetComponent.element.on('remove', this.remove.bind(this))
    this.draw = draw
    this.targetComponent = targetComponent
    if (targetComponent.element.hasClass('circle'))
      this.type = 'circle'
    else
      this.type = 'line'
  }
  remove() {
    this.targetComponent.element.off('update', this.update)
    this.targetComponent.element.off('remove', this.remove)
    this.element.remove()
  }
  done() { // confirmed to add real pin point.
    console.log('done')
    const draw = this.draw
    const type = this.type
    const coord = { x: this.element.cx(), y: this.element.cy() }
    const componentRef = this.targetComponent.component_no
    this.remove()
    return {draw, coord, type, componentRef}
  }
  update() {
    // appending mode:
    //   point should be mouse position while appending
    //   attached to line:
    //      keep the distance to the center of line?
    //   attched to circle:
    //      keep the angle(unit direction relative to the center of the circle)
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
  }
}

//
// ref components: lines, circle
//
export function addAppendingPinPoint({ draw, componentRef })  {
  console.assert(componentRef, 'componentRef must be defined')
  const element = draw.circle(POINT_RADIUS)
    .move(draw.mousePosition.x - POINT_RADIUS/2, draw.mousePosition.y - POINT_RADIUS/2)
    .attr('class', 'pin-point dragging')
  return new AppendingPinPoint({ draw, componentRef, element })
}

