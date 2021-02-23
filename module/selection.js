'use strict'

import { SelectableComponent } from '../components/component.js'
import { Circle, Arc } from '../components/fillable.js'
import { ArrowedArc, LengthMarker } from '../components/measure.js'
import { SelectablePoint } from '../components/point.js'
import { Point } from '../components/draggable-point.js'
import { InvisiblePoint } from '../components/invisible-point.js'
import { Shape } from '../components/shape.js'
import { FillableShape } from '../components/fillable.js'
import { LineShape } from '../components/line.js'
import { NO_ATTR } from '../common/define.js'

export function init_module_selection(draw) {
  console.assert(draw, 'draw must exist')
  draw.fsg.selection = {}
  draw.fsg.selection.selections = []
  window.selectComponent = selectComponent
  window.unselectComponent = unselectComponent
  window.getSelectedPointElements = getSelectedPointElements
}

const inspector = SVG('#inspector')

function inspect(component) {
  inspector?.fire('inspect-component', { component })
}

function detach() {
  inspector?.fire('inspect-detach')
}

function selectComponent(draw, component) {
  if (!draw.ready) return
  console.assert(draw, 'draw must exist')
  let selections = draw.fsg.selection.selections
  let list = Array.isArray(component) ? component : [component]
  list.forEach(item => {
    console.assert(item, list)
    if(item instanceof InvisiblePoint) return // skip unselectable points
    item.select()
    selections = selections.filter(comp => comp !== item)
    selections.push(item)
    inspect(item) 
  })
  draw.fsg.selection.selections = selections
  return component
}

function unselectComponent(draw, component) {
  console.assert(draw, 'draw must exist')
  let selections = draw.fsg.selection.selections
  let list = Array.isArray(component) ? component : [component]
  list.forEach(item => {
    item.unselect()
    selections = selections.filter(s => s !== item)
  })
  const length = selections.length
  if (length == 0) detach()
  else inspect(selections[length - 1])

  draw.fsg.selection.selections = selections
  return component
}

class SelectAllAction {
  constructor(draw) {
    this.draw = draw

    const components = draw.find(`[${NO_ATTR}]`)
    let selections = []
    components.forEach(item => {
      const component = item.component
      if (component instanceof SelectableComponent) {
        component.select()
        selections.push(component)
      }
    })
    draw.fsg.selection.selections = selections
    this.components = selections
  }
  undo() {
    unselectComponent(this.draw, this.components)
  }
}

export function selectAllSelectableComponents({draw}) {
  return new SelectAllAction(draw)
}

class UnSelectAllAction {
  constructor(draw, components) {
    this.components = components
    this.draw = draw
    unselectComponent(draw, components)
  }
  undo() {
    selectComponent(this.draw, this.components)
  }
}

export function deselectLastSelection(draw) {
  console.assert(draw, 'draw must exist')
  const selections = draw.fsg.selection.selections

  const lastSelection = selections.pop()
  const action = new UnSelectAllAction(draw, [lastSelection])
  if (selections.length == 0) detach()
  draw.fsg.selection.selections = selections
  return action
}

export function unselectAllSelections(draw) {
  console.assert(draw, 'draw must exist')
  detach()
  const selections = draw.fsg.selection.selections
  const action = new UnSelectAllAction(draw, selections)
  draw.fsg.selection.selections = []
  return action
}

export function numberOfSelections(draw) {
  console.assert(draw, 'draw must exist')
  const selections = draw.fsg.selection.selections
  return selections.length
}

class DeleteAllSelectionsAction {
  constructor(draw) {
    detach()
    this.content = draw.parent().svg()
    this.draw = draw
    this.selections = []
    draw.fsg.selection.selections.forEach(component => {
      this.selections.push(component.no)
      component.remove() 
    })
    draw.fsg.selection.selections = []
  }
  undo() { // reconstruct
    this.draw.fire('loadSnapshot', { content : this.content, selections: this.selections })
  }
}

export function removeAllSelections({draw}) {
  console.assert(draw, 'draw must exist')
  const action = new DeleteAllSelectionsAction(draw)
  return action
}

// helpers
export function getLastSelectedAppendableComponent(draw) {
  console.assert(draw, 'draw must exist')
  const selections = draw.fsg.selection.selections
  for(let i = selections.length - 1; i >= 0; i--) {
    const item = selections[i]
    // console.log(item)
    if (item instanceof LineShape) return item
    else if (item instanceof Circle) return item
  }
  return null
}

export function getLastSelectedLineBaseAndPointComponent(draw) {
  console.assert(draw, 'draw must exist')
  const selections = draw.fsg.selection.selections
  let point, line
  for(let i = selections.length - 1; i >= 0; i--) {
    const item = selections[i]
    // console.log(item)
    if (!line && (item instanceof LineShape)) line = item
    if (!point && (item instanceof SelectablePoint)) point = item
    if (line && point) return [line, point]
  }
  return null
}

export function getLast2SelectedIntersectableComponents(draw) {
  console.assert(draw, 'draw must exist')
  const selections = draw.fsg.selection.selections
  const found = []
  for(let i = selections.length - 1; i >= 0; i--) {
    const item = selections[i]
    if ((item instanceof LineShape) || (item instanceof Circle)) found.push(item)
    if (found.length == 2) return [found[1], found[0]] // swap order
  }
  return null
}

export function getLast2SelectedLineBaseComponents(draw) {
  console.assert(draw, 'draw must exist')
  const selections = draw.fsg.selection.selections
  const found = []
  for(let i = selections.length - 1; i >= 0; i--) {
    const item = selections[i] //; console.log(item)
    if (item instanceof LineShape)
      found.push(item)
    if (found.length == 2) return [found[1], found[0]] // swap order
  }
  return null
}

export function lastSelectedComponent(draw) {
  console.assert(draw, 'draw must exist')
  const selections = draw.fsg.selection.selections
  const l = selections.length
  if(l < 1) return null
  return selections[ l - 1 ]
}

export function getLast2SelectedPointElements(draw) {
  console.assert(draw, 'draw must exist')
  let points = getSelectedSelectablePointElements(draw)
  let l = points.length
  if(l < 2) return null
  return [ points[ l - 2 ], points[ l - 1 ] ]
}

export function getSelectedSelectablePointElements(draw) {
  console.assert(draw, 'draw must exist')
  const selections = draw.fsg.selection.selections
  let points = []
  selections.forEach(item => {
    if (item instanceof SelectablePoint) points.push(item.element) 
  })
  return points
}

function getSelectedPointElements(draw) {
  console.assert(draw, 'draw must exist')
  const selections = draw.fsg.selection.selections
  let points = []
  selections.forEach(item => {
    if (item instanceof Point) points.push(item.element) 
  })
  return points
}

export function getSelectedFillableShapes(draw) {
  console.assert(draw, 'draw must exist')
  const selections = draw.fsg.selection.selections
  let shapes = []
  selections.forEach(item => {
    if (item instanceof FillableShape) shapes.push(item) 
  })
  return shapes
}

export function getSelectedShapes(draw) {
  console.assert(draw, 'draw must exist')
  const selections = draw.fsg.selection.selections
  let shapes = []
  selections.forEach(item => {
    if (item instanceof Shape) shapes.push(item) 
  })
  return shapes
}

export function getSelectedComponents(draw) {
  console.assert(draw, 'draw must exist')
  const selections = draw.fsg.selection.selections
  let shapes = []
  selections.forEach(item => {
    if (item instanceof SelectableComponent) shapes.push(item) 
  })
  return shapes
}

export function getLastSelectedAngleComponents(draw) {
  console.assert(draw, 'draw must exist')
  const selections = draw.fsg.selection.selections
  let angles = []
  selections.forEach(item => {
    if (item instanceof Arc ||
      item instanceof ArrowedArc ||
      item instanceof LengthMarker) angles.push(item) 
  })
  return angles
}
