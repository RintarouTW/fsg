'use strict'

import { COMPONENT_NO_ATTR, DEFAULT_STROKE_COLOR } from '../common/define.js'
import { clipping, pointOnScreen } from '../common/math.js'
import { componentByNo } from './component.js'
import { LineBaseShape } from './shape.js'
import { currentStrokeColor } from '../module/color_picker.js'

function setStrokeColor(element) {
  if (window.FSG) {
    const strokeColor = currentStrokeColor()
    element.attr('stroke', strokeColor)
  }
}
///
/// LineSegment
///

export class LineSegment extends LineBaseShape {
  constructor({draw, points, element, cover, isHiddenPoint}) {

    super({draw, element, cover, points, isHiddenPoint})

    if(isHiddenPoint) {
      unselectComponent(draw, this) 
    } else {

      const [p1, p2] = points
      this.tracePoints(points, () => {
        const coord1 = pointOnScreen(p1.component)
        const coord2 = pointOnScreen(p2.component)
        element.plot(coord1.x, coord1.y, coord2.x, coord2.y)
        cover.plot(coord1.x, coord1.y, coord2.x, coord2.y)

        this.label?.move(element.cx(), -element.cy())
      })
    }
  }
}

export function addEdge({draw, componentRefs, element, cover, component_no}) {

  const points = componentRefs.map(no => componentByNo(draw, no).element)

  if (!element) {
    const [p1, p2] = points
    const coord1 = { x: p1.cx(), y: p1.cy() }
    const coord2 = { x: p2.cx(), y: p2.cy() }
    element = draw.line(coord1.x, coord1.y, coord2.x, coord2.y).attr('class', 'edge dashed shape component selected')
    setStrokeColor(element)
    cover = draw.line(coord1.x, coord1.y, coord2.x, coord2.y).attr('class', 'cover')
  }
  if (component_no) element.attr(COMPONENT_NO_ATTR, component_no)

  return new LineSegment({draw, points, element, cover})
}

export function addVector({draw, componentRefs, element, cover, component_no}) {

  const points = componentRefs.map(no => componentByNo(draw, no).element)
  if (!element) {
    const [p1, p2] = points
    const coord1 = { x: p1.cx(), y: p1.cy() }
    const coord2 = { x: p2.cx(), y: p2.cy() }
    element = draw.line(coord1.x, coord1.y, coord2.x, coord2.y).attr('class', 'vector dashed shape component selected')
    setStrokeColor(element)
    cover = draw.line(coord1.x, coord1.y, coord2.x, coord2.y).attr('class', 'cover')
  }
  element.marker('start', draw.fsg.marker.vector_start_marker)
  element.marker('end', draw.fsg.marker.vector_end_marker)

  if (component_no) element.attr(COMPONENT_NO_ATTR, component_no)
  return new LineSegment({draw, points, element, cover})
}

export function addAxis({draw, type, element, cover, component_no}) {
  const start = draw.findOne('#' + type + '-start')
  const end = draw.findOne('#' + type + '-end')
  console.assert(start, 'axis start point is required')
  console.assert(end, 'axis end point is required')

  const points = [start, end]
  const isHiddenPoint = true
  if (!element) {
    const [p1, p2] = points
    const coord1 = { x: p1.cx(), y: p1.cy() }
    const coord2 = { x: p2.cx(), y: p2.cy() }
    element = draw.line(coord1.x, coord1.y, coord2.x, coord2.y)
      .attr('class', type + ' dashed shape component selected')
      .attr('stroke', DEFAULT_STROKE_COLOR)
    cover = draw.line(coord1.x, coord1.y, coord2.x, coord2.y).attr('class', 'cover')
  }
  element.marker('end', draw.fsg.marker.vector_end_marker)
  element.removeClass('dashed')
  element.addClass(type)

  if (component_no) element.attr(COMPONENT_NO_ATTR, component_no)

  return new LineSegment({draw, points, element, cover, isHiddenPoint})
}

///
/// Line
///

export class Line extends LineBaseShape {
  constructor({draw, points, element, cover}) {
    super({draw, element, cover, points})

    const [p1, p2] = points
    this.tracePoints(points, () => {
      const box = draw.bbox()
      const coord1 = pointOnScreen(p1.component)
      const coord2 = pointOnScreen(p2.component)
      const [clip1, clip2] = clipping(box, coord1, coord2)

      if (!clip1 || !clip2) return
      element.plot(clip1.x, clip1.y, clip2.x, clip2.y)
      cover.plot(clip1.x, clip1.y, clip2.x, clip2.y)
      if(this.label) this.label.move(element.cx(), -element.cy())
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
    this.tracePoints(points, () => {
      const coord1 = pointOnScreen(p1.component)
      const coord2 = pointOnScreen(p2.component)
      const clip = getClipped(draw, coord1, coord2)

      element.plot(coord1.x, coord1.y, clip.x, clip.y)
      cover.plot(coord1.x, coord1.y, clip.x, clip.y)
      if(this.label) this.label.move(element.cx(), -element.cy())
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
  }
  if (component_no) element.attr(COMPONENT_NO_ATTR, component_no)

  return new Ray({draw, points, element, cover })
}

