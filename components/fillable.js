'use strict'

import { 
  NO_ATTR,
  DEFAULT_ANGLE_RADIUS,
  FSG_FILL_NONE_ATTR,
  FSG_SHAPE_ATTR,
} from '../common/define.js'
import { pointOnScreen } from '../common/math.js'

import { componentByNo } from './component.js'
import { Shape, putBehindPoints } from './shape.js'
import { addAppendingPinPoint } from './appending-point.js'
import { useCurrentColors } from '../module/color_picker.js'

function coverForCircleElement(draw, element) {
  if (window.FSG_BUILDER) {
    const radius = element.attr('r')
    const cx = element.attr('cx')
    const cy = element.attr('cy')
    return draw.circle().radius(radius).center(cx, cy).attr('class', 'cover')
  }
  return null
}

export class FillableShape extends Shape {
  constructor({draw, refs, element, cover, points}) {
    super({draw, refs, element, cover, points})
  }
}

///
/// Circle
///

export class Circle extends FillableShape {
  constructor({ draw, refs, radius, points, element, cover }) {
    super({ draw, refs, element, cover, points })
    this.radius = radius
  }
  update() {
    const [cp, rp] = this.points
    const coord1 = pointOnScreen({ element: cp })
    const coord2 = pointOnScreen({ element: rp })
    const r = Math.sqrt((coord2.x - coord1.x) ** 2 + (coord2.y - coord1.y) ** 2)
    this.radius = r
    this.element.radius(r).center(cp.cx(), cp.cy())
    this.cover?.radius(r).center(cp.cx(), cp.cy())
    this.element.fire('update')
  }
  // Implement the Appendable Interface
  endAppendMode() {
    if (this.isAppending) {
      this.isAppending.remove()
      this.isAppending = null
    }
  }
  toggleAppendMode(draw) {
    if (!this.isAppending) {
      const componentRef = this.no
      this.isAppending = addAppendingPinPoint({draw, componentRef})
      return
    }
    this.endAppendMode()
  }
}

export function addCircle({draw, refs, element, cover, no}) {

  const points = refs.map(compNo => componentByNo(draw, compNo).element)
  const [cp, rp] = points
  const radius = Math.sqrt((rp.cx() - cp.cx()) ** 2 + (rp.cy() - cp.cy()) ** 2)
  if (!element) {
    element = draw.circle().radius(radius).center(cp.cx(), cp.cy())
      .attr('class', 'circle dashed')
      .attr(FSG_FILL_NONE_ATTR, true)
      .attr(FSG_SHAPE_ATTR, true)
    useCurrentColors(element)
    cover = draw.circle().radius(radius).center(cp.cx(), cp.cy()).attr('class', 'cover')
  }
  cover = cover ?? coverForCircleElement(draw, element)
  putBehindPoints(draw, points, cover, element)

  if (no) element.attr(NO_ATTR, no)

  return new Circle({ draw, refs, radius, points, element, cover })
}

///
/// Polygon
///

class Polygon extends FillableShape {
  constructor({ draw, refs, points, element, cover }) {
    super({ draw, refs, element, cover, points })
  }
  update() {
    let pts = this.points.map(p => {
      const coord = pointOnScreen(p.component)
      return [coord.x, coord.y]
    })
    this.cover?.plot(pts)
    this.element.plot(pts).fire('update')
  }
}

export function addPolygon({draw, refs, element, cover, no}) {

  const points = refs.map(compNo => componentByNo(draw, compNo).element)
  const pts = points.map(p => [p.cx(), p.cy()])
  if (!element) {
    element = draw.polygon(pts)
      .attr('class', 'polygon dashed') 
      .attr(FSG_FILL_NONE_ATTR, true)
      .attr(FSG_SHAPE_ATTR, true)

    useCurrentColors(element)
  }
  if (window.FSG_BUILDER) {
    cover = draw.polygon(pts).attr('class', 'cover')
  }
  putBehindPoints(draw, points, cover, element)
  if (no) element.attr(NO_ATTR, no)

  return new Polygon({ draw, refs, points, element, cover })
}

///
/// Arc
///

function arcPathOf(p1, p2, p3, large_arc = false) {
  // console.assert(p1, 'p1 must be defined')
  // console.assert(p2, 'p2 must be defined')
  // console.assert(p3, 'p3 must be defined')
  const radius = DEFAULT_ANGLE_RADIUS
  p2 = { x: p2.cx(), y: p2.cy() }
  const dx1 = p1.cx() - p2.x
  const dy1 = p1.cy() - p2.y
  const dx2 = p3.cx() - p2.x
  const dy2 = p3.cy() - p2.y
  const v1_length = Math.sqrt(dx1 ** 2 + dy1 ** 2)
  const v2_length = Math.sqrt(dx2 ** 2 + dy2 ** 2)
  if (v1_length == 0 || v2_length == 0) {
    return '' // empty path, draw nothing
  }
  let v1 = { x: dx1 / v1_length * radius, y: dy1 / v1_length * radius}
  let v2 = { x: dx2 / v2_length * radius, y: dy2 / v2_length * radius}
  const p1x = p2.x + v1.x
  const p1y = p2.y + v1.y
  const p3x = p2.x + v2.x
  const p3y = p2.y + v2.y
  let large = (v1.x * v2.y - v1.y * v2.x >= 0) ? 0 : 1
  let ccw = 1
  const error = 0.000001 // the error for floating point tolerance.
  if (!large_arc) {
    ccw = (large == 1) ? 0 : 1
    large = 0
    // support both cw and ccw right angles
    if (((Math.abs(v2.x + v1.y) < error) && (Math.abs(v2.y - v1.x) < error)) || 
      ((Math.abs(v1.x + v2.y) < error) && (Math.abs(v1.y - v2.x) < error)) ) { // right angle
      return String.raw`M ${p2.x} ${p2.y} L ${p1x} ${p1y} L ${p1x + v2.x} ${p1y + v2.y} L ${p3x} ${p3y} Z`
    }
  } else { // support the large arc mode the angle could be larger than 180 degree.
    // in this case, only ccw right angle is support.
    if ((Math.abs(v2.x + v1.y) < error) && (Math.abs(v2.y - v1.x) < error)) { // right angle
      return String.raw`M ${p2.x} ${p2.y} L ${p1x} ${p1y} L ${p1x + v2.x} ${p1y + v2.y} L ${p3x} ${p3y} Z`
    }
  }
  return String.raw`M ${p1x} ${p1y} A ${radius} ${radius} 0 ${large} ${ccw} ${p3x} ${p3y} L ${p2.x} ${p2.y} Z`
}

export class Arc extends FillableShape {
  constructor({draw, refs, points, element, cover}) {
    super({draw, refs, element, cover, points})

    const large_arc = element.attr('large_arc')
    if (typeof large_arc === 'undefined')
      this.large_arc = false
    else
      this.large_arc = (large_arc == 'true') ? true : false
  }
  update() {
    const [p1, p2, p3] = this.points
    const arcPath = arcPathOf(p1, p2, p3, this.large_arc)
    this.cover?.plot(arcPath)
    this.element.plot(arcPath).fire('update')
  }
  toggleMode() {
    this.large_arc = !this.large_arc
    this.element.attr('large_arc', (this.large_arc) ? 'true' : 'false')
    this.points[0].fire('update')
  }
}

export function addAngle({ draw, refs, element, cover, no }) {

  let points = refs.map(compNo => componentByNo(draw, compNo).element)

  if (!element) {
    const [p1, p2, p3] = points
    const arcPath = arcPathOf(p1, p2, p3, false /* large_arc */)
    // console.log(arcPath)
    element = draw.path(arcPath)
      .attr('class', 'angle')
      .attr(FSG_FILL_NONE_ATTR, true)
      .attr(FSG_SHAPE_ATTR, true)
    useCurrentColors(element)
  }
  if (window.FSG_BUILDER) {
    cover = draw.path(element.array()).attr('class', 'cover')
  }
  putBehindPoints(draw, points, cover, element)
  if (no) element.attr(NO_ATTR, no)

  return new Arc({draw, refs, points, element, cover})
}

