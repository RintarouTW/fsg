'use strict'

import { NO_ATTR, FSG_FILL_NONE_ATTR, FSG_HIDDEN_ATTR } from '../common/define.js'
import { intersect, intersectLineAndCircle, projectPointOnLine, twoCirclesIntersection } from '../common/math.js'
// modules
import { toggleAttribute, toggleClass } from './style.js'
import { undo, redo, doAction } from './history.js'
import { saveAsSVG, exportToHTML, svgDocument } from './file.js'
import { toggle_code_editor } from './code_editor.js'
// components
import { addIntersectPoint, addMidPoint } from '../components/point.js'
import { addPoint } from '../components/draggable-point.js'
import { LineShape, addLine, addRay, addParallelLine, addPerpLine, addBisectorLine } from '../components/line.js'
import { addEdge, addVector } from '../components/line-segment.js'
import { addPolygon, addCircle, addAngle } from '../components/fillable.js'
import { addAngleMarker, addLengthMarker } from '../components/measure.js'
import { addLaTeX } from '../components/latex.js'
import { 
  unselectAllSelections,
  removeAllSelections,
  getSelectedShapes,
  getSelectedSelectablePointElements,
  getLast2SelectedPointElements,
  getSelectedFillableShapes,
  numberOfSelections,
  getLastSelectedLineBaseAndPointComponent,
  getLast2SelectedIntersectableComponents,
  getSelectedComponents,
  getLastSelectedAppendableComponent,
  deselectLastSelection,
  lastSelectedComponent,
  getLastSelectedAngleComponents,
  selectAllSelectableComponents,
} from './selection.js'
import { showHint } from './ui.js'
import { toggle_preference_window } from './preference.js'
import { editField } from './inspector.js'

let _keydownHandler, _keyupHandler

export function init_module_keybinding(draw) {

  if (_keyupHandler) document.removeEventListener('keyup', _keyupHandler)
  if (_keydownHandler) document.removeEventListener('keydown', _keydownHandler)

  _keyupHandler = evt => {
    draw.shiftKey = evt.shiftKey
  }
  document.addEventListener('keyup', _keyupHandler)
  
  _keydownHandler = evt => {
    console.log(evt.code)

    if (typeof window.FSG_BUILDER !== 'undefined' && evt.target != document.body) return
    // if (evt.metaKey) return
    if (!draw.ready) return // ready to action after the opening animation

    draw.shiftKey = evt.shiftKey

    let points = getLast2SelectedPointElements(draw)
    let refs
    if (points) refs = points.map(p => p.attr(NO_ATTR))
    switch(evt.code) {
      case 'F1':
        toggle_code_editor()
        break
      case 'Comma':
        {
          if(evt.metaKey) {
            toggle_preference_window(draw)
          }
        }
        break
      case 'Tab':
        {
          const components = getLastSelectedAngleComponents(draw)
          components.forEach(angle => {
            angle.toggleMode()
          })
          evt.preventDefault()
          evt.stopPropagation()
        }
        break
      case 'Backspace':
        doAction(draw, removeAllSelections, { draw })
        break
      case 'BracketLeft':
        {
          const component = lastSelectedComponent(draw)
          if (!component) {
            showHint('Select one component first!')
            return
          }
          (evt.shiftKey) ? component.back() : component.backward()
        }
        break
      case 'BracketRight':
        {
          const component = lastSelectedComponent(draw)
          if (!component) {
            showHint('Select one component first!')
            return
          }
          (evt.shiftKey) ? component.front() : component.forward()
        }
        break
      case 'Escape':
        {
          const component = getLastSelectedAppendableComponent(draw)
          // console.log(component)
          if(!component) {
            showHint('Select one line or circle first!')
            return
          }
          component.endAppendMode(draw)
        }
        break
      case 'KeyA':
        {
          if (evt.metaKey) {
            doAction(draw, selectAllSelectableComponents, {draw})
            evt.preventDefault()
            evt.stopPropagation()
            return
          } 
          if (evt.shiftKey) {
            points = getSelectedSelectablePointElements(draw)
            if (!points || points.length < 3) {
              showHint('Select 3 points first!')
              return
            }
            points = [points[0], points[1], points[2]] // use only the last 3 points
            refs = points.map(p => p.attr(NO_ATTR))
            doAction(draw, addAngle, {draw, refs})
            return
          }
          const component = getLastSelectedAppendableComponent(draw)
          if(component) {
            component.toggleAppendMode(draw)
          } else {
            const coord = draw.mousePosition
            doAction(draw, addPoint, {draw, coord})
          }
        }
        break
      case 'KeyB':
        {
          points = getSelectedSelectablePointElements(draw)
          if (!points || points.length < 3) {
            showHint('Select 3 points first!')
            return
          }
          points = [points[0], points[1], points[2]] // use only the last 3 points
          refs = points.map(p => p.attr(NO_ATTR))
          doAction(draw, addBisectorLine, {draw, refs})
          return
        }
      case 'KeyC':
        if (evt.altKey) {
          editField('#field_class')
          evt.preventDefault()
          return
        } else if (evt.metaKey) { // copy to clipboard
          const content = svgDocument(draw) 
          navigator.clipboard.writeText(content).then(() => {
            showHint('Copied!')
          })
          return 
        } else {
          if (!points) {
            showHint('Select 2 points first!')
            return
          }
          doAction(draw, addCircle, {draw, refs})
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
        if (evt.metaKey) { // export to html
          exportToHTML(draw)
          evt.preventDefault()
          evt.stopPropagation()
        } else if (evt.ctrlKey) { // execute user script
          evt.preventDefault()
          evt.stopPropagation()
          SVG('#runButton').node.click()
        } else {
          if (evt.shiftKey) { // close with edge (last to first)
            points = getSelectedSelectablePointElements(draw)
            if (!points || points.length < 3) {
              console.log(points.length)
              showHint('At least 3 points to close the shape')
              return
            }
            refs = points.map(p => p.attr(NO_ATTR))
            const firstRef = refs[0]
            const lastRef = refs[points.length - 1]
            refs = [lastRef, firstRef]
            doAction(draw, addEdge, {draw, refs})
            return
          }
          if (!points) {
            showHint('Select 2 points first!')
            return
          }
          doAction(draw, addEdge, {draw, refs})
        }
        break
      case 'KeyF':
        {
          let components = getSelectedFillableShapes(draw)
          if (components.length == 0) {
            showHint('Select one circle or polygon first!')
            return
          }
          components = components.map(component => component.no)
          doAction(draw, toggleAttribute, {draw, components, attributeName : FSG_FILL_NONE_ATTR})
        }
        break
      case 'KeyH':
        {
          let components = getSelectedComponents(draw)
          if (components.length == 0) {
            showHint('Selection one component first')
            return
          }
          components = components.map(component => component.no)
          doAction(draw, toggleAttribute, {draw, components, attributeName : FSG_HIDDEN_ATTR})
        }
        break
      case 'KeyI':
        if (evt.metaKey) return
        if (evt.altKey) {
          editField('#field_id')
          evt.preventDefault()
          return
        } else { 
          const intersectableComponents = getLast2SelectedIntersectableComponents(draw)
          if (!intersectableComponents) {
            showHint('Select 2 intersectable components(line or circle) first')
            return
          }
          if (intersectableComponents[0] instanceof LineShape) {
            if (intersectableComponents[1] instanceof LineShape) { // intersect two lines
              const [l1, l2] = intersectableComponents
              const coord = intersect(l1.startPoint(), l1.direction(), l2.startPoint(), l2.direction())
              // console.log(coord, l1.direction(), l2, l2.direction())
              const refs = [l1.no, l2.no]
              const index = 0
              doAction(draw, addIntersectPoint, {draw, coord, index, refs})
            } else { // line + circle
              const [line, circle] = intersectableComponents
              const intersectPoints = intersectLineAndCircle(line.startPoint(), line.direction(), circle.center(), circle.radius)
              const refs = [line.no, circle.no]
              let coord = intersectPoints[0]
              let index = 0
              doAction(draw, addIntersectPoint, {draw, coord, index, refs})
              coord = intersectPoints[1]
              index = 1
              doAction(draw, addIntersectPoint, {draw, coord, index, refs})
            }
          } else { // circle + line
            if (intersectableComponents[1] instanceof LineShape) {
              const [circle, line] = intersectableComponents
              const intersectPoints = intersectLineAndCircle(line.startPoint(), line.direction(), circle.center(), circle.radius)
              const refs = [line.no, circle.no]
              let coord = intersectPoints[0]
              let index = 0
              doAction(draw, addIntersectPoint, {draw, coord, index, refs})
              coord = intersectPoints[1]
              index = 1
              doAction(draw, addIntersectPoint, {draw, coord, index, refs})
            } else { // two circles
              const [circle1, circle2] = intersectableComponents
              const c1 = { a: circle1.center().x, b: circle1.center().y, r: circle1.radius }
              const c2 = { a: circle2.center().x, b: circle2.center().y, r: circle2.radius }
              const intersectPoints = twoCirclesIntersection(c1, c2)
              if (!intersectPoints) return
              const refs = [circle1.no, circle2.no]
              let coord = intersectPoints[0]
              let index = 0
              doAction(draw, addIntersectPoint, {draw, coord, index, refs})
              coord = intersectPoints[1]
              index = 1
              doAction(draw, addIntersectPoint, {draw, coord, index, refs})
            }
          }
        }
        break
      case 'KeyL':
        {
          if (!points) {
            showHint('Select 2 points first!')
            return
          }
          doAction(draw, addLine, {draw, refs})
        }
        break
      case 'KeyM':
        {
          if (evt.shiftKey) { // measure
            points = getSelectedSelectablePointElements(draw)
            if (!points || points.length == 1) { // measure length between 2 points
              showHint('Select 2 points first!')
              return
            }
            if (points.length == 2) {
              refs = points.map(p => p.attr(NO_ATTR))
              doAction(draw, addLengthMarker, {draw, refs})
              return
            }
            points = [points[0], points[1], points[2]] // use only the last 3 points
            refs = points.map(p => p.attr(NO_ATTR))
            doAction(draw, addAngleMarker, {draw, refs})
            return
          }
          if (!points) {
            showHint('Select 2 points first!')
            return
          }
          doAction(draw, addMidPoint, {draw, refs})
        }
        break
      case 'KeyP':
        {
          points = getSelectedSelectablePointElements(draw)
          if (!points || points.length < 3) {
            showHint('Select at least 3 points first!')
            return
          }
          refs = points.map(p => p.attr(NO_ATTR))
          doAction(draw, addPolygon, {draw, refs})
        }
        break
      case 'KeyO':
        {
          if (evt.metaKey) { // open file
            const file = SVG('#file')
            file.node.value = '' // reset or the same file won't be opened. bug fixed: issue #3
            file.node.click()
            evt.preventDefault()
            evt.stopPropagation()
          }
        }
        break
      case 'KeyR':
        {
          if (evt.ctrlKey) { // reload
            SVG('#reloadButton').node.click()
          } else if(!evt.metaKey) { // prevent cmd+r
            if (!points) return
            doAction(draw, addRay, {draw, refs})
          }
        }
        break
      case 'KeyS':
        if (evt.metaKey) {
          saveAsSVG(draw)
          evt.preventDefault()
          evt.stopPropagation()
        } else {
          let components = getSelectedShapes(draw)
          if (components.length == 0) {
            showHint('Select one component first!')
            return
          }
          components = components.map(component => component.no)
          const className = 'dashed'
          doAction(draw, toggleClass, {draw, components, className})
        }
        break
      case 'KeyT': // text
        {
          if (evt.shiftKey) { // append LaTeX
            const target = lastSelectedComponent(draw)
            if (!target) {
              showHint('Select the target component first!')
              return
            }
            const refs = [target.no]
            doAction(draw, addLaTeX, {draw, refs})
          } else if (!evt.altKey) { // add LaTeX
            doAction(draw, addLaTeX, {draw})
          }
          editField('#field_text')
          evt.preventDefault()
        }
        break
      case 'KeyV':
        {
          if (!points) {
            showHint('Select 2 points first!')
            return
          }
          doAction(draw, addVector, {draw, refs})
        }
        break
      case 'Equal':
        {
          const lineAndPoint = getLastSelectedLineBaseAndPointComponent(draw)
          // console.log(lineAndPoint)
          if (!lineAndPoint) {
            showHint('Select one line/edge/vector and one point first')
            return
          }
          const [ line, point ] = lineAndPoint
          const refs = [line.no, point.no]
          if (evt.shiftKey) { // Perp Line
            doAction(draw, addPerpLine, {draw, refs})
          } else { // Parallel Line
            doAction(draw, addParallelLine, {draw, refs})
          }
        }
        break
      case 'KeyX':
        {
          // Project point on line
          const lineAndPoint = getLastSelectedLineBaseAndPointComponent(draw)
          if (!lineAndPoint) {
            showHint('Select one line/edge/vector and one point first')
            return
          }
          const [ line, point ] = lineAndPoint
          const coord = projectPointOnLine(point.center(), line.startPoint(), line.direction())
          const refs = [line.no, point.no]
          const index = 0
          doAction(draw, addIntersectPoint, {draw, coord, index, refs})
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
