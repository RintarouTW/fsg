'use strict'

import { FSG_DRAGGING_ATTR, POINT_RADIUS } from '../common/define.js'
import {
  intersect,
  intersectLineAndCircle,
  distanceOfCoords,
  lengthOfVector,
  projectPointOnLine,
  twoCirclesIntersection
} from '../common/math.js'
import { componentByNo } from '../components/component.js'
import { addIntersectPoint } from '../components/point.js'
import { addPinPoint } from '../components/draggable-point.js'
import { LineShape } from '../components/line.js'

export function init_appending_point_module(draw) {
  draw.addAppendingPinPoint = addAppendingPinPoint
  draw.endAppendingPoint = evt => {
    if (!draw.appendingPoint) return false
    evt.preventDefault()
    evt.stopPropagation()
    const component = draw.appendingPoint.component
    const action = (component instanceof AppendingPinPoint) ? addPinPoint : addIntersectPoint
    const pointInfo = component.done()
    draw.fsg.history.doAction(draw, action, pointInfo)
    // don't set lastEvent to 'mousedown', so it won't add new point on the next mouse up.
    draw.appendingPoint = null
    return true
  }
  draw.cancelAppendingPoint = () => {
    const component = draw.appendingPoint.component
    if (component instanceof AppendingPinPoint) 
      component.targetComponent.endAppendMode(draw) // target component end appending mode
    component.remove()
  }
}

///
/// AppendingPinPoint is not a component
/// pin on the target component.
/// location relative to the target component.
/// auto removed when target component is removed.
///

export class AppendingPinPoint {
  constructor({ draw, componentRef, element }) {

    this.element = element
    element.component = this

    // works like being dragged
    draw.appendingPoint = element
    element.on('move', () => element.fire('update', { target: this }) )

    // watch the target component
    const targetComponent = componentByNo(draw, componentRef)
    console.assert(targetComponent, 'cant find target compoenent', componentRef)
    targetComponent.element.on('update', this.update.bind(this))
    targetComponent.element.on('remove', this.remove.bind(this))
    this.draw = draw
    this.targetComponent = targetComponent
    this.type = (targetComponent.element.hasClass('circle')) ? 'circle' : 'line'
    this.update()
  }
  done() { // confirmed to add real pin point.
    const draw = this.draw
    const type = this.type
    const coord = { x: this.element.cx(), y: this.element.cy() }
    const refs = [this.targetComponent.no]
    this.remove()
    this.targetComponent.endAppendMode()
    return {draw, coord, type, refs}
  }
  remove() {
    this.targetComponent.element.off('update', this.update)
    this.targetComponent.element.off('remove', this.remove)
    this.element.remove()
    this.draw.appendingPoint = null
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
      const vLen = lengthOfVector(v) 
      if (vLen == 0) return
      const ratio = radius / vLen
      const coord = { x: center.x + v.x * ratio, y: center.y + v.y * ratio }
      this.element.center(coord.x, coord.y)
    }
  }
}

//
// ref components: lines, circle
//
function addAppendingPinPoint({ draw, componentRef })  {
  console.assert(componentRef, 'componentRef must be defined')
  const element = draw.circle(POINT_RADIUS)
    .move(draw.mousePosition.x - POINT_RADIUS/2, draw.mousePosition.y - POINT_RADIUS/2)
    .attr('class', 'pin-point')
    .attr(FSG_DRAGGING_ATTR, true)
  return new AppendingPinPoint({ draw, componentRef, element })
}

///
/// AppendingIntersectPoint
///
export class AppendingIntersectPoint {
  constructor({ draw, element, intersectPoints, refs, index}) {

    this.element = element
    element.component = this

    // works like being dragged
    draw.appendingPoint = element
    element.on('move', () => element.fire('update', { target: this }) )

    this.draw = draw
    this.intersectPoints = intersectPoints
    this.refs = refs
    this.index = index
    this.update()
  }
  done() { // confirmed to add real pin point.
    const coord = this.intersectPoints[this.index]
    this.remove()
    return {draw : this.draw, coord, index: this.index, refs : this.refs}
  }
  remove() {
    this.element.remove()
    this.draw.appendingPoint = null
  }
  update() {
    const distance0 = distanceOfCoords(this.draw.mousePosition, this.intersectPoints[0])
    const distance1 = distanceOfCoords(this.draw.mousePosition, this.intersectPoints[1])
    const index = (distance0 < distance1) ? 0 : 1
    const coord = this.intersectPoints[index]
    this.element.center(coord.x, coord.y)
    this.index = index
  }
}

function addAppendingIntersectPoint({ draw, intersectPoints, refs }) {
  const distance0 = distanceOfCoords(draw.mousePosition, intersectPoints[0])
  const distance1 = distanceOfCoords(draw.mousePosition, intersectPoints[1])
  const index = (distance0 < distance1) ? 0 : 1
  const coord = intersectPoints[index]
  const element = draw.circle(POINT_RADIUS)
    .center(coord.x, coord.y)
    .attr('class', 'pin-point')
  return new AppendingIntersectPoint({ draw, element, intersectPoints, refs, index })
}

export function chooseIntersectPoint(draw, intersectableComponents) {
  if (intersectableComponents[0] instanceof LineShape) {
    if (intersectableComponents[1] instanceof LineShape) { // intersect two lines
      const [l1, l2] = intersectableComponents
      const coord = intersect(l1.startPoint(), l1.direction(), l2.startPoint(), l2.direction())
      draw.fsg.history.doAction(draw, addIntersectPoint, {draw, coord, index : 0, refs : [l1.no, l2.no]})
    } else { // line + circle
      const [line, circle] = intersectableComponents
      const intersectPoints = intersectLineAndCircle(line.startPoint(), line.direction(), circle.center(), circle.radius)
  // enter point choose mode
  addAppendingIntersectPoint({draw, intersectPoints, refs : [line.no, circle.no]})
    }
    return
  } 
  if (intersectableComponents[1] instanceof LineShape) { // circle + line
    const [circle, line] = intersectableComponents
    const intersectPoints = intersectLineAndCircle(line.startPoint(), line.direction(), circle.center(), circle.radius)
  // enter point choose mode
  addAppendingIntersectPoint({draw, intersectPoints, refs : [line.no, circle.no]})
    return
  } 
  // two circles
  const [circle1, circle2] = intersectableComponents
  const c1 = { a: circle1.center().x, b: circle1.center().y, r: circle1.radius }
  const c2 = { a: circle2.center().x, b: circle2.center().y, r: circle2.radius }
  const intersectPoints = twoCirclesIntersection(c1, c2)
  if (!intersectPoints) return
  // enter point choose mode
  addAppendingIntersectPoint({draw, intersectPoints, refs : [circle1.no, circle2.no]})
}

