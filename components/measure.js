'use strict'

import { 
  COMPONENT_NO_ATTR,
  COMPONENT_REFS_ATTR,
  DEFAULT_ANGLE_RADIUS,
  DEFAULT_LABEL_OFFSET_X,
  DEFAULT_LABEL_OFFSET_Y,
  FSG_FILL_NONE_ATTR,
  FSG_SHAPE_ATTR,
} from '../common/define.js'

import { componentByNo } from './component.js'
import { Shape, putBehindPoints } from './shape.js'
import { useCurrentColors } from '../module/color_picker.js'

///
/// ArrowedArcPath
///

function arrowedArcPathOf(p1, p2, p3, large_arc = false) {
  // console.assert(p1, 'p1 must be defined')
  // console.assert(p2, 'p2 must be defined')
  // console.assert(p3, 'p3 must be defined')
  const radius = DEFAULT_ANGLE_RADIUS * 3
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
  if (!large_arc) {
    ccw = (large == 1) ? 0 : 1
    large = 0
  }
  return String.raw`M ${p1x} ${p1y} A ${radius} ${radius} 0 ${large} ${ccw} ${p3x} ${p3y}`
}

export class ArrowedArc extends Shape {
  constructor({draw, points, element, cover}) {
    super({draw, element, cover, points})

    const large_arc = element.attr('large_arc')
    if (typeof large_arc === 'undefined')
      this.large_arc = false
    else
      this.large_arc = (large_arc == 'true') ? true : false
    const [p1, p2, p3] = points
    this.watchUpdate(points, () => {
      const arcPath = arrowedArcPathOf(p1, p2, p3, this.large_arc)
      element.plot(arcPath)
      cover?.plot(arcPath)
      element.fire('update')
    })

    const componentRefs = points.map(point => {
      // watch point remove event
      point.on('remove', this.remove.bind(this))
      return point.attr('component_no')
    })
    element.attr(COMPONENT_REFS_ATTR, componentRefs.join(','))
  }
  center() {
    const [p1, p2, p3] = this.points
    const radius = DEFAULT_ANGLE_RADIUS * 4

    let v1 = { x: p1.cx() - p2.cx(), y: p1.cy() - p2.cy() }
    const v1Len = Math.sqrt(v1.x ** 2 + v1.y **2)
    v1 = { x: v1.x / v1Len * radius, y: v1.y / v1Len * radius}

    let v2 = { x: p3.cx() - p2.cx(), y: p3.cy() - p2.cy() }
    const v2Len = Math.sqrt(v2.x ** 2 + v2.y **2)
    v2 = { x: v2.x / v2Len * radius, y: v2.y / v2Len * radius }

    const dir = { x: v2.y - v1.y, y: -(v2.x - v1.x) }
    const len = Math.sqrt(dir.x ** 2 + dir.y ** 2)

    if(len == 0) return {
      x: p2.cx() + v1.x - DEFAULT_LABEL_OFFSET_X - 4,
      y: p2.cy() + v1.y + DEFAULT_LABEL_OFFSET_Y + 8
    }

    const det = v1.x * v2.y - v1.y * v2.x
    console.log(v1, v2, det)
    const ratio = radius / len
    if (!this.large_arc && (det < 0)) {
      return {
        x: p2.cx() - dir.x * ratio - DEFAULT_LABEL_OFFSET_X - 4,
        y: p2.cy() - dir.y * ratio + DEFAULT_LABEL_OFFSET_Y + 8
      }
    }
    return { 
      x: p2.cx() + dir.x * ratio - DEFAULT_LABEL_OFFSET_X - 4,
      y: p2.cy() + dir.y * ratio + DEFAULT_LABEL_OFFSET_Y + 8
    }
  }
  toggleMode() {
    this.large_arc = !this.large_arc
    this.element.attr('large_arc', (this.large_arc) ? 'true' : 'false')
    this.points[0].fire('update')
  }
}

export function addArrowedAngle({ draw, componentRefs, element, cover, component_no }) {

  let points = componentRefs.map(no => componentByNo(draw, no).element)

  if (!element) {
    const [p1, p2, p3] = points
    const arcPath = arrowedArcPathOf(p1, p2, p3, false /* large_arc */)
    element = draw.path(arcPath)
      .attr('class', 'angle-marker')
      .attr(FSG_FILL_NONE_ATTR, true)
      .attr(FSG_SHAPE_ATTR, true)
    useCurrentColors(element)
  }
  if (window.FSG_BUILDER) {
    cover = draw.path(element.array()).attr('class', 'cover')
  }
  element.marker('end', draw.fsg.marker.vector_end_marker)

  putBehindPoints(draw, points, cover, element)
  if (component_no) element.attr(COMPONENT_NO_ATTR, component_no)

  return new ArrowedArc({draw, points, element, cover})
}

