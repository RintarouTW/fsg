'use strict'

import { COMPONENT_NO_ATTR } from '../common/define.js'
import { intersect, intersectLineAndCircle, projectPointOnLine, twoCirclesIntersection } from '../common/math.js'
// modules
import { toggleClass } from './style.js'
import { undo, redo, doAction } from './history.js'
import { saveAsSVG, exportToHTML } from './file.js'
import { toggle_code_editor } from './code_editor.js'
// components
import { LineBaseShape } from '../components/shape.js'
import { addIntersectPoint, addParallelPoint, addPerpPoint, addPoint } from '../components/point.js'
import { addLine, addRay, addEdge, addVector } from '../components/line.js'
import { addPolygon, addCircle } from '../components/fillable.js'
import { addText } from '../components/text.js'
import { 
  unselectAllSelections,
  removeAllSelections,
  getSelectedShapes,
  getSelectedPointElements,
  getLast2SelectedPointElements,
  getSelectedFillableShapes,
  numberOfSelections,
  getLastSelectedLineBaseAndPointComponent,
  getLast2SelectedIntersectableComponents,
  getSelectedComponents,
  getLastSelectedAppendableComponent,
  deselectLastSelection,
  lastSelectedComponent,
} from './selection.js'

function editField(fieldId) {
  let element = SVG(fieldId)
  element.node.focus()
}

let _keydownHandler

export function init_keybindings(draw) {

  if (_keydownHandler) document.removeEventListener('keydown', _keydownHandler)
  
  _keydownHandler = evt => {
    console.log(evt.code)

    if (typeof window.FSG !== 'undefined' && evt.target != document.body) return
    // if (evt.metaKey) return
    if (!draw.ready) return // ready to action after the opening animation

    let points = getLast2SelectedPointElements(draw)
    let componentRefs
    if (points) componentRefs = points.map(p => p.attr(COMPONENT_NO_ATTR))
    switch(evt.code) {
      case 'F1':
        toggle_code_editor()
        break
      case 'Backspace':
        removeAllSelections(draw)
        break
      case 'BracketLeft':
        {
          const component = lastSelectedComponent(draw)
          if (!component) return
          (evt.shiftKey) ? component.back() : component.backward()
        }
        break
      case 'BracketRight':
        {
          const component = lastSelectedComponent(draw)
          if (!component) return
          (evt.shiftKey) ? component.front() : component.forward()
        }
        break
      case 'Escape':
        {
          const component = getLastSelectedAppendableComponent(draw)
          // console.log(component)
          if(component) component.endAppendMode(draw)
        }
        break
      case 'KeyA':
        {
          const component = getLastSelectedAppendableComponent(draw)
          if(component) {
            component.toggleAppendMode(draw)
          } else {
            const coord = draw.mousePosition
            doAction(draw, addPoint, {draw, coord})
          }
        }
        break
      case 'KeyC':
        if (evt.shiftKey) {
          editField('#field_class')
          evt.preventDefault()
          return
        } else {
          if (!points) return
          doAction(draw, addCircle, {draw, componentRefs})
        }
        break
      case 'KeyD':
        {
          if (evt.shiftKey) {
            if (numberOfSelections(draw) > 0) doAction(draw, unselectAllSelections, draw)
          } else {
            if (numberOfSelections(draw) > 0) doAction(draw, deselectLastSelection, draw)
          }
        }
        break
      case 'KeyE':
        if (evt.metaKey) {
          exportToHTML(draw)
          evt.preventDefault()
          evt.stopPropagation()
        } else if (evt.ctrlKey) {
          evt.preventDefault()
          evt.stopPropagation()
          SVG('#runButton').node.click()
        } else {
          if (!points) return
          doAction(draw, addEdge, {draw, componentRefs})
        }
        break
      case 'KeyF':
        {
          const components = getSelectedFillableShapes(draw)
          const className = 'none'
          if (components.length) doAction(draw, toggleClass, {components, className})
        }
        break
      case 'KeyH':
        {
          const components = getSelectedComponents(draw)
          const className = 'hidden'
          if (components.length) doAction(draw, toggleClass, {components, className})
        }
        break
      case 'KeyI':
        if (evt.shiftKey) {
          editField('#field_id')
          evt.preventDefault()
          return
        } else { 
          const intersectableComponents = getLast2SelectedIntersectableComponents(draw)
          if (!intersectableComponents) return
          if (intersectableComponents[0] instanceof LineBaseShape) {
            if (intersectableComponents[1] instanceof LineBaseShape) { // intersect two lines
              const [l1, l2] = intersectableComponents
              const coord = intersect(l1.startPoint(), l1.direction(), l2.startPoint(), l2.direction())
              console.log(coord, l1.direction(), l2, l2.direction())
              const componentRefs = [l1.component_no, l2.component_no]
              const index = 0
              doAction(draw, addIntersectPoint, {draw, coord, index, componentRefs})
            } else { // line + circle
              const [line, circle] = intersectableComponents
              const intersectPoints = intersectLineAndCircle(line.startPoint(), line.direction(), circle.center(), circle.radius)
              const componentRefs = [line.component_no, circle.component_no]
              let coord = intersectPoints[0]
              let index = 0
              doAction(draw, addIntersectPoint, {draw, coord, index, componentRefs})
              coord = intersectPoints[1]
              index = 1
              doAction(draw, addIntersectPoint, {draw, coord, index, componentRefs})
            }
          } else { // circle + line
            if (intersectableComponents[1] instanceof LineBaseShape) {
              const [circle, line] = intersectableComponents
              const intersectPoints = intersectLineAndCircle(line.startPoint(), line.direction(), circle.center(), circle.radius)
              const componentRefs = [line.component_no, circle.component_no]
              let coord = intersectPoints[0]
              let index = 0
              doAction(draw, addIntersectPoint, {draw, coord, index, componentRefs})
              coord = intersectPoints[1]
              index = 1
              doAction(draw, addIntersectPoint, {draw, coord, index, componentRefs})
            } else { // two circles
              const [circle1, circle2] = intersectableComponents
              const c1 = { a: circle1.center().x, b: circle1.center().y, r: circle1.radius }
              const c2 = { a: circle2.center().x, b: circle2.center().y, r: circle2.radius }
              const intersectPoints = twoCirclesIntersection(c1, c2)
              if (!intersectPoints) return
              const componentRefs = [circle1.component_no, circle2.component_no]
              let coord = intersectPoints[0]
              let index = 0
              doAction(draw, addIntersectPoint, {draw, coord, index, componentRefs})
              coord = intersectPoints[1]
              index = 1
              doAction(draw, addIntersectPoint, {draw, coord, index, componentRefs})
            }
          }
        }
        break
      case 'KeyL':
        {
          if (!points) return
          doAction(draw, addLine, {draw, componentRefs})
        }
        break
      case 'KeyP':
        {
          points = getSelectedPointElements(draw)
          if (!points) return
          componentRefs = points.map(p => p.attr(COMPONENT_NO_ATTR))
          doAction(draw, addPolygon, {draw, componentRefs})
        }
        break
      case 'KeyO':
        {
          if (evt.metaKey) {
            const file = SVG('#file')
            file.node.click()
          }
        }
        break
      case 'KeyR':
        {
          if (evt.ctrlKey) { // reload
            SVG('#reloadButton').node.click()
          } else if(!evt.metaKey) { // prevent cmd+r
            if (!points) return
            doAction(draw, addRay, {draw, componentRefs})
          }
        }
        break
      case 'KeyS':
        if (evt.metaKey) {
          saveAsSVG(draw)
          evt.preventDefault()
          evt.stopPropagation()
        } else {
          const components = getSelectedShapes(draw)
          const className = 'dashed'
          if (components.length) doAction(draw, toggleClass, {components, className})
        }
        break
      case 'KeyT': // text
        {
          if (evt.shiftKey) {
            editField('#field_text')
            evt.preventDefault()
          } else {
            doAction(draw, addText, {draw})
          }
        }
        break
      case 'KeyV':
        {
          if (!points) return
          doAction(draw, addVector, {draw, componentRefs})
        }
        break
      case 'Equal':
        {
          const lineAndPoint = getLastSelectedLineBaseAndPointComponent(draw)
          // console.log(lineAndPoint)
          if (!lineAndPoint) return
          const [ line, point ] = lineAndPoint
          const componentRefs = [line.component_no, point.component_no]
          const center = point.center()
          const direction = line.direction()
          if (evt.shiftKey) { // Perp Point
            const coord = { x: center.x - direction.y * 20, y : center.y + direction.x * 20}
            doAction(draw, addPerpPoint, {draw, coord, componentRefs})
          } else { // Parallel Point
            const coord = { x: center.x + direction.x * 20, y : center.y + direction.y * 20}
            doAction(draw, addParallelPoint, {draw, coord, componentRefs})
          }
        }
        break
      case 'KeyX':
        {
          // Project point on line
          const lineAndPoint = getLastSelectedLineBaseAndPointComponent(draw)
          if (!lineAndPoint) return
          const [ line, point ] = lineAndPoint
          const coord = projectPointOnLine(point.center(), line.startPoint(), line.direction())
          const componentRefs = [line.component_no, point.component_no]
          const index = 0
          doAction(draw, addIntersectPoint, {draw, coord, index, componentRefs})
        }
        break
      case 'KeyU':
      case 'KeyZ':
        if (evt.shiftKey) redo(draw)
        else undo(draw)
        break
    }
  }
  document.addEventListener('keydown', _keydownHandler)
}
