'use strict'

import { COMPONENT_NO_ATTR, COMPONENT_REFS_ATTR, DEFAULT_ANGLE_RADIUS} from '../common/define.js'
import { pointOnScreen } from '../common/math.js'

import { componentByNo } from './component.js'
import { FillableShape, putBehindPoints } from './shape.js'
import { addAppendingPinPoint } from './appending-point.js'
import { currentFillColor, currentStrokeColor } from '../module/color_picker.js'

function useCurrentColors(element) {
    if (window.FSG_BUILDER) { // run in editor
      const fillColor = currentFillColor()
      const strokeColor = currentStrokeColor()
      element.attr('fill', fillColor)
      element.attr('stroke', strokeColor)
    }
}

///
/// Circle
///

export class Circle extends FillableShape {
  constructor({ draw, radius, points, element, cover }) {
    super({ draw, element, cover, points })

    this.radius = radius

    const [cp, rp] = points
    this.tracePoints(points, () => {
      const r = Math.sqrt((rp.cx() - cp.cx()) ** 2 + (rp.cy() - cp.cy()) ** 2)
      this.radius = r
      element.radius(r)
      element.center(cp.cx(), cp.cy())
      cover.radius(r)
      cover.center(cp.cx(), cp.cy())
      element.fire('update')
    })
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
      const componentRef = this.component_no
      this.isAppending = addAppendingPinPoint({draw, componentRef})
      return
    }
    this.endAppendMode()
  }
}

export function addCircle({draw, componentRefs, element, cover, component_no}) {

  const points = componentRefs.map(no => componentByNo(draw, no).element)
  const [cp, rp] = points
  const radius = Math.sqrt((rp.cx() - cp.cx()) ** 2 + (rp.cy() - cp.cy()) ** 2)
  if (!element) {
    element = draw.circle().radius(radius).center(cp.cx(), cp.cy())
      .attr('class', 'circle dashed shape component selected none')
      // .attr('filter', 'url(#filter_shadow)')
      // .attr('filter', 'url(#filter_blur)')
      // .attr('filter', 'url(#filter_color_matrix)')
      // .attr('filter', 'url(#filter_shadow)')

    useCurrentColors(element)
    cover = draw.circle().radius(radius).center(cp.cx(), cp.cy()).attr('class', 'cover')
    putBehindPoints(draw, points, cover, element)
  }
  if (component_no) element.attr(COMPONENT_NO_ATTR, component_no)

  return new Circle({draw, radius, points, element, cover, component_no})
}

///
/// Polygon
///

class Polygon extends FillableShape {
  constructor({ draw, points, element, cover }) {
    super({ draw, element, cover, points })

    this.tracePoints(points, () => {
      let pts = points.map(p => {
        const coord = pointOnScreen(p.component)
        return [coord.x, coord.y]
      })
      element.plot(pts)
      cover.plot(pts)
    })
  }
}

export function addPolygon({draw, componentRefs, element, cover, component_no}) {

  const points = componentRefs.map(no => componentByNo(draw, no).element)
  const pts = points.map(p => [p.cx(), p.cy()])
  if (!element) {
    element = draw.polygon(pts)
      .attr('class', 'polygon dashed shape component selected none') 

    useCurrentColors(element)
    cover = draw.polygon(pts).attr('class', 'cover')
    putBehindPoints(draw, points, cover, element)
  }
  if (component_no) element.attr(COMPONENT_NO_ATTR, component_no)

  return new Polygon({ draw, points, element, cover })
}

///
/// Arc
///

function arcOf(p1, p2, p3, large_arc = false) {
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
  constructor({draw, points, element, cover}) {
    super({draw, element, cover, points})

    const large_arc = element.attr('large_arc')
    if (typeof large_arc === 'undefined')
      this.large_arc = false
    else
      this.large_arc = (large_arc == 'true') ? true : false
    const [p1, p2, p3] = points
    this.tracePoints(points, () => {
      const arcPath = arcOf(p1, p2, p3, this.large_arc)
      element.plot(arcPath)
      cover.plot(arcPath)
    })

    const componentRefs = points.map(point => {
      // watch point remove event
      point.on('remove', this.remove.bind(this))
      return point.attr('component_no')
    })
    element.attr(COMPONENT_REFS_ATTR, componentRefs.join(','))
  }
  toggleMode() {
    this.large_arc = !this.large_arc
    this.element.attr('large_arc', (this.large_arc) ? 'true' : 'false')
    this.points[0].fire('update')
  }
}

export function addAngle({ draw, componentRefs, element, cover, component_no }) {

  let points = componentRefs.map(no => componentByNo(draw, no).element)

  if (!element) {
    const [p1, p2, p3] = points
    const arcPath = arcOf(p1, p2, p3, false /* large_arc */)
    // console.log(arcPath)
    element = draw.path(arcPath).attr('class', 'angle shape component selected none')
    useCurrentColors(element)
    cover = draw.path(arcPath).attr('class', 'cover')
    putBehindPoints(draw, points, cover, element)
  }
  if (component_no) element.attr(COMPONENT_NO_ATTR, component_no)

  return new Arc({draw, points, element, cover})
}

