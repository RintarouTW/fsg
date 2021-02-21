'use strict'

import { CLASS_FSG_UI_SELECT_BOX, COMPONENT_NO_ATTR, FSG_SELECTED_ATTR } from '../common/define.js'
import { snapTo } from '../common/common.js'

import { addPoint, PinPoint, addPinPoint } from '../components/draggable-point.js'
import { InvisiblePoint } from '../components/invisible-point.js'
import { AppendingPinPoint } from '../components/appending-point.js'
import { LaTeX } from '../components/latex.js'

import { doAction } from './history.js'
import { RuntimeMenu, BuilderMenu } from './menu.js'

function moveElementByOffset(element, offset) {
  // only update if changed (better performance)
  if (offset.x == 0 && offset.y == 0) return
  const coord = { x: element.orgValue.x + offset.x, y: element.orgValue.y + offset.y } 
  if (element.type == 'text' || element.component instanceof LaTeX)
    element.center(coord.x, -coord.y)
  else
    element.center(coord.x, coord.y)
  element.fire('dragmove')
}

export function init_module_drag(draw, click_to_add_point = true) {

  // disable default right click menu
  draw.on('contextmenu', evt => evt.preventDefault())

  let selectBox
  const found = draw.findOne('.' + CLASS_FSG_UI_SELECT_BOX)
  if (found) { // reuse exist element
    selectBox = found
  } else {
    selectBox = draw.parent().rect(0, 0).attr('class', CLASS_FSG_UI_SELECT_BOX)
    draw.add(selectBox)
  }

  // The Drag and Drop System
  draw.selectBox = selectBox
  draw.dragTarget = null
  draw.dragSelectStart = null
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

    // drag handling for AppendingPinPoint
    if (draw.dragTarget && (draw.dragTarget.component instanceof AppendingPinPoint)) {
      const pointInfo = draw.dragTarget.component.done()
      doAction(draw, addPinPoint, pointInfo)
      // don't set lastEvent to 'mousedown', so it won't add new point on the next mouse up.
      draw.dragTarget = null
      return
    }
    if (!evt.altKey) { // remember the dragging selection start coord
      draw.dragSelectStart = draw.point(evt.clientX, evt.clientY)
    }
    draw.lastEvent = 'mousedown'
    draw.dragTarget = null
  }).on('mouseup_on_document', () => { //
    // console.log('mouseup_on_document')
    if (draw.dragTarget) {
      // console.log('dragend')
      draw.dragTarget.fire('dragend')
      draw.dragTarget = null
    }
    if (draw.dragSelectStart) {
      draw.dragSelectStart = null
      selectBox.size(0, 0)
    }
  }).on('mouseup', evt => {
    // console.log('draw.mouseup')
    if (draw.dragTarget) {
      // console.log('dragend')
      draw.dragTarget.fire('dragend')
      draw.dragTarget = null
    }
    draw.dragSelectStart = null
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
    let dragTarget = draw.dragTarget
    if (dragTarget) {
      if ((dragTarget.component instanceof AppendingPinPoint) ||
        (dragTarget.component instanceof PinPoint)) {
        dragTarget.component.update()
      } else {
        const offset = {
          x: mousePosition.x - draw.dragPointStart.x,
          y: mousePosition.y - draw.dragPointStart.y,
        }
        if (draw.dragPoints) {
          const points = draw.dragPoints
          points.forEach(point => {
            moveElementByOffset(point, offset)
          })
          return
        }
        moveElementByOffset(dragTarget, offset)
      }
      return
    }
    if (draw.dragSelectStart) {
      let width = Math.abs(mousePosition.x - draw.dragSelectStart.x)
      let height = Math.abs(mousePosition.y - draw.dragSelectStart.y)
      let cx = (mousePosition.x + draw.dragSelectStart.x) / 2
      let cy = (mousePosition.y + draw.dragSelectStart.y) / 2
      selectBox.size(width, height).center(cx, cy)
      selectAllInBox(draw, selectBox, evt.shiftKey)
    }
  })
}

function selectAllInBox(draw, selectBox, isShiftPressed) {
  const list = draw.find(`[${COMPONENT_NO_ATTR}]`)
  list.forEach(element => {
    // skip unselectable points
    if (element.component instanceof InvisiblePoint) return
    // skip already selected element, so the selections would be in order.
    if (!isShiftPressed && element.attr(FSG_SELECTED_ATTR)) return 
    const itemBox = element.bbox()
    if ( selectBox.inside(itemBox.x, itemBox.y)  
      && selectBox.inside(itemBox.x + itemBox.width, itemBox.y + itemBox.height)) {
      console.assert(element.component, 'element.component must exist', element)
      isShiftPressed ? unselectComponent(draw, element.component) : selectComponent(draw, element.component)
    }
  })
}

