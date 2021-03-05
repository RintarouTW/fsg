'use strict'

import { FSG_DRAGGING_ATTR } from '../common/define.js'
import { componentByNo } from '../components/component.js'

export function init_module_history(draw) {
  const history = {
    'history' : [],
    'redo_list' : [],
    'doAction' : doAction,
    'changeLocation' : changeLocation
  }
  draw.fsg.history = history
}

export function undo(draw) {
  console.assert(draw, 'draw is required')
  const history = draw.fsg.history
  let action = history.history.pop()
  if (!action) return
  action.undo()
  history.redo_list.push(action)
}

export function redo(draw) {
  console.assert(draw, 'draw is required')
  const history = draw.fsg.history
  let action = history.redo_list.pop()
  if (!action) return
  action.redo()
}

export function doAction(cmd, args) {
  const { draw } = args
  const history = draw.fsg.history
  const action = cmd(args)
  action.redo = () => {
    if(action.no) args.no = action.no
    doAction(cmd, args)
  }
  history.history.push(action)
}

///
/// ChangeLocationAction
///

class ChangeLocationAction {
  constructor(draw, refs, oldValues, newValues) {
    for (let i = 0; i < refs.length; i++) {
      const component = componentByNo(draw, refs[i])
      const newValue = newValues[i]
      component.setAttribute('cx', newValue.x)
      component.setAttribute('cy', newValue.y)
      component.element.fire('update')
    }
    this.draw = draw
    this.refs = refs
    this.oldValues = oldValues
    this.newValues = newValues
  }
  undo() {
    const refs = this.refs
    const oldValues = this.oldValues
    for (let i = 0; i < refs.length; i++) {
      const component = componentByNo(this.draw, refs[i])
      const oldValue = oldValues[i]
      component.setAttribute('cx', oldValue.x)
      component.setAttribute('cy', oldValue.y)
      component.element.fire('update')
    }
  }
}

export function changeLocation({draw}) {
  const refs = [], oldValues = [], newValues = []
  if (draw.dragPoints) {
    draw.dragPoints.map(point => {
      refs.push(point.component.no)
      oldValues.push(point.orgValue)
      newValues.push({ x: point.cx(), y: point.cy() })
      point.attr(FSG_DRAGGING_ATTR, null)
    })
  } else {
    const element = draw.dragTarget
    refs.push(element.component.no)
    oldValues.push({ x: draw.dragStart.x, y: draw.dragStart.y })
    newValues.push({ x: element.cx(), y: element.cy() })
  }
  return new ChangeLocationAction(draw, refs, oldValues, newValues)
}
