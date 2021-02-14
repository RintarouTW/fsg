'use strict'

import { COMPONENT_NO_ATTR, DEFAULT_STROKE_COLOR } from '../common/define.js'
import { pointOnScreen } from '../common/math.js'
import { componentByNo } from './component.js'
import { putBehindPoints } from './shape.js'
import { LineShape, setStrokeColor } from './line.js'

///
/// LineSegment
///

export class LineSegment extends LineShape {
  constructor({draw, points, element, cover}) {

    super({draw, element, cover, points})

    if(!points) {
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
  constructor({draw, element, cover, type}) {
    super({draw, element, cover})
    this._direction = (type == 'axis-x') ? { x: 1, y: 0} : { x: 0, y: 1 }
  }
  startPoint() {
    return {x: this.element.attr('x1'), y: this.element.attr('y1')}
  }
  direction() {
    return this._direction
  }
  setCoord(coord1, coord2) {
    this.element.plot(coord1.x, coord1.y, coord2.x, coord2.y)
    this.cover.plot(coord1.x, coord1.y, coord2.x, coord2.y)
    this.element.fire('update')
  }
}

export function addAxis({draw, type, element, cover, component_no}) {
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
      .attr('class', type + ' dashed shape component selected')
      .attr('stroke', DEFAULT_STROKE_COLOR)
    cover = draw.line(coord1.x, coord1.y, coord2.x, coord2.y).attr('class', 'cover')
  }
  element.marker('end', draw.fsg.marker.vector_end_marker)
  element.removeClass('dashed')
  element.addClass(type)

  if (component_no) element.attr(COMPONENT_NO_ATTR, component_no)

  return new Axis({draw, element, cover, type})
}


