'use strict'

import { NO_ATTR, FSG_HIDDEN_ATTR } from '../common/define.js'
import { projectPointOnLine } from '../common/math.js'

// modules
import { undo, redo, doAction } from './history.js'
import { saveAsSVG, exportToHTML, svgDocument } from './file.js'
import { toggle_code_editor } from './code_editor.js'
import { showHint } from './ui.js'
import { toggle_preference_window } from './preference.js'
import {
  toggleAttribute,
  toggleSolid,
  changeStyle,
  changeClass,
  hasDashedClass,
  removeAllDashedClass,
  copyStyle,
  isCopiedStyle,
  pasteStyle
} from './style.js'
import {
  altColorPicker,
  editField,
  lastVisibleFillColor,
  lastVisibleStrokeColor,
  whichColorField
} from './inspector.js'
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
  removeLastSelection,
} from './selection.js'

// components
import { addIntersectPoint, addMidPoint } from '../components/point.js'
import { addPoint } from '../components/draggable-point.js'
import { addLine, addRay, addParallelLine, addPerpLine, addBisectorLine } from '../components/line.js'
import { addEdge, addVector } from '../components/line-segment.js'
import { Shape } from '../components/shape.js'
import { addPolygon, addCircle, addAngle, FillableShape } from '../components/fillable.js'
import { addAngleMarker, addLengthMarker } from '../components/measure.js'
import { addLaTeX } from '../components/latex.js'
import { chooseIntersectPoint } from './appending-point.js'

let _keydownHandler, _keyupHandler

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

function setDashedClass(evt, draw, className) {
  const newValue = className

  if (evt.shiftKey) {
    const components = getSelectedShapes(draw)
    const oldValues = []
    const refs = components.map(component => {
      const element = component.element
      oldValues.push(element.attr('class'))
      removeAllDashedClass(element)
      return component.no
    })
    doAction(changeClass, {draw, refs, oldValues, newValue})
    return
  }

  const component = lastSelectedComponent(draw)
  if ((!component || !(component instanceof Shape)) && showHint('Select a shape first!')) return
  const element = component.element
  if (hasDashedClass(element) == newValue) return

  const refs = [component.no]
  const oldValues = [element.attr('class')]
  removeAllDashedClass(element)
  doAction(changeClass, {draw, refs, oldValues, newValue})
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

    if (!draw.ready) return // don't responde before system ready

    if (draw.appendingPoint) {
      // escape from appending modes
      if (evt.code == 'Escape') draw.cancelAppendingPoint()
      return
    }

    if (!(evt.metaKey && evt.altKey && evt.code == 'KeyI') &&
        !(evt.metaKey && evt.code == 'KeyR')) {
      evt.preventDefault()
      evt.stopPropagation()
    }

    let points = getLast2SelectedPointElements(draw)
    let refs
    if (points) refs = points.map(p => p.attr(NO_ATTR))
    switch(evt.code) {
      case 'F1':
        {
          toggle_code_editor() // F1: toggle code editor
        }
        break
      case 'Comma':
        {
          if(evt.metaKey) toggle_preference_window(draw) // cmd + , : toggle preference
        }
        break
      case 'Tab': // tab: toggle angle's large arc mode
        {
          const components = getLastSelectedAngleComponents(draw)
          if (!components && showHint('Select angle first!')) return
          components.forEach(angle => angle.toggleMode() )
        }
        break
      case 'Backspace': // backspace : delete all selected
        {
          const component = lastSelectedComponent(draw)
          if (!hasComponent(component)) return
          if (evt.shiftKey) {
            doAction(removeAllSelections, { draw })
            return
          }

          doAction(removeLastSelection, { draw })
        }
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
      case 'Digit1':
        {
          setDashedClass(evt, draw, 'dashed')
        }
        break
      case 'Digit2':
        {
          setDashedClass(evt, draw, 'dashed2')
        }
        break
      case 'Digit3':
        {
          setDashedClass(evt, draw, 'dashed3')
        }
        break
      case 'Digit4':
        {
          setDashedClass(evt, draw, 'dashed4')
        }
        break
      case 'KeyA':
        {
          if (evt.metaKey) { // cmd + a : select all
            doAction(selectAllSelectableComponents, {draw})
            return
          } 
          if (evt.shiftKey) { // shift + a : add angle
            points = getSelectedSelectablePointElements(draw)
            if (!has3Points(points)) return
            points = [points[0], points[1], points[2]] // use only the last 3 points
            refs = points.map(p => p.attr(NO_ATTR))
            doAction(addAngle, {draw, refs})
            return
          }
          const component = getLastSelectedAppendableComponent(draw)
          if (component) { // a : appending pin point
            component.toggleAppendMode(draw)
            return
          }
          // a : add point
          const coord = draw.mousePosition
          doAction(addPoint, {draw, coord})
        }
        break
      case 'KeyB':
        {
          // b : Bisector Line
          points = getSelectedSelectablePointElements(draw)
          if (!has3Points(points)) return
          points = [points[0], points[1], points[2]] // use only the last 3 points
          refs = points.map(p => p.attr(NO_ATTR))
          doAction(addBisectorLine, {draw, refs})
        }
        break
      case 'KeyC':
        {
          if (evt.altKey) { // alt + c : edit class
            editField('#field_class')
            return
          } 
          if (evt.metaKey) { // cmd + c : copy to clipboard
            const content = svgDocument(draw) 
            navigator.clipboard.writeText(content).then(() => showHint('Copied to the clipboard!') )
            return 
          }
          if (evt.ctrlKey) { // ctrl + c : copy style
            const component = lastSelectedComponent(draw)
            if ((!component || !(component instanceof Shape)) && showHint('Select a shape first')) return
            copyStyle(component)
            return
          }
          // c : add circle
          if (!has2Points(points)) return
          doAction(addCircle, {draw, refs})
        }
        break
      case 'KeyD':
        {
          if (numberOfSelections(draw) > 0) {
            (evt.metaKey) 
              ? doAction(unselectAllSelections, draw) // cmd + d : deselect all
              : doAction(deselectLastSelection, draw) // d : deselect the last one
          }
        }
        break
      case 'KeyE':
        {
          if (evt.metaKey) { // cmd + e : export to html
            exportToHTML(draw)
            return
          }
          if (evt.ctrlKey) { // ctrl + e : execute user script
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
            doAction(addEdge, {draw, refs})
            return
          }
          // e : add edge
          if (!has2Points(points)) return
          doAction(addEdge, {draw, refs})
        }
        break
      case 'KeyF':
        { 
          if (evt.altKey) { // alt + f : switch to fill field
            altColorPicker('#field_fill')
            return
          }
          const attributeName = whichColorField()
          const newValue = {}
          newValue[attributeName] = (attributeName == 'fill') ? lastVisibleFillColor() : lastVisibleStrokeColor()

          if (evt.shiftKey) { // shift + f: fill/stroke color of all fillable selected components
            const components = getSelectedFillableShapes(draw)
            if (!components[0] && showHint('Select one circle or polygon first!')) return
            refs = components.map(component => component.no)
            doAction(changeStyle, {draw, refs, newValue})
            return
          }

          // fill/stroke color to the last selected component
          const component = lastSelectedComponent(draw)
          if ((!component || !(component instanceof FillableShape))
            && showHint('Select one circle or polygon first!')) return
          const oldValue = component.getAttribute('fill')
          if (oldValue != 'none') return // alread filled
          refs = [component.no]
          doAction(changeStyle, {draw, refs, newValue})
        }
        break
      case 'KeyH':
        {
          if (evt.shiftKey) { // shift + h : hide all selections
            let components = getSelectedComponents(draw)
            if (!hasComponent(components[0])) return
            refs = components.map(component => component.no)
            doAction(toggleAttribute, {draw, refs, attributeName : FSG_HIDDEN_ATTR})
            return
          }
          // h : hide the last selected
          const component = lastSelectedComponent(draw)
          if (!hasComponent(component)) return
          refs = [component.no]
          doAction(toggleAttribute, {draw, refs, attributeName : FSG_HIDDEN_ATTR})
        }
        break
      case 'KeyI':
        {
          if (evt.metaKey) return

          if (evt.altKey) { // alt + i : edit id
            editField('#field_id')
            return
          } 

          // Intersect point(s)
          const intersectableComponents = getLast2SelectedIntersectableComponents(draw)
          if (!intersectableComponents) {
            showHint('Select 2 intersectable components(line or circle) first')
            return
          }
          chooseIntersectPoint(draw, intersectableComponents)
        }
        break
      case 'KeyL':
        {
          // l : add line
          if (has2Points(points)) doAction(addLine, {draw, refs})
        }
        break
      case 'KeyM':
        {
          if (evt.shiftKey) { // shift + m : measure
            points = getSelectedSelectablePointElements(draw)
            if (!has2Points(points)) return
            if (points.length == 2) { // measure length between 2 points
              refs = points.map(p => p.attr(NO_ATTR))
              doAction(addLengthMarker, {draw, refs})
              return
            }
            // measure angle of 3 points
            points = [points[0], points[1], points[2]] // use only the last 3 points
            refs = points.map(p => p.attr(NO_ATTR))
            doAction(addAngleMarker, {draw, refs})
            return
          }
          // m : mid point
          if (!has2Points(points)) return
          doAction(addMidPoint, {draw, refs}) // add mid point between 2 points
        }
        break
      case 'KeyN':
        { 
          const attributeName = whichColorField()
          const newValue = {}
          newValue[attributeName] = 'none'

          // shift + f: fill/stroke none to all fillable selected components
          if (evt.shiftKey) {
            let components = getSelectedFillableShapes(draw)
            if (!components[0] && showHint('Select one circle or polygon first!')) return
            refs = components.map(component => component.no)
            doAction(changeStyle, {draw, refs, newValue})
            return
          }

          // fill/stroke none the last selected component
          const component = lastSelectedComponent(draw)
          if ((!component || !(component instanceof FillableShape))
            && showHint('Select one circle or polygon first!')) return
          const oldValue = component.getAttribute('fill')
          if (oldValue == 'none') return // already none
          refs = [component.no]
          doAction(changeStyle, {draw, refs, newValue})
        }
        break
      case 'KeyP':
        {
          // p : add polygon
          points = getSelectedSelectablePointElements(draw)
          if (!has3Points(points)) return
          refs = points.map(p => p.attr(NO_ATTR))
          doAction(addPolygon, {draw, refs})
        }
        break
      case 'KeyO':
        {
          if (evt.metaKey) { // cmd + o : open file
            const file = SVG('#file')
            file.node.value = '' // reset or the same file won't be opened. bug fixed: issue #3
            file.node.click()
          }
        }
        break
      case 'KeyR':
        {
          if (evt.ctrlKey) { // ctrl + r : reload content
            SVG('#reloadButton').node.click()
          } else if (!evt.metaKey) { // prevent cmd + r
            if (!has2Points(points)) return
            doAction(addRay, {draw, refs}) // r : add ray
          }
        }
        break
      case 'KeyS':
        {
          if (evt.metaKey) { // cmd + s : save as svg
            const _document = saveAsSVG(draw)
            document.dispatchEvent(new CustomEvent('update_document', { detail : _document }))
            return
          }
          if (evt.altKey) { // alt + s : switch to stroke field
            altColorPicker('#field_stroke')
            return
          }

          // shift + s : toggle solid of all selected
          if (evt.shiftKey) {
            const components = getSelectedShapes(draw)
            if (!hasComponent(components[0])) return
            refs = components.map(component => component.no)
            doAction(toggleSolid, {draw, refs})
            return
          }

          // s : toggle solid / dashed stroke
          const component = lastSelectedComponent(draw)
          if ((!component || !(component instanceof Shape)) && showHint('Select a shape first!')) return
          refs = [component.no]
          doAction(toggleSolid, {draw, refs})
        }
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
            doAction(addLaTeX, {draw, refs})
          } else if (!evt.altKey) { // t: add LaTeX
            doAction(addLaTeX, {draw})
          }
          editField('#field_text')
        }
        break
      case 'KeyV':
        { 
          if (evt.ctrlKey) { // ctrl + v: paste style
            if (!isCopiedStyle() && showHint('Copy a style first!')) return
            const component = lastSelectedComponent(draw)
            if ((!component || !(component instanceof Shape)) && showHint('Can only paste the style to a shape')) return
            pasteStyle({draw, refs: [component.no]})
            return
          }
          // v : add vector
          if (has2Points(points)) doAction(addVector, {draw, refs})
        }
        break
      case 'Equal':
        { 
          const lineAndPoint = getLastSelectedLineBaseAndPointComponent(draw)
          if (!lineAndPoint) {
            showHint('Select one line/edge/vector and one point first')
            return
          }
          const [ line, point ] = lineAndPoint
          const refs = [line.no, point.no]
          if (evt.shiftKey) { // shift + = (+): Perp Line
            doAction(addPerpLine, {draw, refs})
          } else { // = : Parallel Line
            doAction(addParallelLine, {draw, refs})
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
          doAction(addIntersectPoint, {draw, coord, index, refs})
        }
        break
      case 'KeyU':
      case 'KeyZ':
        {
          if (evt.shiftKey) redo(draw) // shift + u/z : redo
          else undo(draw) // u/z : undo
        }
        break
    }
  }
  document.addEventListener('keydown', _keydownHandler)
}
