'use strict'

import { COMPONENT_NO_ATTR } from '../common/define.js'
import { pointOnScreen } from '../common/math.js'

import { componentByNo } from './component.js'
import { FillableShape, putBehindPoints } from './shape.js'
import { addAppendingPinPoint } from './appending-point.js'
import { currentFillColor, currentStrokeColor } from '../module/color_picker.js'

///
/// Circle
///

export class Circle extends FillableShape {
  constructor({ draw, radius, points, element, cover }) {
    super({ draw, element, cover, points })

    this.radius = radius

    const [cp, rp] = points
    this.tracePoints(points, () => {
      const r = Math.sqrt((rp.cx() - cp.cx()) ** 2 + (rp.cy() - cp.cy()) ** 2)
      this.radius = r
      element.radius(r)
      element.center(cp.cx(), cp.cy())
      cover.radius(r)
      cover.center(cp.cx(), cp.cy())
      element.fire('update')
    })
  }
  // Implement the Appendable Interface
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
}

export function addCircle({draw, componentRefs, element, cover, component_no}) {

  const points = componentRefs.map(no => componentByNo(draw, no).element)
  const [cp, rp] = points
  const radius = Math.sqrt((rp.cx() - cp.cx()) ** 2 + (rp.cy() - cp.cy()) ** 2)
  if (!element) {
    element = draw.circle().radius(radius).center(cp.cx(), cp.cy())
      .attr('class', 'circle dashed shape component selected none')
      // .attr('filter', 'url(#filter_shadow)')
      // .attr('filter', 'url(#filter_blur)')
      // .attr('filter', 'url(#filter_color_matrix)')
      // .attr('filter', 'url(#filter_shadow)')

    if (window.FSG) { // run in editor
      const fillColor = currentFillColor()
      const strokeColor = currentStrokeColor()
      element.attr('fill', fillColor)
      element.attr('stroke', strokeColor)
    }
    cover = draw.circle().radius(radius).center(cp.cx(), cp.cy()).attr('class', 'cover')
    putBehindPoints(draw, points, cover, element)
  }
  if (component_no) element.attr(COMPONENT_NO_ATTR, component_no)

  return new Circle({draw, radius, points, element, cover, component_no})
}

///
/// Polygon
///

class Polygon extends FillableShape {
  constructor({ draw, points, element, cover }) {
    super({ draw, element, cover, points })

    this.tracePoints(points, () => {
      let pts = points.map(p => {
        const coord = pointOnScreen(p.component)
        return [coord.x, coord.y]
      })
      element.plot(pts)
      cover.plot(pts)
    })
  }
}

export function addPolygon({draw, componentRefs, element, cover, component_no}) {

  const points = componentRefs.map(no => componentByNo(draw, no).element)
  const pts = points.map(p => [p.cx(), p.cy()])
  if (!element) {
    element = draw.polygon(pts)
      .attr('class', 'polygon dashed shape component selected none') 

    if (window.FSG) { // run in editor
      const fillColor = currentFillColor()
      const strokeColor = currentStrokeColor()
      element.attr('fill', fillColor)
      element.attr('stroke', strokeColor)
    }
    cover = draw.polygon(pts).attr('class', 'cover')
    putBehindPoints(draw, points, cover, element)
  }
  if (component_no) element.attr(COMPONENT_NO_ATTR, component_no)

  return new Polygon({ draw, points, element, cover })
}

