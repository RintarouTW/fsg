'use strict'

import { COMPONENT_NO_ATTR, COMPONENT_REFS_ATTR } from '../common/define.js'
import { clipping, pointOnScreen } from '../common/math.js'
import { componentByNo } from './component.js'
import { ShapeComponent, putBehindPoints } from './shape.js'
import { currentStrokeColor } from '../module/color_picker.js'
import { addParallelPoint, addPerpPoint } from './invisible-point.js'
import { addAppendingPinPoint } from './appending-point.js'

export function setStrokeColor(element) {
  if (window.FSG_BUILDER) {
    const strokeColor = currentStrokeColor()
    element.attr('stroke', strokeColor)
  }
}

export class LineBaseShape extends ShapeComponent {
  constructor({draw, element, cover, points, isHiddenPoint}) {
    super({draw, element, cover, points, isHiddenPoint})
    this.isAppending = null
  }
  startPoint() {
    const p = this.points[0]
    let coord = {x: p.cx(), y: p.cy()}
    if (p.component)
      coord = pointOnScreen(p.component)
    return coord
  }
  direction() {
    const [p1, p2] = this.points
    // hidden points won't be transformed
    let coord1 = { x: p1.cx(), y: p1.cy() }
    let coord2 = { x: p2.cx(), y: p2.cy() }
    if (p1.component && p2.component) { // element of a component may be transformed
      coord1 = pointOnScreen(p1.component)
      coord2 = pointOnScreen(p2.component)
    }
    const dx = coord2.x - coord1.x
    const dy = coord2.y - coord1.y
    const length = Math.sqrt(dx ** 2 + dy **2)
    return {x: dx/length , y: dy/length}
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
      const componentRef = this.component_no
      this.isAppending = addAppendingPinPoint({draw, componentRef})
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

export class Line extends LineBaseShape {
  constructor({draw, points, element, cover}) {
    super({draw, element, cover, points})

    const [p1, p2] = points
    this.watchUpdate(points, () => {
      const box = draw.bbox()
      const coord1 = pointOnScreen(p1.component)
      const coord2 = pointOnScreen(p2.component)
      // console.log(box, coord1, coord2)
      const [clip1, clip2] = clipping(box, coord1, coord2)
      if (!clip1 || !clip2) return
      element.plot(clip1.x, clip1.y, clip2.x, clip2.y)
      cover.plot(clip1.x, clip1.y, clip2.x, clip2.y)
      element.fire('update')
    })
  }
}

export function addLine({draw, componentRefs, element, cover, component_no}) {

  const points = componentRefs.map(no => componentByNo(draw, no).element)
  if (!element) {
    const box = draw.bbox()
    const [p1, p2] = points
    console.assert(p1, 'p1 must be defined', points)
    console.assert(p2, 'p2 must be defined', points)

    const coord1 = { x: p1.cx(), y: p1.cy() }
    const coord2 = { x: p2.cx(), y: p2.cy() }
    const [clip1, clip2] = clipping(box, coord1, coord2)
    element = draw.line(clip1.x, clip1.y, clip2.x, clip2.y).attr('class', 'line dashed shape component selected')
    setStrokeColor(element)
    // element.attr('filter', 'url(#filter_shadow)')
    cover = draw.line(clip1.x, clip1.y, clip2.x, clip2.y).attr('class', 'cover')
    putBehindPoints(draw, points, cover, element)
  }
  if (component_no) element.attr(COMPONENT_NO_ATTR, component_no)

  return new Line({draw, points, element, cover, component_no})
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
  console.assert(clip1, 'clip1 must be defined')
  console.assert(clip2, 'clip2 must be defined')

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

export class Ray extends LineBaseShape {
  constructor({ draw, points, element, cover }) {
    super({draw, element, cover, points})

    const [p1, p2] = points
    this.watchUpdate(points, () => {
      const coord1 = pointOnScreen(p1.component)
      const coord2 = pointOnScreen(p2.component)
      const clip = getClipped(draw, coord1, coord2)

      element.plot(coord1.x, coord1.y, clip.x, clip.y)
      cover.plot(coord1.x, coord1.y, clip.x, clip.y)
      element.fire('update')
    })
  }
}

export function addRay({draw, componentRefs, element, cover, component_no}) {

  const points = componentRefs.map(no => componentByNo(draw, no).element)
  if (!element) {
    const [p1, p2] = points
    const coord1 = { x: p1.cx(), y: p1.cy() }
    const coord2 = { x: p2.cx(), y: p2.cy() }
    const clip = getClipped(draw, coord1, coord2)
    element = draw.line(coord1.x, coord1.y, clip.x, clip.y).attr('class', 'ray dashed shape component selected')
    setStrokeColor(element)
    cover = draw.line(coord1.x, coord1.y, clip.x, clip.y).attr('class', 'cover')
    putBehindPoints(draw, points, cover, element)
  }
  if (component_no) element.attr(COMPONENT_NO_ATTR, component_no)

  return new Ray({draw, points, element, cover })
}

///
/// ParallelLine
/// remove if points are removed.
///

export class ParallelLine extends Line {
  constructor({draw, points, element, cover}) {
    super({draw, element, cover, points})

    const componentRefs = points.map(point => {
      // watch point remove event
      point.on('remove', this.remove.bind(this))
      return point.attr('component_no')
    })
    element.attr(COMPONENT_REFS_ATTR, componentRefs.join(','))
  }
  undo() {
    const parallelPoint = this.points[1]
    parallelPoint.remove()
    super.undo()
  }
}

export function addParallelLine({ draw, coord, componentRefs, element, cover, component_no }) {

  let points = componentRefs.map(no => componentByNo(draw, no).element)

  if (!element) {
    const p1 = points[1] // where points[0] is the line element
    const parallelPoint = addParallelPoint({draw, coord, componentRefs})
    const p2 = parallelPoint.element
    const box = draw.bbox()
    console.assert(p1, 'p1 must be defined', points)
    console.assert(p2, 'p2 must be defined', points)

    const coord1 = { x: p1.cx(), y: p1.cy() }
    const coord2 = { x: p2.cx(), y: p2.cy() }
    const [clip1, clip2] = clipping(box, coord1, coord2)
    element = draw.line(clip1.x, clip1.y, clip2.x, clip2.y).attr('class', 'parallel-line dashed shape component selected')
    setStrokeColor(element)
    cover = draw.line(clip1.x, clip1.y, clip2.x, clip2.y).attr('class', 'cover')
    points = [p1, p2]
    putBehindPoints(draw, points, cover, element)
  }
  if (component_no) element.attr(COMPONENT_NO_ATTR, component_no)

  return new ParallelLine({draw, points, element, cover, component_no})
}

///
/// PerpLine
/// remove if points are removed.
///

export class PerpLine extends Line {
  constructor({draw, points, element, cover}) {
    super({draw, element, cover, points})

    const componentRefs = points.map(point => {
      // watch point remove event
      point.on('remove', this.remove.bind(this))
      return point.attr('component_no')
    })
    element.attr(COMPONENT_REFS_ATTR, componentRefs.join(','))
  }
  undo() {
    const perpPoint = this.points[1]
    perpPoint.remove()
    super.undo()
  }
}

export function addPerpLine({ draw, coord, componentRefs, element, cover, component_no }) {

  let points = componentRefs.map(no => componentByNo(draw, no).element)

  if (!element) {
    const p1 = points[1] // where points[0] is the line element
    const parallelPoint = addPerpPoint({draw, coord, componentRefs})
    const p2 = parallelPoint.element
    const box = draw.bbox()
    console.assert(p1, 'p1 must be defined', points)
    console.assert(p2, 'p2 must be defined', points)

    const coord1 = { x: p1.cx(), y: p1.cy() }
    const coord2 = { x: p2.cx(), y: p2.cy() }
    const [clip1, clip2] = clipping(box, coord1, coord2)
    element = draw.line(clip1.x, clip1.y, clip2.x, clip2.y).attr('class', 'perp-line dashed shape component selected')
    setStrokeColor(element)
    cover = draw.line(clip1.x, clip1.y, clip2.x, clip2.y).attr('class', 'cover')
    points = [p1, p2]
    putBehindPoints(draw, points, cover, element)
  }
  if (component_no) element.attr(COMPONENT_NO_ATTR, component_no)

  return new PerpLine({draw, points, element, cover, component_no})
}

///
/// BisectorLine
/// remove if points are removed.
///

export class BisectorLine extends LineBaseShape {
  constructor({draw, points, element, cover}) {
    super({draw, element, cover, points})

    const [p1, p2, p3] = points
    this.watchUpdate(points, () => {
      const box = draw.bbox()
      const bp = coordOfBisectorPoint(p1, p2, p3)
      const coord1 = { x: p2.cx(), y: p2.cy() }
      const coord2 = { x: bp.x, y: bp.y }
      const [clip1, clip2] = clipping(box, coord1, coord2)
      // console.log(box, coord1, coord2)

      if (!clip1 || !clip2) return
      element.plot(clip1.x, clip1.y, clip2.x, clip2.y)
      cover.plot(clip1.x, clip1.y, clip2.x, clip2.y)
      element.fire('update')
    })

    const componentRefs = points.map(point => {
      // watch point remove event
      point.on('remove', this.remove.bind(this))
      return point.attr('component_no')
    })
    element.attr(COMPONENT_REFS_ATTR, componentRefs.join(','))
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

export function addBisectorLine({ draw, componentRefs, element, cover, component_no }) {

  let points = componentRefs.map(no => componentByNo(draw, no).element)

  if (!element) {
    const [p1, p2, p3] = points
    const box = draw.bbox()
    const bp = coordOfBisectorPoint(p1, p2, p3)
    const coord1 = { x: p2.cx(), y: p2.cy() }
    const coord2 = { x: bp.x, y: bp.y }
    const [clip1, clip2] = clipping(box, coord1, coord2)
    element = draw.line(clip1.x, clip1.y, clip2.x, clip2.y).attr('class', 'bisector-line dashed shape component selected')
    setStrokeColor(element)
    cover = draw.line(clip1.x, clip1.y, clip2.x, clip2.y).attr('class', 'cover')
    putBehindPoints(draw, points, cover, element)
  }
  if (component_no) element.attr(COMPONENT_NO_ATTR, component_no)

  return new BisectorLine({draw, points, element, cover})
}


