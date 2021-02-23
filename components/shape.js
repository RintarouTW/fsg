'use strict'

import { 
  OF_ATTR,
  DEFAULT_TRANSPARENT_COLOR,
  CLASS_FSG_UI_SELECT_BOX,
  FSG_HOVER_ATTR
} from '../common/define.js'

import { SelectableComponent } from './component.js'

function findBottom(draw, points) {
  let bottom = points[0]
  points.forEach(item => {
    const idx = draw.index(item)
    // console.log(idx, item)
    if ((idx != -1) && (idx < draw.index(bottom))) bottom = item
  })
  // if(draw.index(bottom) < 0) console.log('something wrong', points)
  return bottom
}

export function putBehindPoints(draw, points, cover, element) {
  if (!cover) return
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
  constructor({ draw, element, refs, cover, points }) {
    console.assert(draw, "draw is required")
    console.assert(element, "element is required")
    // cover is optional now, only used in the builder

    super({draw, element, refs})

    this.points = points
    this.cover = cover

    cover?.attr(OF_ATTR, this.no)
      .attr('fill', DEFAULT_TRANSPARENT_COLOR) // fill with transparent color

    cover?.on('mousedown', evt => { // selectable by mousedown
      this.toggleSelected()
      evt.stopPropagation()
    }).on('mouseenter', () => {
      if (!draw.dragTarget && !draw.dragSelectStart) {
        element.attr(FSG_HOVER_ATTR, true)
      }
    }).on('mouseleave', () => {
      element.attr(FSG_HOVER_ATTR, null)
    })
  }
  remove() {
    this.cover?.remove()
    super.remove()
  }
  /// order interface, keep the cover over the element
  forward() { // override super
    this.cover?.forward()
    this.element.forward()
    if (this.cover?.next()?.hasClass('cover')) { // forward twice for the cover of previous component
      this.cover?.forward()
      this.element.forward()
    }
  }
  backward() { // override super
    if (this.element.prev()?.hasClass('cover')) { // backward twice for the cover of previous component
      this.element.backward()
      this.cover?.backward()
    }
    this.element.backward()
    this.cover?.backward()
  }
  back() { // override super
    const selectBox = this.draw.findOne('.' + CLASS_FSG_UI_SELECT_BOX)
    if(this.cover) selectBox.after(this.cover)
    selectBox.after(this.element)
  }
  front() { // override super
    this.element.front()
    this.cover?.front()
  }
}


