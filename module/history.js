'use strict'

export function init_history(draw) {
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
  action.redo()
  // console.log('redo redo_list = ', redo_list)
}

export function doAction(draw, cmd, args) {
  const history = draw.fsg.history
  const action = cmd(args)
  action.redo = () => {
    if(action.component_no) args.component_no = action.component_no
    doAction(draw, cmd, args)
  }
  history.history.push(action)
  // console.log('history =', history)
}

