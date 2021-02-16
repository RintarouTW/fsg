'use strict'

function getStyle(id, key = 'stroke') {
  const element = SVG(id)
  console.assert(element)
  return element.node.computedStyleMap().get(key).toString()
}

// ex: setStyle('#c1', 'fill', '#ccc')
function setStyle(id, key, value) {
  if (typeof value === 'undefined') value = null
  const element = SVG(id); console.assert(element)
  element.attr(key, value)
}

export function getStrokeColor(id) {
  const element = SVG(id)
  console.assert(element, `element with ${id} must exist`)
  return getStyle(id, 'stroke')
}

export function setStrokeColor(id, color) {
  const element = SVG(id)
  console.assert(element, `element with ${id} must exist`)
  setStyle(id, 'stroke', color)
}

export function getStrokeWidth(id) {
  const element = SVG(id)
  console.assert(element, `element with ${id} must exist`)
  return getStyle(id, 'stroke-width')
}

export function setStrokeWidth(id) {
  const element = SVG(id)
  console.assert(element, `element with ${id} must exist`)
  setStyle(id, 'stroke-width', color)
}

export function getFillColor(id) {
  const element = SVG(id)
  console.assert(element, `element with ${id} must exist`)
  return getStyle(id, 'fill')
}

export function setFillColor(id, color) {
  const element = SVG(id)
  console.assert(element, `element with ${id} must exist`)
  setStyle(id, 'color', color)
}

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
/// ChangeAttributeAction
///

class ChangeAction {
  constructor(components, attributeName, oldValue, newValue) {
    components.forEach(component => {
      component.setAttribute(attributeName, newValue)
      component.element.fire('update')
      SVG('#field_' + attributeName).fire('change')
    })
    this.components = components
    this.attributeName = attributeName
    this.oldValue = oldValue
    this.newValue = newValue
  }
  undo() {
    this.components.forEach(component => {
      component.setAttribute(this.attributeName, this.oldValue)
      component.element.fire('update')
      SVG('#field_' + this.attributeName).fire('change')
    })
  }
}

export function changeStyle({components, attributeName, oldValue, newValue}) {
  return new ChangeAction(components, attributeName, oldValue, newValue)
}
