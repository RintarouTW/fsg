'use strict'

import { componentByNo } from '../components/component.js'

///
/// Styles
///
const dashedClasses = ['dashed', 'dashed2', 'dashed3', 'dashed4']

export function removeAllDashedClass(element) {
  dashedClasses.forEach(className => element.removeClass(className))
}

export function hasDashedClass(element) {
  for (let i = 0; i < dashedClasses.length; i++)
    if (element.hasClass(dashedClasses[i])) return dashedClasses[i]
  return null
}

function doToggleSolid(element, className) {
  const dashed = hasDashedClass(element)
  removeAllDashedClass(element)
  if (dashed) {
    element.orgDash = dashed
  } else {
    if (element.orgDash) {
      element.addClass(element.orgDash)
      element.orgDash = null
    } else {
      element.addClass(className)
    }
  }
  element.fire('update') // let the inspector to know the element status is changed.
}

function doToggleClass(element, className) {
  if (element.hasClass(className))
    element.removeClass(className)
  else
    element.addClass(className)
  element.fire('update') // let the inspector to know the element status is changed.
}

function doToggleAttribute(element, attributeName) {
  if (element.attr(attributeName))
    element.attr(attributeName, null)
  else
    element.attr(attributeName, true)
  element.fire('update') // let the inspector to know the element status is changed.
}

class ToggleAction {
  constructor(draw, refs, targetName, action) {
    refs.forEach(no => {
      const component = componentByNo(draw, no)
      action(component.element, targetName)
    })
    this.state = { draw, refs, targetName, action }
  }
  undo() {
    const { draw, refs, targetName, action } = this.state
    refs.forEach(no => {
      const component = componentByNo(draw, no)
      action(component.element, targetName)
    })
  }
}

export function toggleClass({draw, refs, className}) {
  return new ToggleAction(draw, refs, className, doToggleClass)
}

export function toggleAttribute({draw, refs, attributeName}) {
  return new ToggleAction(draw, refs, attributeName, doToggleAttribute)
}

export function toggleSolid({draw, refs}) {
  const className = 'dashed'
  return new ToggleAction(draw, refs, className, doToggleSolid)
}

///
/// Change CSS Class Action
///
class ChangeClassAction {
  constructor(draw, refs, oldValues, newValue) {
    for (let i = 0; i < refs.length; i++) {
      const component = componentByNo(draw, refs[i])
      component.element.addClass(newValue).fire('update')
      SVG('#field_class').fire('change')
    }
    this.state = { draw, refs, oldValues }
  }
  undo() {
    const { draw, refs, oldValues } = this.state
    for (let i = 0; i < refs.length; i++) {
      const component = componentByNo(draw, refs[i])
      const oldValue = oldValues[i]
      component.element.attr('class', oldValue).fire('update')
      SVG('#field_class').fire('change')
    }
  }
}

export function changeClass({draw, refs, oldValues, newValue}) {
  return new ChangeClassAction(draw, refs, oldValues, newValue)
}

///
/// ChangeStyleAction
///

class ChangeStyleAction {
  constructor(draw, refs, attributeName, oldValues, newValue) {
    for (let i = 0; i < refs.length; i++) {
      const component = componentByNo(draw, refs[i])
      component.setAttribute(attributeName, newValue)
      component.element.fire('update')
      SVG('#field_' + attributeName).fire('change')
    }
    this.state = { draw, refs, attributeName, oldValues }
  }
  undo() {
    const { draw, refs, oldValues, attributeName } = this.state
    for (let i = 0; i < refs.length; i++) {
      const component = componentByNo(draw, refs[i])
      const oldValue = oldValues[i]
      component.setAttribute(attributeName, oldValue)
      component.element.fire('update')
      SVG('#field_' + attributeName).fire('change')
    }
  }
}

export function changeStyle({draw, refs, attributeName, oldValues, newValue}) {
  return new ChangeStyleAction(draw, refs, attributeName, oldValues, newValue)
}
