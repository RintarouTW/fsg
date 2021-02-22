'use strict'

import { componentByNo } from '../components/component.js'

export function init_module_history(draw) {
  draw.fsg.history = {}
  draw.fsg.history.history = []
  draw.fsg.history.redo_list = []
}

export function undo(draw) {
  console.assert(draw, 'draw is required')
  const history = draw.fsg.history
  let action = history.history.pop()
  if (!action) return
  action.undo()
  history.redo_list.push(action)
  // console.log('undo redo_list = ', redo_list)
  // console.log('history =', history)
}

// TODO: fixme, Action interface is required.
export function redo(draw) {
  console.assert(draw, 'draw is required')
  const history = draw.fsg.history
  let action = history.redo_list.pop()
  if (!action) return
  console.log(action)
  action.redo()
  // console.log('redo redo_list = ', redo_list)
}

export function doAction(draw, cmd, args) {
  const history = draw.fsg.history
  const action = cmd(args)
  action.redo = () => {
    if(action.component_no) args.component_no = action.component_no
    console.log(cmd, action.component_no)
    doAction(draw, cmd, args)
  }
  history.history.push(action)
  // console.log('history =', history)
}

///
/// ChangeLocationAction
///

class ChangeLocationAction {
  constructor(draw, components, oldValues, newValues) {
    for (let i = 0; i < components.length; i++) {
      const component = componentByNo(draw, components[i])
      const newValue = newValues[i]
      component.setAttribute('cx', newValue.x)
      component.setAttribute('cy', newValue.y)
      component.element.fire('update')
    }
    this.draw = draw
    this.components = components
    this.oldValues = oldValues
    this.newValues = newValues
  }
  undo() {
    const components = this.components
    const oldValues = this.oldValues
    for (let i = 0; i < components.length; i++) {
      const component = componentByNo(this.draw, components[i])
      const oldValue = oldValues[i]
      component.setAttribute('cx', oldValue.x)
      component.setAttribute('cy', oldValue.y)
      component.element.fire('update')
    }
  }
}

export function changeLocation({draw, components, oldValues, newValues}) {
  return new ChangeLocationAction(draw, components, oldValues, newValues)
}
