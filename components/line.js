'use strict'

import { NO_ATTR, FSG_SHAPE_ATTR } from '../common/define.js'
import { clipping, pointOnScreen } from '../common/math.js'
import { componentByNo } from './component.js'
import { Shape, putBehindPoints } from './shape.js'
import { setStrokeColor } from '../module/color_picker.js'

export function coverForLineElement(draw, element) {
  if (window.FSG_BUILDER) {
    const coord1 = { x: element.attr('x1'), y: element.attr('y1') }
    const coord2 = { x: element.attr('x2'), y: element.attr('y2') }
    const cover = draw.line(coord1.x, coord1.y, coord2.x, coord2.y).attr('class', 'cover')
    element.after(cover)
    return cover
  }
  return null
}

export class LineShape extends Shape {
  constructor({draw, element, refs, cover, points}) {
    super({draw, element, refs, cover, points})
    this.isAppending = null
  }
  startPoint() {
    const p = this.points[0]
    let coord = {x: p.cx(), y: p.cy()}
    if (p.component)
      coord = pointOnScreen(p.component)
    return coord
  }
  updateDirection() {
    const [p1, p2] = this.points
    // element of a component may be transformed
    const coord1 = pointOnScreen({ element: p1})
    const coord2 = pointOnScreen({ element: p2})
    const dx = coord2.x - coord1.x
    const dy = coord2.y - coord1.y
    const length = Math.sqrt(dx ** 2 + dy **2)
    if (length != 0)
      this._direction = {x: dx / length , y: dy / length}
  }
  direction() {
    if (!this._direction) this.updateDirection()
    return this._direction
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
      const componentRef = this.no
      this.isAppending = draw.addAppendingPinPoint({draw, componentRef})
      return
    } 
    this.endAppendMode()
  }
  getAttributes() {
    return ['id', 'class', 'cx', 'cy', 'text', 'stroke']
  }
}

///
/// Line
///

export class Line extends LineShape {
  constructor({draw, element, refs, points, cover}) {
    super({draw, element, refs, cover, points})
  }
  update() {
    const [p1, p2] = this.points
    const box = this.draw.bbox()
    const coord1 = pointOnScreen(p1.component)
    const coord2 = pointOnScreen(p2.component)
    // console.log(box, coord1, coord2)
    const [clip1, clip2] = clipping(box, coord1, coord2)
    if (!clip1 || !clip2) return
    this.element.plot(clip1.x, clip1.y, clip2.x, clip2.y)
    this.cover?.plot(clip1.x, clip1.y, clip2.x, clip2.y)
    this.updateDirection()
    this.element.fire('update')
  }
}

export function addLine({draw, refs, element, cover, no}) {

  const points = refs.map(compNo => componentByNo(draw, compNo).element)
  if (!element) {
    const box = draw.bbox()
    const [p1, p2] = points
    console.assert(p1, 'p1 must be defined', points)
    console.assert(p2, 'p2 must be defined', points)

    const coord1 = { x: p1.cx(), y: p1.cy() }
    const coord2 = { x: p2.cx(), y: p2.cy() }
    const [clip1, clip2] = clipping(box, coord1, coord2)
    element = draw.line(clip1.x, clip1.y, clip2.x, clip2.y)
      .attr('class', 'line dashed')
      .attr(FSG_SHAPE_ATTR, true)
    setStrokeColor(element)
    // element.attr('filter', 'url(#filter_shadow)')
    cover = draw.line(clip1.x, clip1.y, clip2.x, clip2.y).attr('class', 'cover')
  }
  cover = cover ?? coverForLineElement(draw, element) 
  putBehindPoints(draw, points, cover, element)

  if (no) element.attr(NO_ATTR, no)

  return new Line({ draw, element, refs, points, cover })
}

///
/// Ray
///

function getClipped(draw, p1, p2) {
  console.assert(p1, 'p1 must be defined')
  console.assert(p2, 'p2 must be defined')

  const box = draw.bbox()
  // console.log(box)
  const [clip1, clip2] = clipping(box, {x: p1.x, y: p1.y}, {x: p2.x, y: p2.y})
  if (!clip1 || !clip2) return
  // if (typeof clip1 === 'undefined' || typeof clip2 === 'undefined') return
  // console.assert(clip1, 'clip1 must be defined')
  // console.assert(clip2, 'clip2 must be defined')

  const v = { x: p2.x - p1.x, y: p2.y - p1.y }
  const v1 = { x: clip1.x - p1.x, y: clip1.y - p1.y }
  let clip = clip1
  if (v.x != 0) {
    if (v1.x * v.x < 0) clip = clip2
  } else {
    if (v1.y * v.y < 0) clip = clip2
  }
  return clip
}

export class Ray extends LineShape {
  constructor({ draw, element, refs, points, cover }) {
    super({draw, element, refs, cover, points})
  }
  update() {
    const [p1, p2] = this.points
    const coord1 = pointOnScreen(p1.component)
    const coord2 = pointOnScreen(p2.component)
    const clip = getClipped(this.draw, coord1, coord2)
    if (!clip) return

    this.element.plot(coord1.x, coord1.y, clip.x, clip.y)
    this.cover?.plot(coord1.x, coord1.y, clip.x, clip.y)
    this.updateDirection()
    this.element.fire('update')
  }
}

export function addRay({draw, element, refs, cover, no}) {

  const points = refs.map(compNo => componentByNo(draw, compNo).element)
  if (!element) {
    const [p1, p2] = points
    const coord1 = { x: p1.cx(), y: p1.cy() }
    const coord2 = { x: p2.cx(), y: p2.cy() }
    const clip = getClipped(draw, coord1, coord2)
    console.assert(clip, 'clip must exist')
    element = draw.line(coord1.x, coord1.y, clip.x, clip.y)
      .attr('class', 'ray dashed')
      .attr(FSG_SHAPE_ATTR, true)
    setStrokeColor(element)
    cover = draw.line(coord1.x, coord1.y, clip.x, clip.y).attr('class', 'cover')
  }
  cover = cover ?? coverForLineElement(draw, element) 
  putBehindPoints(draw, points, cover, element)
  if (no) element.attr(NO_ATTR, no)

  return new Ray({draw, element, refs, cover, points })
}

///
/// ParallelLine
/// remove if points are removed.
///

function clippedParallelLine(draw, line, point) {
  console.assert(line, 'line must be defined')
  console.assert(point, 'point must be defined')

  const center = point.component.center()
  const direction = line.component.direction()

  const p1 = point
  const p2 = { x: center.x + direction.x * 20, y : center.y + direction.y * 20}
  const box = draw.bbox()
  const coord1 = { x: p1.cx(), y: p1.cy() }
  const coord2 = { x: p2.x, y: p2.y }
  return clipping(box, coord1, coord2)
}

export class ParallelLine extends LineShape {
  constructor({draw, element, refs, cover, no}) {

    let points = refs.map(compNo => componentByNo(draw, compNo).element)
    if (!element) {
      const [line, point] = points
      const [clip1, clip2] = clippedParallelLine(draw, line, point)
      element = draw.line(clip1.x, clip1.y, clip2.x, clip2.y)
        .attr('class', 'parallel-line dashed')
        .attr(FSG_SHAPE_ATTR, true)
      setStrokeColor(element)
      cover = draw.line(clip1.x, clip1.y, clip2.x, clip2.y).attr('class', 'cover')
      // points = [p1, p2]
    }
    cover = cover ?? coverForLineElement(draw, element) 
    putBehindPoints(draw, points, cover, element)
    if (no) element.attr(NO_ATTR, no)

    super({draw, element, refs, cover, points})
  }
  update() {
    const [line, point] = this.points
    const [clip1, clip2] = clippedParallelLine(this.draw, line, point)
    if (!clip1 || !clip2) return
    this.element.plot(clip1.x, clip1.y, clip2.x, clip2.y)
    this.cover?.plot(clip1.x, clip1.y, clip2.x, clip2.y)
    this.element.fire('update')
  }
  startPoint() {
    const p = this.points[1]
    let coord = {x: p.cx(), y: p.cy()}
    if (p.component)
      coord = pointOnScreen(p.component)
    return coord
  }
  direction() {
    const line = this.points[0]
    return line.component.direction()
  }
}

export function addParallelLine({ draw, element, refs, cover, no }) {
  return new ParallelLine({draw, element, refs, cover, no})
}

///
/// PerpLine
/// remove if points are removed.
///

function clippedPerpLine(draw, line, point) {
  console.assert(line, 'line must be defined')
  console.assert(point, 'point must be defined')

  const p1 = pointOnScreen({ element: point })
  const direction = line.component.direction()

  const p = pointOnScreen({ element: point })
  const coord1 = { x: p1.x, y: p1.y }
  const coord2 = {x: p.x - direction.y * 20, y: p.y + direction.x * 20}

  const box = draw.bbox()
  return clipping(box, coord1, coord2)
}

export class PerpLine extends LineShape {
  constructor({draw, element, refs, cover, no}) {

    let points = refs.map(compNo => componentByNo(draw, compNo).element)

    if (!element) {
      const [line, point] = points
      const [clip1, clip2] = clippedPerpLine(draw, line, point)
      element = draw.line(clip1.x, clip1.y, clip2.x, clip2.y)
        .attr('class', 'perp-line dashed')
        .attr(FSG_SHAPE_ATTR, true)
      setStrokeColor(element)
      cover = draw.line(clip1.x, clip1.y, clip2.x, clip2.y).attr('class', 'cover')
    }
    cover = cover ?? coverForLineElement(draw, element) 
    putBehindPoints(draw, points, cover, element)
    if (no) element.attr(NO_ATTR, no)

    super({draw, element, refs, cover, points})
  }
  update() {
    const [line, point] = this.points
    const [clip1, clip2] = clippedPerpLine(this.draw, line, point)
    if (!clip1 || !clip2) return
    this.element.plot(clip1.x, clip1.y, clip2.x, clip2.y)
    this.cover?.plot(clip1.x, clip1.y, clip2.x, clip2.y)
    this.element.fire('update')
  }
  startPoint() {
    const p = this.points[1]
    let coord = {x: p.cx(), y: p.cy()}
    if (p.component)
      coord = pointOnScreen(p.component)
    return coord
  }
  direction() {
    const line = this.points[0]
    const direction = line.component.direction()
    return {x: -direction.y, y: direction.x}
  }
}

export function addPerpLine({ draw, element, refs, cover, no }) {
  return new PerpLine({draw, element, refs, cover, no})
}

///
/// BisectorLine
/// remove if points are removed.
///

export class BisectorLine extends LineShape {
  constructor({draw, element, refs, cover, points }) {
    super({draw, element, refs, cover, points})
  }
  update() {
    const [p1, p2, p3] = this.points
    const box = this.draw.bbox()
    const bp = coordOfBisectorPoint(p1, p2, p3)
    const coord1 = { x: p2.cx(), y: p2.cy() }
    const coord2 = { x: bp.x, y: bp.y }
    const [clip1, clip2] = clipping(box, coord1, coord2)
    // console.log(box, coord1, coord2)

    if (!clip1 || !clip2) return
    this.element.plot(clip1.x, clip1.y, clip2.x, clip2.y)
    this.cover?.plot(clip1.x, clip1.y, clip2.x, clip2.y)
    this.element.fire('update')
  }
  startPoint() {
    const p = this.points[1]
    let coord = {x: p.cx(), y: p.cy()}
    if (p.component)
      coord = pointOnScreen(p.component)
    return coord
  }
  direction() {
    const [p1, p2, p3] = this.points
    const bp = coordOfBisectorPoint(p1, p2, p3)
    const sp = this.startPoint()
    const dx = bp.x - sp.x
    const dy = bp.y - sp.y
    const length = Math.sqrt(dx ** 2 + dy **2)
    return {x: dx/length , y: dy/length}
  }
}

function coordOfBisectorPoint(p1, p2, p3) {
  // console.assert(p1, 'p1 must be defined')
  // console.assert(p2, 'p2 must be defined')
  // console.assert(p3, 'p3 must be defined')
  const dx1 = p1.cx() - p2.cx()
  const dy1 = p1.cy() - p2.cy()
  const dx2 = p3.cx() - p2.cx()
  const dy2 = p3.cy() - p2.cy()
  const v1_length = Math.sqrt(dx1 ** 2 + dy1 ** 2)
  const v2_length = Math.sqrt(dx2 ** 2 + dy2 ** 2)
  const v1 = { x: dx1 / v1_length, y: dy1 / v1_length }
  const v2 = { x: dx2 / v2_length, y: dy2 / v2_length }
  return { x: p2.cx() + (v1.x + v2.x) / 2, y: p2.cy() + (v1.y + v2.y) /2 }
}

export function addBisectorLine({ draw, element, refs, cover, no }) {

  let points = refs.map(compNo => componentByNo(draw, compNo).element)

  if (!element) {
    const [p1, p2, p3] = points
    const box = draw.bbox()
    const bp = coordOfBisectorPoint(p1, p2, p3)
    const coord1 = { x: p2.cx(), y: p2.cy() }
    const coord2 = { x: bp.x, y: bp.y }
    const [clip1, clip2] = clipping(box, coord1, coord2)
    element = draw.line(clip1.x, clip1.y, clip2.x, clip2.y)
      .attr('class', 'bisector-line dashed')
      .attr(FSG_SHAPE_ATTR, true)
    setStrokeColor(element)
    cover = draw.line(clip1.x, clip1.y, clip2.x, clip2.y).attr('class', 'cover')
  }
  cover = cover ?? coverForLineElement(draw, element) 
  putBehindPoints(draw, points, cover, element)
  if (no) element.attr(NO_ATTR, no)

  return new BisectorLine({draw, element, refs, cover, points})
}

