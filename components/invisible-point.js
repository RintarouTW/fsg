'use strict'

import { POINT_RADIUS, COMPONENT_NO_ATTR, COMPONENT_REFS_ATTR } from '../common/define.js'
import { pointOnScreen } from '../common/math.js'
import { Component, componentByNo } from './component.js'

///
/// InvisiblePoint
/// 
export class InvisiblePoint extends Component {
  constructor({ draw, element }) {
    super({draw, element})
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
  constructor({ draw, componentRefs, element }) {
    super({ draw, element })

    element.attr(COMPONENT_REFS_ATTR, componentRefs.join(','))

    // watch components
    const refComponents = componentRefs.map(no => componentByNo(draw, no))
    this.refComponents = refComponents
    refComponents.forEach(target => {
      target.element.on('update', this.update.bind(this))
      target.element.on('remove', this.remove.bind(this))
    })
  }
  remove() {
    this.refComponents.forEach(target => {
      target.element.off('update', this.update)
    })
    super.remove()
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

export function addParallelPoint({ draw, coord, componentRefs, element, component_no })  {
  if (!element) element = draw.circle(POINT_RADIUS)
    .move(coord.x - POINT_RADIUS/2, coord.y - POINT_RADIUS/2)
    .attr('class', 'parallel-point')
  if (component_no) element.attr(COMPONENT_NO_ATTR, component_no)
  return new ParallelPoint({ draw, componentRefs, element })
}

///
/// PerpPoint 
/// removed after the ref components are removed.
///
export class PerpPoint extends InvisiblePoint {
  constructor({ draw, componentRefs, element }) {
    super({ draw, element })

    element.attr(COMPONENT_REFS_ATTR, componentRefs.join(','))

    // watch components
    const refComponents = componentRefs.map(no => componentByNo(draw, no))
    this.refComponents = refComponents
    refComponents.forEach(target => {
      target.element.on('update', this.update.bind(this))
      target.element.on('remove', this.remove.bind(this))
    })
  }
  remove() {
    this.refComponents.forEach(target => {
      target.element.off('update', this.update)
    })
    super.remove()
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

export function addPerpPoint({ draw, coord, componentRefs, element, component_no })  {
  if (!element) element = draw.circle(POINT_RADIUS)
    .move(coord.x - POINT_RADIUS/2, coord.y - POINT_RADIUS/2)
    .attr('class', 'perp-point')
  if (component_no) element.attr(COMPONENT_NO_ATTR, component_no)
  return new PerpPoint({ draw, componentRefs, element })
}


