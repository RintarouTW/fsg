'use strict'

import { NO_ATTR, DEFAULT_STROKE_COLOR, FSG_SHAPE_ATTR, FSG_STROKE_TYPE_ATTR } from '../common/define.js'
import { pointOnScreen } from '../common/math.js'
import { componentByNo } from './component.js'
import { putBehindPoints } from './shape.js'
import { LineShape, coverForLineElement } from './line.js'
import { setStrokeColor } from '../module/color_picker.js'

///
/// LineSegment
///

export class LineSegment extends LineShape {
  constructor({draw, refs, element, cover, points}) {
    super({draw, element, refs, cover, points})
  }
  update() {
    const [p1, p2] = this.points
    const coord1 = pointOnScreen(p1.component)
    const coord2 = pointOnScreen(p2.component)
    this.element.plot(coord1.x, coord1.y, coord2.x, coord2.y)
    this.cover?.plot(coord1.x, coord1.y, coord2.x, coord2.y)
    this.updateDirection()
    this.element.fire('update')
  }
}

export function addEdge({draw, refs, element, cover, no}) {

  const points = refs.map(compNo => componentByNo(draw, compNo).element)

  if (!element) {
    const [p1, p2] = points
    const coord1 = { x: p1.cx(), y: p1.cy() }
    const coord2 = { x: p2.cx(), y: p2.cy() }
    element = draw.line(coord1.x, coord1.y, coord2.x, coord2.y)
      .attr('class', 'edge')
      .attr(FSG_STROKE_TYPE_ATTR, 'dashed')
      .attr(FSG_SHAPE_ATTR, true)

    setStrokeColor(element)
    cover = draw.line(coord1.x, coord1.y, coord2.x, coord2.y).attr('class', 'cover')
  }
  cover = cover ?? coverForLineElement(draw, element) 
  putBehindPoints(draw, points, cover, element)

  if (no) element.attr(NO_ATTR, no)

  return new LineSegment({draw, refs, element, cover, points})
}

export function addVector({draw, refs, element, cover, no}) {

  const points = refs.map(compNo => componentByNo(draw, compNo).element)
  if (!element) {
    const [p1, p2] = points
    const coord1 = { x: p1.cx(), y: p1.cy() }
    const coord2 = { x: p2.cx(), y: p2.cy() }
    element = draw.line(coord1.x, coord1.y, coord2.x, coord2.y).attr('class', 'vector')
      .attr(FSG_STROKE_TYPE_ATTR, 'dashed')
      .attr(FSG_SHAPE_ATTR, true)
    setStrokeColor(element)
    cover = draw.line(coord1.x, coord1.y, coord2.x, coord2.y).attr('class', 'cover')
  }
  cover = cover ?? coverForLineElement(draw, element) 
  putBehindPoints(draw, points, cover, element)

  element.marker('start', draw.fsg.marker.vector_start_marker)
    .marker('end', draw.fsg.marker.vector_end_marker)

  if (no) element.attr(NO_ATTR, no)
  return new LineSegment({draw, refs, points, element, cover})
}

export class Axis extends LineSegment {
  constructor({draw, element, cover, type}) {
    super({draw, element, cover})
    this._direction = (type == 'axis-x') ? { x: 1, y: 0} : { x: 0, y: 1 }
  }
  startPoint() {
    return {x: this.element.attr('x1'), y: this.element.attr('y1')}
  }
  setCoord(coord1, coord2) {
    this.element.plot(coord1.x, coord1.y, coord2.x, coord2.y)
    this.cover?.plot(coord1.x, coord1.y, coord2.x, coord2.y)
    this.element.fire('update')
  }
}

export function addAxis({draw, type, element, cover, no}) {
  if (!element) {
    const viewbox = draw.parent().viewbox()
    let coord1, coord2
    if (type == 'axis-x') {
      coord1 = { x: -viewbox.width/2, y: 0}
      coord2 = { x: viewbox.width/2, y: 0}
    } else {
      coord1 = { x: 0, y: -viewbox.height/2 }
      coord2 = { x: 0, y: viewbox.height/2 }
    }
    element = draw.line(coord1.x, coord1.y, coord2.x, coord2.y)
      .attr('class', type)
      .attr(FSG_SHAPE_ATTR, true)
      .attr('stroke', DEFAULT_STROKE_COLOR)
    cover = draw.line(coord1.x, coord1.y, coord2.x, coord2.y).attr('class', 'cover')
  }
  cover = cover ?? coverForLineElement(draw, element) 

  element.marker('end', draw.fsg.marker.vector_end_marker).addClass(type)

  if (no) element.attr(NO_ATTR, no)

  return new Axis({draw, element, cover, type})
}

