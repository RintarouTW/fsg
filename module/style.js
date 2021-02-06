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

function toggleCSS(element, className) {
  if (element.hasClass(className)) element.removeClass(className)
  else element.addClass(className)
  element.fire('update') // let the inspector to know the element status is changed.
}

class ToggleAction {
  constructor(components, className) {
    components.forEach(item => toggleCSS(item.element, className))
    this.components = components
    this.className = className
  }
  undo() {
    this.components.forEach(item => toggleCSS(item.element, this.className))
  }
}

export function toggleClass({components, className}) {
  return new ToggleAction(components, className)
}

