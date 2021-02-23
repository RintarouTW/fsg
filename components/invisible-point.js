'use strict'

import { POINT_RADIUS, NO_ATTR } from '../common/define.js'
import { pointOnScreen } from '../common/math.js'
import { Component } from './component.js'

///
/// InvisiblePoint
/// 
export class InvisiblePoint extends Component {
  constructor({ draw, element, refs }) {
    super({draw, element, refs})
  }
  select() {
    // do nothing.
    console.warn('FIXME: this should not be called')
  }
  unselect() {
    // do nothing.
    console.warn('FIXME: this should not be called')
    console.assert('this should not be called, fixme now')
  }
  getAttributes() {
    console.assert(true, 'unselectable point should not be inspected')
    return []
  }
}

///
/// ParallelPoint
/// removed after the ref components are removed.
///
export class ParallelPoint extends InvisiblePoint {
  constructor({ draw, element, refs }) {
    super({ draw, element, refs })
  }
  update() {
    const [line, point] = this.refComponents
    const center = point.center()
    const direction = line.direction()
    const coord = {x: center.x + direction.x * 20, y: center.y + direction.y * 20}
    this.element.center(coord.x, coord.y)
    this.element.fire('update')
  }
}

export function addParallelPoint({ draw, coord, refs, element, no })  {
  if (!element) element = draw.circle(POINT_RADIUS)
    .move(coord.x - POINT_RADIUS/2, coord.y - POINT_RADIUS/2)
    .attr('class', 'parallel-point')
  if (no) element.attr(NO_ATTR, no)
  return new ParallelPoint({ draw, element, refs })
}

///
/// PerpPoint 
/// removed after the ref components are removed.
///
export class PerpPoint extends InvisiblePoint {
  constructor({ draw, element, refs }) {
    super({ draw, element, refs })
  }
  update() {
    const [line, point] = this.refComponents
    const direction = line.direction()
    const p = pointOnScreen(point)
    const coord = {x: p.x - direction.y * 20, y: p.y + direction.x * 20}
    this.element.center(coord.x, coord.y)
    this.element.fire('update')
  }
}

export function addPerpPoint({ draw, coord, refs, element, no })  {
  if (!element) element = draw.circle(POINT_RADIUS)
    .move(coord.x - POINT_RADIUS/2, coord.y - POINT_RADIUS/2)
    .attr('class', 'perp-point')
  if (no) element.attr(NO_ATTR, no)
  return new PerpPoint({ draw, element, refs })
}

