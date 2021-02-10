'use strict'

import { snapTo } from '../common/common.js'

import { addPoint, PinPoint, addPinPoint } from '../components/draggable-point.js'
import { InvisiblePoint } from '../components/invisible-point.js'
import { AppendingPinPoint } from '../components/appending-point.js'
import { LaTeX } from '../components/latex.js'

import { doAction } from './history.js'
import { RuntimeMenu, BuilderMenu } from './menu.js'

export function init_drag(draw, click_to_add_point = true) {

  // disable default right click menu
  draw.on('contextmenu', evt => evt.preventDefault())

  let selectBox
  const found = draw.findOne('.ui-select-box')
  if (found) { // reuse exist element
    // console.log('select box found', found)
    selectBox = found
  } else {
    selectBox = draw.parent().rect(0, 0).attr('class', 'ui-select-box')
    draw.add(selectBox)
  }

  // The Drag and Drop System
  draw.selectBox = selectBox
  draw.dragTarget = null
  draw.dragStart = null
  draw.on('mousedown', evt => {
    // console.log('draw.mousedown')
    if (draw.menu) { // if menu exist(shown) remove menu
      draw.menu.remove()
      return
    }
    // right click for menu
    // if (/*window.FSG_RUNTIME &&*/ evt.button == 2) {
    if (evt.button == 2) {
      if (window.FSG_RUNTIME) {
        new RuntimeMenu(draw, draw.point(evt.clientX, evt.clientY))
      } else if (window.FSG_BUILDER) {
        new BuilderMenu(draw, draw.point(evt.clientX, evt.clientY))
      }
      evt.preventDefault()
      evt.stopPropagation()
      return
    }
    if (evt.button != 0) return // skip other buttons

    // drag handling
    if (draw.dragTarget && (draw.dragTarget.component instanceof AppendingPinPoint)) {
      const pointInfo = draw.dragTarget.component.done()
      doAction(draw, addPinPoint, pointInfo)
      // don't set lastEvent to 'mousedown', so it won't add new point on the next mouse up.
    } else {
      draw.lastEvent = 'mousedown'
    }
    if (!evt.altKey)
      draw.dragStart = draw.point(evt.clientX, evt.clientY)
    draw.dragTarget = null
  }).on('mouseup_on_document', () => { //
    // console.log('mouseup_on_document')
    if (draw.dragTarget) {
      // console.log('dragend')
      draw.dragTarget.fire('dragend')
      draw.dragTarget = null
    }
    if (draw.dragStart) {
      draw.dragStart = null
      selectBox.size(0, 0)
    }
  }).on('mouseup', evt => {
    // console.log('draw.mouseup')
    if (draw.dragTarget) {
      // console.log('dragend')
      draw.dragTarget.fire('dragend')
      draw.dragTarget = null
    }
    draw.dragStart = null
    selectBox.size(0, 0)
    if (draw.lastEvent != 'mousedown') return
    draw.lastEvent = 'mouseup'

    if (click_to_add_point) {
      let coord = draw.point(evt.clientX, evt.clientY)
      coord = snapTo(coord)
      doAction(draw, addPoint, {draw, coord})
    }
  }).on('mousemove', evt => {
    draw.lastEvent = 'mousemove'
    const mousePosition = draw.point(evt.clientX, evt.clientY)
    draw.mousePosition = snapTo(mousePosition)
    const dragTarget = draw.dragTarget
    if (dragTarget) {
      if ((dragTarget.component instanceof AppendingPinPoint) ||
        (dragTarget.component instanceof PinPoint)) {
        dragTarget.component.update()
      } else {
        const org = { x: dragTarget.cx(), y: dragTarget.cy()}
        const coord = mousePosition
        // only update if changed (better performance)
        if ((coord.x != org.x) || (coord.y != org.y)) {
          if (dragTarget.type == 'text' || dragTarget.component instanceof LaTeX)
            dragTarget.center(coord.x, -coord.y)
          else
            dragTarget.center(coord.x, coord.y)
          dragTarget.fire('dragmove')
        }
      }
    }
    if (draw.dragStart) {
      let width = Math.abs(mousePosition.x - draw.dragStart.x)
      let height = Math.abs(mousePosition.y - draw.dragStart.y)
      let cx = (mousePosition.x + draw.dragStart.x) / 2
      let cy = (mousePosition.y + draw.dragStart.y) / 2
      selectBox.size(width, height).center(cx, cy)
      selectAllInBox(draw, selectBox, evt.shiftKey)
    }
  })
}

function selectAllInBox(draw, selectBox, isShiftPressed) {
  const list = draw.find('.component')
  list.forEach(element => {
    // skip unselectable points
    if (element.component instanceof InvisiblePoint) return
    // skip already selected element, so the selections would be in order.
    if (!isShiftPressed && element.hasClass('selected')) return 
    const itemBox = element.bbox()
    if ( selectBox.inside(itemBox.x, itemBox.y)  
      && selectBox.inside(itemBox.x + itemBox.width, itemBox.y + itemBox.height)) {
      console.assert(element.component, 'element.component must exist', element)
      isShiftPressed ? unselectComponent(draw, element.component) : selectComponent(draw, element.component)
    }
  })
}

