'use strict'

import { componentByNo } from '../components/component.js'

let _copiedStyle

export function copyStyle(component) {
  _copiedStyle = {
    stroke : component.getAttribute('stroke'),
    fill : component.getAttribute('fill'),
    dashed : hasDashedClass(component.element)
  }
  return _copiedStyle
}

export function isCopiedStyle() {
  return _copiedStyle
}

export function pasteStyle({draw, refs}) {
  if (!_copiedStyle) return 
  refs.forEach(no => {
    const component = componentByNo(draw, no)
    if (_copiedStyle.stroke) 
      component.setAttribute('stroke', _copiedStyle.stroke)
    if (_copiedStyle.fill) 
      component.setAttribute('fill', _copiedStyle.fill)
    // if (_copiedStyle.dashed) 
      // component.setAttribute('fill', _copiedStyle.fill)
  })
}

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
    }
    this.state = { draw, refs, oldValues }
  }
  undo() {
    const { draw, refs, oldValues } = this.state
    for (let i = 0; i < refs.length; i++) {
      const component = componentByNo(draw, refs[i])
      const oldValue = oldValues[i]
      component.element.attr('class', oldValue).fire('update')
    }
  }
}

export function changeClass({draw, refs, oldValues, newValue}) {
  return new ChangeClassAction(draw, refs, oldValues, newValue)
}

///
/// ChangeAttributesAction
///

class ChangeAttributesAction{
  constructor(draw, refs, attributeNames, oldValues, newValue) {
    for (let i = 0; i < refs.length; i++) {
      const component = componentByNo(draw, refs[i])
      attributeNames.forEach(attributeName => {
        component.setAttribute(attributeName, newValue[attributeName])
      })
      component.element.fire('update')
    }
    this.state = { draw, refs, attributeNames, oldValues }
  }
  undo() {
    const { draw, refs, oldValues, attributeNames } = this.state
    for (let i = 0; i < refs.length; i++) {
      const component = componentByNo(draw, refs[i])
      const oldValue = oldValues[i]
      attributeNames.forEach(attributeName => {
        component.setAttribute(attributeName, oldValue[attributeName])
      })
      component.element.fire('update')
    }
  }
}

export function changeStyle({draw, refs, newValue}) {
  console.assert(newValue, 'newValue must be defined')
  const oldValues = []
  const attributeNames = Object.keys(newValue)
  refs.forEach(no => {
    const component = componentByNo(draw, no)
    attributeNames.forEach(attributeName => {
      const oldValue = {}
      oldValue[attributeName] = component.getAttribute(attributeName)
      oldValues.push(oldValue)
    })
  })
  return new ChangeAttributesAction(draw, refs, attributeNames, oldValues, newValue)
}
