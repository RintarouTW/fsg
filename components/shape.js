'use strict'

import { 
  COMPONENT_NO_ATTR,
  COMPONENT_REFS_ATTR,
  OF_ATTR,
  DEFAULT_TRANSPARENT_COLOR
} from '../common/define.js'

import { SelectableComponent } from './component.js'

function findBottom(draw, points) {
  let bottom = points[0]
  points.forEach(item => {
    const idx = draw.index(item)
    // console.log(idx, item)
    if ((idx != -1) && (idx < draw.index(bottom))) bottom = item
  })
  // if(draw.index(bottom) < 0)
    // console.log('something wrong', points)
  return bottom
}

export function putBehindPoints(draw, points, cover, element) {
    // The order of the element should only be manipulated when the component constructed in editor.
    // After that, user can change the order of the component, and that order should be kept even after reconstruction.
    //
    // find the most bottom point
    // FIXME: there's a bug in svgjs. somehow it's possible have an element with index = -1
    // even it's indeed a child of draw. (weird)
    const bottom = findBottom(draw, points)
    if (draw.index(bottom) > 0) {
      cover.insertBefore(bottom)
      element.insertBefore(cover)
    }
}

///
/// Shape
///

export class Shape extends SelectableComponent {
  constructor({draw, element, cover, points }) {
    console.assert(draw, "draw is required")
    console.assert(element, "element is required")
    console.assert(cover, "cover is required")
    console.assert(points, "points is required")

    super({draw, element})

    const point_refs = points.map(p => p.attr(COMPONENT_NO_ATTR))
    const refs = point_refs.join(',')
    if (refs.length > 1) { // Axis has no refs to other components.
      // console.log(this, refs, refs.length)
      element.attr(COMPONENT_REFS_ATTR, point_refs.join(','))
    }
    this.points = points
    cover.attr(OF_ATTR, this.component_no)
      .attr('fill', DEFAULT_TRANSPARENT_COLOR) // fill with transparent color
    this.cover = cover

    // selectable by mousedown
    const mousedown = evt => {
      this.toggleSelected()
      evt.stopPropagation()
    }
    cover.on('mousedown', mousedown)
      .on('mouseenter', () => {
        if (!draw.dragTarget && !draw.dragSelectStart) {
          element.addClass('hover')
          cover.addClass('hover')
        }
      }).on('mouseleave', () => {
        element.removeClass('hover')
        cover.removeClass('hover')
      })
  }
  remove() {
    this.cover.remove()
    super.remove()
  }
  /// order interface, keep the cover over the element
  forward() { // override super
    this.cover.forward()
    this.element.forward()
    if (this.cover.next()?.hasClass('cover')) { // forward twice for the cover of previous component
      this.cover.forward()
      this.element.forward()
    }
  }
  backward() { // override super
    if (this.element.prev()?.hasClass('cover')) { // backward twice for the cover of previous component
      this.element.backward()
      this.cover.backward()
    }
    this.element.backward()
    this.cover.backward()
  }
  back() { // override super
    const selectBox = this.draw.findOne('.ui-select-box')
    selectBox.after(this.cover)
    selectBox.after(this.element)
  }
  front() { // override super
    this.element.front()
    this.cover.front()
  }
}


