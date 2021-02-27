'use strict'

import { 
  NO_ATTR,
  DEFAULT_ANGLE_RADIUS,
  DEFAULT_LENGTH_MARKER_WIDTH,
  DEFAULT_LENGTH_MARKER_DISTANCE,
  DEFAULT_LABEL_OFFSET_X,
  DEFAULT_LABEL_OFFSET_Y,
  FSG_FILL_NONE_ATTR,
  FSG_SHAPE_ATTR,
} from '../common/define.js'

import { lengthOfVector } from '../common/math.js'

import { componentByNo } from './component.js'
import { Shape, putBehindPoints } from './shape.js'
import { useCurrentColors } from '../module/color_picker.js'

///
/// ArrowedArcPath
///

function arrowedArcPathOf(p1, p2, p3, large_arc = false) {
  const radius = DEFAULT_ANGLE_RADIUS * 3
  p2 = { x: p2.cx(), y: p2.cy() }
  const d1 = { x: p1.cx() - p2.x, y: p1.cy() - p2.y }
  const d2 = { x: p3.cx() - p2.x, y: p3.cy() - p2.y }
  const d1Len = lengthOfVector(d1)
  const d2Len = lengthOfVector(d2)
  if (d1Len == 0 || d2Len == 0) return '' // empty path, draw nothing
  
  const v1 = { x: d1.x / d1Len * radius, y: d1.y / d1Len * radius}
  const v2 = { x: d2.x / d2Len * radius, y: d2.y / d2Len * radius}
  const p1x = p2.x + v1.x, p1y = p2.y + v1.y
  const p3x = p2.x + v2.x, p3y = p2.y + v2.y
  let large = (v1.x * v2.y - v1.y * v2.x >= 0) ? 0 : 1
  let ccw = 1
  if (!large_arc) {
    ccw = (large == 1) ? 0 : 1
    large = 0
  }
  return String.raw`M ${p1x} ${p1y} A ${radius} ${radius} 0 ${large} ${ccw} ${p3x} ${p3y}`
}

export class ArrowedArc extends Shape {
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
    const arcPath = arrowedArcPathOf(p1, p2, p3, this.large_arc)
    this.cover?.plot(arcPath)
    this.element.plot(arcPath).fire('update')
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

export function addAngleMarker({ draw, refs, element, cover, no }) {

  let points = refs.map(no => componentByNo(draw, no).element)

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
  if (no) element.attr(NO_ATTR, no)

  return new ArrowedArc({draw, refs, points, element, cover})
}

///
/// LengthMarker
///

// p1, p2 : element
function normalVec(p1, p2) {
  const vec = { x: p2.cx() - p1.cx(), y: p2.cy() - p1.cy() }
  const len = Math.sqrt(vec.x ** 2 + vec.y **2)
  if (len == 0) return { x: 0, y: 0 }
  return { x: -vec.y / len, y: vec.x / len } // normalized
}

// length could be negative
function stretchVec(vec, length) {
  return { x: vec.x * length, y: vec.y * length }
}

function lengthPathOf(p1, p2, distance) {
  const normal = normalVec(p1, p2)
  if (normal.x == 0 && normal.y == 0) return ''
  const width = DEFAULT_LENGTH_MARKER_WIDTH
  const offset = stretchVec(normal, distance)
  const widthOffset = stretchVec(normal, width)

  p1 = { x: p1.cx() + offset.x, y: p1.cy() + offset.y }
  p2 = { x: p2.cx() + offset.x, y: p2.cy() + offset.y }
  const w1 = { x : p1.x + widthOffset.x, y: p1.y + widthOffset.y }
  const w2 = { x : p1.x - widthOffset.x, y: p1.y - widthOffset.y }
  const w3 = { x : p2.x + widthOffset.x, y: p2.y + widthOffset.y }
  const w4 = { x : p2.x - widthOffset.x, y: p2.y - widthOffset.y }
  return String.raw`M ${w1.x} ${w1.y} L ${w2.x} ${w2.y}
  M ${w3.x} ${w3.y} L ${w4.x} ${w4.y}
  M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`
}

export class LengthMarker extends Shape {
  constructor({draw, refs, points, element, cover}) {
    super({draw, refs, element, cover, points})

   this.mark_on_right = false
  }
  update() {
    const [p1, p2] = this.points
    const distance = (!this.mark_on_right) ? DEFAULT_LENGTH_MARKER_DISTANCE : -DEFAULT_LENGTH_MARKER_DISTANCE
    const path = lengthPathOf(p1, p2, distance)
    this.cover?.plot(path)
    this.element.plot(path).fire('update')
  }
  center() {
    const distance = (!this.mark_on_right) 
      ?  (DEFAULT_LENGTH_MARKER_DISTANCE + 10)
      : -(DEFAULT_LENGTH_MARKER_DISTANCE + 10)
    const [p1, p2] = this.points
    const vec = normalVec(p1, p2)
    return {
      x: (p1.cx() + p2.cx()) / 2 + vec.x * distance - DEFAULT_LABEL_OFFSET_X - 4,
      y: (p1.cy() + p2.cy()) / 2 + vec.y * distance + DEFAULT_LABEL_OFFSET_Y + 8
    }
  }
  toggleMode() {
    this.mark_on_right = !this.mark_on_right
    this.element.attr('mark_on_right', (this.mark_on_right) ? 'true' : 'false')
    this.points[0].fire('update')
  }
}

export function addLengthMarker({ draw, refs, element, cover, no }) {

  let points = refs.map(no => componentByNo(draw, no).element)

  if (!element) {
    const [p1, p2] = points
    const path = lengthPathOf(p1, p2, DEFAULT_LENGTH_MARKER_DISTANCE)
    element = draw.path(path)
      .attr('class', 'length-marker')
      .attr(FSG_FILL_NONE_ATTR, true)
      .attr(FSG_SHAPE_ATTR, true)
    useCurrentColors(element)
  }
  if (window.FSG_BUILDER) {
    cover = draw.path(element.array()).attr('class', 'cover')
  }

  putBehindPoints(draw, points, cover, element)
  if (no) element.attr(NO_ATTR, no)

  return new LengthMarker({draw, refs, points, element, cover})
}

