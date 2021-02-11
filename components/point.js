'use strict'

import { POINT_RADIUS, COMPONENT_NO_ATTR, COMPONENT_REFS_ATTR } from '../common/define.js'
import { intersect, projectPointOnLine, intersectLineAndCircle, twoCirclesIntersection, pointOnScreen } from '../common/math.js'
import { Component, componentByNo } from './component.js'
import { LineBaseShape } from './line.js'

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
        // console.log(p, v1, v2, det)
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


