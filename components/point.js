'use strict'

import { POINT_RADIUS, COMPONENT_NO_ATTR, COMPONENT_REFS_ATTR } from '../common/define.js'
import { intersect, projectPointOnLine, intersectLineAndCircle, twoCirclesIntersection, pointOnScreen } from '../common/math.js'
import { Component, componentByNo } from './component.js'
import { LineBaseShape } from './line.js'
import { currentStrokeColor } from '../module/color_picker.js'


function setStyle(element) {
  const strokeColor = currentStrokeColor()
  element.attr('stroke', strokeColor)
}

///
/// UnSelectablePoint
/// 
export class UnSelectablePoint extends Component {
  constructor({ draw, element }) {
    super({draw, element})
    unselectComponent(draw, this) 
  }
  select() {
    // do nothing.
  }
  unselect() {
    // do nothing.
  }
  getAttributes() {
    console.assert(true, 'unselectable point should not be inspected')
    return []
  }
}


//
// override could prevent event handler explosion for better performance..
//
export class SelectablePoint extends Component {
  constructor({draw, element, override}) {
    if (!override) {
      element.on('mousedown', evt => {
        element.lastEvent = 'mousedown'
        evt.stopPropagation()
      }).on('mouseup', () => {
        if (element.lastEvent == 'mousedown') this.toggleSelected()
        element.lastEvent = 'mouseup'
      })
    }
    super({draw, element})
  }
  getAttributes() {
    return ['id', 'class', 'cx', 'cy', 'text']
  }
}

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
        element.addClass('dragging')
        draw.dragTarget = element
      }).on('dragend', () => {
        element.removeClass('dragging')
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
/// selectable, draggable
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
  return new Point({ draw, coord, element, component_no })
}

///
/// IntersectPoint
/// Non-moveable, location decided by the target components: 
/// [line, selectable point], [line, line], [line, circle], [circle, circle]
/// removed when target components were removed.
///

export class IntersectPoint extends SelectablePoint {
  constructor({ draw, index, componentRefs, element }) {
    super({ draw, element })
    this.index = index
    console.assert(typeof index !== 'undefined', 'index should be defined')
    element.attr(COMPONENT_REFS_ATTR, componentRefs.join(','))

    // watch components
    const refComponents = componentRefs.map(no => componentByNo(draw, no))
    this.refComponents = refComponents
    refComponents.forEach(target => {
      target.element.on('update', this.update.bind(this))
      target.element.on('remove', this.remove.bind(this))
    })
  }
  remove() {
    this.refComponents.forEach(target => {
      target.element.off('update', this.update)
    })
    super.remove()
  }
  update() {
    // console.log('update', this.element)
    const refComponents = this.refComponents
    console.assert(refComponents)
    // Project the point on line
    if (refComponents[1] instanceof SelectablePoint) {
      const [line, point] = refComponents
      const coord = pointOnScreen(point)
      // const projectPoint = projectPointOnLine(center, line.startPoint(), line.direction())
      const projectPoint = projectPointOnLine(coord, line.startPoint(), line.direction())
      this.element.center(projectPoint.x, projectPoint.y)
      this.element.fire('update')
      return
    }

    if (refComponents[0] instanceof LineBaseShape) { // line + line
      if (refComponents[1] instanceof LineBaseShape) {
        const [l1, l2] = refComponents
        // console.log(l1.direction(), l2.direction())
        const p = intersect(l1.startPoint(), l1.direction(), l2.startPoint(), l2.direction())
        // console.log(p)
        if (!p) return
        this.element.center(p.x, p.y)
      } else { // line + circle
        const [line, circle] = refComponents
        // console.log(line, circle, circle.radius)
        const intersectPoints = intersectLineAndCircle(line.startPoint(), line.direction(), circle.center(), circle.radius)
        // console.assert(intersectPoints, 'intersect point must be defined', intersectPoints)
        if (!intersectPoints) return
        const p = intersectPoints[this.index]
        if (!p) {
          console.log(this.index)
        } else 
        this.element.center(p.x, p.y)
      }
    } else {
      if (refComponents[1] instanceof LineBaseShape) { // circle + line
        const [circle, line] = refComponents
        const intersectPoints = intersectLineAndCircle(line.startPoint(), line.direction(), circle.center(), circle.radius)
        if (!intersectPoints) return
        const p = intersectPoints[this.index]
        this.element.center(p.x, p.y)
      } else { // two circles
        const [circle1, circle2] = refComponents
        const c1 = { a: circle1.center().x, b: circle1.center().y, r: circle1.radius }
        const c2 = { a: circle2.center().x, b: circle2.center().y, r: circle2.radius }
        const intersectPoints = twoCirclesIntersection(c1, c2)
        if (!intersectPoints) return
        const p = intersectPoints[this.index]
        this.element.center(p.x, p.y)
      }
    }
    this.element.fire('update')
  }
}

export function addIntersectPoint({ draw, coord, index, componentRefs, element, component_no })  {
  if (!coord) coord = {x: 0, y: 0}
  if (!element) {
    console.assert(typeof index !== 'undefined', 'index must be defined')
    element = draw.circle(POINT_RADIUS)
    .move(coord.x - POINT_RADIUS/2, coord.y - POINT_RADIUS/2)
    .attr('class', 'intersect-point component')
    .attr('index', index)
  } else {
    index = element.attr('index')
    console.assert(typeof index !== 'undefined', 'index must be defined')
  }
  if (component_no) element.attr(COMPONENT_NO_ATTR, component_no)
  return new IntersectPoint({ draw, index, componentRefs, element })
}

///
/// ParallelPoint
/// removed after the ref components are removed.
///
export class ParallelPoint extends UnSelectablePoint {
  constructor({ draw, componentRefs, element }) {
    super({ draw, element })

    element.attr(COMPONENT_REFS_ATTR, componentRefs.join(','))

    // watch components
    const refComponents = componentRefs.map(no => componentByNo(draw, no))
    this.refComponents = refComponents
    refComponents.forEach(target => {
      target.element.on('update', this.update.bind(this))
      target.element.on('remove', this.remove.bind(this))
    })
  }
  remove() {
    this.refComponents.forEach(target => {
      target.element.off('update', this.update)
    })
    super.remove()
  }
  update() {
    const [line, point] = this.refComponents
    const center = point.center()
    const direction = line.direction()
    const coord = {x: center.x + direction.x * 20, y: center.y + direction.y * 20}
    this.element.center(coord.x, coord.y)
    this.element.fire('update')
  }
}

export function addParallelPoint({ draw, coord, componentRefs, element, component_no })  {
  if (!element) element = draw.circle(POINT_RADIUS)
    .move(coord.x - POINT_RADIUS/2, coord.y - POINT_RADIUS/2)
    .attr('class', 'parallel-point component')
  if (component_no) element.attr(COMPONENT_NO_ATTR, component_no)
  return new ParallelPoint({ draw, componentRefs, element })
}

///
/// PerpPoint 
/// removed after the ref components are removed.
///
export class PerpPoint extends UnSelectablePoint {
  constructor({ draw, componentRefs, element }) {
    super({ draw, element })

    element.attr(COMPONENT_REFS_ATTR, componentRefs.join(','))

    // watch components
    const refComponents = componentRefs.map(no => componentByNo(draw, no))
    this.refComponents = refComponents
    refComponents.forEach(target => {
      target.element.on('update', this.update.bind(this))
      target.element.on('remove', this.remove.bind(this))
    })
  }
  remove() {
    this.refComponents.forEach(target => {
      target.element.off('update', this.update)
    })
    super.remove()
  }
  update() {
    const [line, point] = this.refComponents
    const direction = line.direction()
    const p = pointOnScreen(point)
    const coord = {x: p.x - direction.y * 20, y: p.y + direction.x * 20}
    this.element.center(coord.x, coord.y)
    this.element.fire('update')
  }
}

export function addPerpPoint({ draw, coord, componentRefs, element, component_no })  {
  if (!element) element = draw.circle(POINT_RADIUS)
    .move(coord.x - POINT_RADIUS/2, coord.y - POINT_RADIUS/2)
    .attr('class', 'perp-point component')
  if (component_no) element.attr(COMPONENT_NO_ATTR, component_no)
  return new PerpPoint({ draw, componentRefs, element })
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
      element.addClass('dragging')
      draw.dragTarget = element
    }).on('dragend', () => {
      // console.log('dragend')
      element.removeClass('dragging')
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

///
/// MidPoint
///
export class MidPoint extends SelectablePoint {
  constructor({ draw, componentRefs, element }) {
    super({ draw, element })

    element.attr(COMPONENT_REFS_ATTR, componentRefs.join(','))

    // watch components
    const refComponents = componentRefs.map(no => componentByNo(draw, no))
    this.refComponents = refComponents
    refComponents.forEach(target => {
      target.element.on('update', this.update.bind(this))
      target.element.on('remove', this.remove.bind(this))
    })
  }
  remove() {
    this.refComponents.forEach(target => {
      target.element.off('update', this.update)
    })
    super.remove()
  }
  update() {
    // console.log('update', this.element)
    const refComponents = this.refComponents
    console.assert(refComponents)
    // Project the point on line
    const [p1, p2] = refComponents
    const coord1 = p1.center()
    const coord2 = p2.center()
    const coord = {x: (coord1.x + coord2.x) / 2, y: (coord1.y + coord2.y) /2 }
    this.element.center(coord.x, coord.y)
    this.element.fire('update')
    return
  }
}

export function addMidPoint({ draw, componentRefs, element, component_no })  {
  const points = componentRefs.map(no => componentByNo(draw, no).element)
  if (!element) {
    const [p1, p2] = points
    const coord1 = {x: p1.cx(), y: p1.cy() }
    const coord2 = {x: p2.cx(), y: p2.cy() }
    const coord = {x: (coord1.x + coord2.x) / 2, y: (coord1.y + coord2.y) /2 }
     element = draw.circle(POINT_RADIUS)
      .move(coord.x - POINT_RADIUS/2, coord.y - POINT_RADIUS/2)
      .attr('class', 'mid-point component')
  }
  if (component_no) element.attr(COMPONENT_NO_ATTR, component_no)
  return new MidPoint({ draw, componentRefs, element })
}

