'use strict'

import { componentByNo } from '../components/component.js'

///
/// Styles
///

function doToggleClass(element, className) {
  if (element.hasClass(className)) element.removeClass(className)
  else element.addClass(className)
  element.fire('update') // let the inspector to know the element status is changed.
}

function doToggleAttribute(element, attributeName) {
  if (element.attr(attributeName)) element.attr(attributeName, null)
  else element.attr(attributeName, true)
  element.fire('update') // let the inspector to know the element status is changed.
}

class ToggleAction {
  constructor(components, targetName, action) {
    components.forEach(item => action(item.element, targetName))
    this.components = components
    this.targetName = targetName
    this.action = action
  }
  undo() {
    this.components.forEach(item => this.action(item.element, this.targetName))
  }
}

export function toggleClass({components, className}) {
  return new ToggleAction(components, className, doToggleClass)
}

export function toggleAttribute({components, attributeName}) {
  return new ToggleAction(components, attributeName, doToggleAttribute)
}

///
/// ChangeStyleAction
///

class ChangeStyleAction {
  constructor(draw, components, attributeName, oldValues, newValues) {
    for (let i = 0; i < components.length; i++) {
      const component = componentByNo(draw, components[i])
      const newValue = newValues[i]
      component.setAttribute(attributeName, newValue)
      component.element.fire('update')
      SVG('#field_' + attributeName).fire('change')
    }
    this.draw = draw
    this.components = components
    this.attributeName = attributeName
    this.oldValues = oldValues
    this.newValues = newValues
  }
  undo() {
    const components = this.components
    const oldValues = this.oldValues
    const attributeName = this.attributeName
    for (let i = 0; i < components.length; i++) {
      const component = componentByNo(this.draw, components[i])
      const oldValue = oldValues[i]
      component.setAttribute(attributeName, oldValue)
      component.element.fire('update')
      SVG('#field_' + attributeName).fire('change')
    }
  }
}

export function changeStyle({draw, components, attributeName, oldValues, newValues}) {
  return new ChangeStyleAction(draw, components, attributeName, oldValues, newValues)
}
