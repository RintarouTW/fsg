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
import {addAppendingIntersectPoint, AppendingIntersectPoint, AppendingPinPoint} from '../components/appending-point.js'

let _keydownHandler, _keyupHandler
let _appendingIntersectPoint

function hasComponent(component) {
  if (!component && showHint('Select one component first!')) return false
  return true
}

function has2Points(points) {
  if (!points && showHint('Select 2 points first!')) return false
  return true
}

function has3Points(points) {
  if ((!points || points.length < 3) && showHint('Select 3 points first!')) return false
  return true
}

function chooseIntersectPoint(draw, intersectPoints, refs) {
  // enter point choose mode
  _appendingIntersectPoint = addAppendingIntersectPoint({draw, intersectPoints, refs})
}

function doIntersectPoints(draw, intersectableComponents) {
  if (intersectableComponents[0] instanceof LineShape) {
    if (intersectableComponents[1] instanceof LineShape) { // intersect two lines
      const [l1, l2] = intersectableComponents
      const coord = intersect(l1.startPoint(), l1.direction(), l2.startPoint(), l2.direction())
      // console.log(coord, l1.direction(), l2, l2.direction())
      doAction(draw, addIntersectPoint, {draw, coord, index : 0, refs : [l1.no, l2.no]})
    } else { // line + circle
      const [line, circle] = intersectableComponents
      const intersectPoints = intersectLineAndCircle(line.startPoint(), line.direction(), circle.center(), circle.radius)
      chooseIntersectPoint(draw, intersectPoints, [line.no, circle.no])
    }
    return
  } 
  if (intersectableComponents[1] instanceof LineShape) { // circle + line
    const [circle, line] = intersectableComponents
    const intersectPoints = intersectLineAndCircle(line.startPoint(), line.direction(), circle.center(), circle.radius)
    chooseIntersectPoint(draw, intersectPoints, [line.no, circle.no])
    return
  } 
  // two circles
  const [circle1, circle2] = intersectableComponents
  const c1 = { a: circle1.center().x, b: circle1.center().y, r: circle1.radius }
  const c2 = { a: circle2.center().x, b: circle2.center().y, r: circle2.radius }
  const intersectPoints = twoCirclesIntersection(c1, c2)
  if (!intersectPoints) return
  chooseIntersectPoint(draw, intersectPoints, [circle1.no, circle2.no])
}

export function init_module_keybinding(draw) {

  if (_keyupHandler) document.removeEventListener('keyup', _keyupHandler)
  if (_keydownHandler) document.removeEventListener('keydown', _keydownHandler)

  _keyupHandler = evt => {
    draw.shiftKey = evt.shiftKey
  }
  document.addEventListener('keyup', _keyupHandler)

  _keydownHandler = evt => {
    console.log(evt.code)
    draw.shiftKey = evt.shiftKey

    if (typeof window.FSG_BUILDER !== 'undefined' && evt.target != document.body) return

    if (!draw.ready) return // ready to action after the opening animation

    if (draw.dragTarget && evt.code == 'Escape') { // escape from special modes
      if (draw.dragTarget.component instanceof AppendingPinPoint) { // leave appending mode
        const component = getLastSelectedAppendableComponent(draw)
        if(component) component.endAppendMode(draw)
        return
      }
      if (_appendingIntersectPoint) { // leave point choose mode.
        draw.dragTarget = null
        _appendingIntersectPoint.remove()
        _appendingIntersectPoint = null
      }
      return
    }

    let points = getLast2SelectedPointElements(draw)
    let refs
    if (points) refs = points.map(p => p.attr(NO_ATTR))
    switch(evt.code) {
      case 'F1':
        toggle_code_editor() // F1: toggle code editor
        break
      case 'Comma':
        if(evt.metaKey) toggle_preference_window(draw) // cmd + , : toggle preference
        break
      case 'Tab': // tab: toggle angle's large arc mode
        {
          evt.preventDefault()
          evt.stopPropagation()
          const components = getLastSelectedAngleComponents(draw)
          if (!component && showHint('Select angle first!')) return
          components.forEach(angle => angle.toggleMode() )
        }
        break
      case 'Backspace': // backspace : delete all selected
        doAction(draw, removeAllSelections, { draw })
        break
      case 'BracketLeft': // [ : backward, shift + [ : back
        {
          const component = lastSelectedComponent(draw)
          if (!hasComponent(component)) return
          (evt.shiftKey) ? component.back() : component.backward()
        }
        break
      case 'BracketRight': // ] : forward, shift + ] : front
        {
          const component = lastSelectedComponent(draw)
          if (!hasComponent(component)) return
          (evt.shiftKey) ? component.front() : component.forward()
        }
        break
      case 'KeyA':
        {
          if (evt.metaKey) { // cmd + a : select all
            doAction(draw, selectAllSelectableComponents, {draw})
            evt.preventDefault()
            evt.stopPropagation()
            return
          } 
          if (evt.shiftKey) { // shift + a : add angle
            points = getSelectedSelectablePointElements(draw)
            if (!has3Points(points)) return
            points = [points[0], points[1], points[2]] // use only the last 3 points
            refs = points.map(p => p.attr(NO_ATTR))
            doAction(draw, addAngle, {draw, refs})
            return
          }
          const component = getLastSelectedAppendableComponent(draw)
          if(component) { // a : appending pin point
            component.toggleAppendMode(draw)
            return
          }
          // a : add point
          const coord = draw.mousePosition
          doAction(draw, addPoint, {draw, coord})
        }
        break
      case 'KeyB':
        { // b : Bisector Line
          points = getSelectedSelectablePointElements(draw)
          if (!has3Points(points)) return
          points = [points[0], points[1], points[2]] // use only the last 3 points
          refs = points.map(p => p.attr(NO_ATTR))
          doAction(draw, addBisectorLine, {draw, refs})
        }
        break
      case 'KeyC':
        {
          if (evt.altKey) { // alt + c : edit class
            editField('#field_class')
            evt.preventDefault()
            return
          } 
          if (evt.metaKey) { // cmd + c : copy to clipboard
            const content = svgDocument(draw) 
            navigator.clipboard.writeText(content).then(() => showHint('Copied!') )
            return 
          }
          // c : add circle
          if (!has2Points(points)) return
          doAction(draw, addCircle, {draw, refs})
        }
        break
      case 'KeyD':
        {
          if (numberOfSelections(draw) > 0) {
            (evt.shiftKey) 
              ? doAction(draw, unselectAllSelections, draw) // shift + d : unselect all
              : doAction(draw, deselectLastSelection, draw) // d : unselect the last one
          }
        }
        break
      case 'KeyE':
        if (evt.metaKey) { // cmd + e : export to html
          evt.preventDefault()
          evt.stopPropagation()
          exportToHTML(draw)
          return
        }
        if (evt.ctrlKey) { // ctrl + e : execute user script
          evt.preventDefault()
          evt.stopPropagation()
          SVG('#runButton').node.click()
          return
        }
        if (evt.shiftKey) { // shift + e : close with edge (last to first)
          points = getSelectedSelectablePointElements(draw)
          if ((!points || points.length < 3) && showHint('At least 3 points to close the shape')) return
          refs = points.map(p => p.attr(NO_ATTR))
          const firstRef = refs[0]
          const lastRef = refs[points.length - 1]
          refs = [lastRef, firstRef]
          doAction(draw, addEdge, {draw, refs})
          return
        }
        // e : add edge
        if (!has2Points(points)) return
        doAction(draw, addEdge, {draw, refs})
        break
      case 'KeyF':
        { // f: toggle fill of all fillable selections
          let components = getSelectedFillableShapes(draw)
          if (!components[0] && showHint('Select one circle or polygon first!')) return
          components = components.map(component => component.no)
          doAction(draw, toggleAttribute, {draw, components, attributeName : FSG_FILL_NONE_ATTR})
        }
        break
      case 'KeyH':
        { // h : hide all selections
          let components = getSelectedComponents(draw)
          if (!hasComponent(components[0])) return
          components = components.map(component => component.no)
          doAction(draw, toggleAttribute, {draw, components, attributeName : FSG_HIDDEN_ATTR})
        }
        break
      case 'KeyI':
        if (evt.metaKey) return
        if (evt.altKey) { // alt + i : edit id
          editField('#field_id')
          evt.preventDefault()
          return
        } 
        // Intersect point(s)
        const intersectableComponents = getLast2SelectedIntersectableComponents(draw)
        if (!intersectableComponents) {
          showHint('Select 2 intersectable components(line or circle) first')
          return
        }
        doIntersectPoints(draw, intersectableComponents)
        break
      case 'KeyL':
        { // l : add line
          if (has2Points(points)) doAction(draw, addLine, {draw, refs})
        }
        break
      case 'KeyM':
        {
          if (evt.shiftKey) { // shift + m : measure
            points = getSelectedSelectablePointElements(draw)
            if (!has2Points(points)) return
            if (points.length == 2) { // measure length between 2 points
              refs = points.map(p => p.attr(NO_ATTR))
              doAction(draw, addLengthMarker, {draw, refs})
              return
            }
            // measure angle of 3 points
            points = [points[0], points[1], points[2]] // use only the last 3 points
            refs = points.map(p => p.attr(NO_ATTR))
            doAction(draw, addAngleMarker, {draw, refs})
            return
          }
          if (!has2Points(points)) return
          doAction(draw, addMidPoint, {draw, refs}) // add mid point between 2 points
        }
        break
      case 'KeyP':
        { // p : add polygon
          points = getSelectedSelectablePointElements(draw)
          if (!has3Points(points)) return
          refs = points.map(p => p.attr(NO_ATTR))
          doAction(draw, addPolygon, {draw, refs})
        }
        break
      case 'KeyO':
        {
          if (evt.metaKey) { // cmd + o : open file
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
          if (evt.ctrlKey) { // ctrl + r : reload content
            SVG('#reloadButton').node.click()
          } else if(!evt.metaKey) { // prevent cmd + r
            if (!has2Points(points)) return
            doAction(draw, addRay, {draw, refs}) // r : add ray
          }
        }
        break
      case 'KeyS':
        if (evt.metaKey) { // cmd + s : save as svg
          saveAsSVG(draw)
          evt.preventDefault()
          evt.stopPropagation()
          return
        }
        // s : toggle solid / dashed stroke
        let components = getSelectedShapes(draw)
        if (!hasComponent(components[0])) return
        components = components.map(component => component.no)
        const className = 'dashed'
        doAction(draw, toggleClass, {draw, components, className})
        break
      case 'KeyT': // text
        {
          if (evt.shiftKey) { // shift + t: append LaTeX
            const target = lastSelectedComponent(draw)
            if (!target) {
              showHint('Select the target component first!')
              return
            }
            const refs = [target.no]
            doAction(draw, addLaTeX, {draw, refs})
          } else if (!evt.altKey) { // t: add LaTeX
            doAction(draw, addLaTeX, {draw})
          }
          editField('#field_text')
          evt.preventDefault()
        }
        break
      case 'KeyV':
        { // v : add vector
          if (has2Points(points)) doAction(draw, addVector, {draw, refs})
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
          if (evt.shiftKey) { // shift + = (+): Perp Line
            doAction(draw, addPerpLine, {draw, refs})
          } else { // = : Parallel Line
            doAction(draw, addParallelLine, {draw, refs})
          }
        }
        break
      case 'KeyX':
        {
          // x: Project point on line
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
        if (evt.shiftKey) redo(draw) // shift + u/z : redo
        else undo(draw) // u/z : undo
        break
    }
  }
  document.addEventListener('keydown', _keydownHandler)
}
