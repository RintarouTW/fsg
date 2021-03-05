'use strict'

import { FSG_STROKE_TYPE_ATTR } from '../common/define.js'
import { componentByNo } from '../components/component.js'

///
/// Styles
///
let _copiedStyle

export function copyStyle(component) {
  const styleAttributes = ['fill', 'stroke', FSG_STROKE_TYPE_ATTR]
  const attributes = component.getAttributes()
  _copiedStyle = {}
  styleAttributes.forEach(style => {
    if (attributes.includes(style)) {
      let value = component.getAttribute(style)
      if (style == FSG_STROKE_TYPE_ATTR && typeof value === 'undefined') value = null
      _copiedStyle[style] = value
    }
  })
  return _copiedStyle
}

export function isStyleCopied() {
  return _copiedStyle
}

export function pasteStyle({draw, refs}) {
  if (!_copiedStyle) return 
  const attributeNames = Object.keys(_copiedStyle)
  refs.forEach(no => {
    const component = componentByNo(draw, no)
    attributeNames.forEach(attributeName => {
      component.setAttribute(attributeName, _copiedStyle[attributeName])
    })
  })
}

function doToggleAttribute(element, attributeName) {
  const value = element.attr(attributeName) ? null : true
  element.attr(attributeName, value).fire('update')
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

export function toggleAttribute({draw, refs, attributeName}) {
  return new ToggleAction(draw, refs, attributeName, doToggleAttribute)
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
    const orgValue = component.element.orgValue
    attributeNames.forEach(attributeName => {
      const oldValue = {}
      if (orgValue)
        oldValue[attributeName] = orgValue[attributeName]
      else
        oldValue[attributeName] = component.getAttribute(attributeName)
      oldValues.push(oldValue)
    })
    component.element.orgValue = null
  })
  return new ChangeAttributesAction(draw, refs, attributeNames, oldValues, newValue)
}
