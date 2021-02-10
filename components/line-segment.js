'use strict'

import { COMPONENT_NO_ATTR, DEFAULT_STROKE_COLOR } from '../common/define.js'
import { pointOnScreen } from '../common/math.js'
import { componentByNo } from './component.js'
import { putBehindPoints } from './shape.js'
import { LineBaseShape, setStrokeColor } from './line.js'

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
      this.watchUpdate(points, () => {
        const coord1 = pointOnScreen(p1.component)
        const coord2 = pointOnScreen(p2.component)
        element.plot(coord1.x, coord1.y, coord2.x, coord2.y)
        cover.plot(coord1.x, coord1.y, coord2.x, coord2.y)
        element.fire('update')
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
    putBehindPoints(draw, points, cover, element)
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
    putBehindPoints(draw, points, cover, element)
  }
  element.marker('start', draw.fsg.marker.vector_start_marker)
  element.marker('end', draw.fsg.marker.vector_end_marker)

  if (component_no) element.attr(COMPONENT_NO_ATTR, component_no)
  return new LineSegment({draw, points, element, cover})
}

export class Axis extends LineSegment {
  constructor({draw, points, element, cover, isHiddenPoint}) {
    super({draw, element, cover, points, isHiddenPoint})

    const [p1, p2] = points
    this.watchUpdate(points, () => {
      const coord1 = { x: p1.cx(), y: p1.cy() }
      const coord2 = { x: p2.cx(), y: p2.cy() }
      element.plot(coord1.x, coord1.y, coord2.x, coord2.y)
      cover.plot(coord1.x, coord1.y, coord2.x, coord2.y)
      element.fire('update')
    })
  }
  remove() { // remove the hidden points too.
    const [p1, p2] = this.points
    p1.remove()
    p2.remove()
    super.remove()
  }
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

  return new Axis({draw, points, element, cover, isHiddenPoint})
}


