'use strict'

///
/// Inspector is a singleton module per builder instance.
///

import {
  TEXT_ATTR,
  DEFAULT_FILL_COLOR,
  DEFAULT_STROKE_COLOR,
  FSG_INSPECTING_ATTR,
  FSG_SELECTED_ATTR,
  FSG_STROKE_TYPE_ATTR,
} from '../common/define.js'

import { componentByNo } from '../components/component.js'
import { getSelectedComponents } from './selection.js'
import { changeStyle } from './style.js'
import { attachColorPicker } from './color_picker.js'

const fields = ['id', 'class', 'cx', 'cy', TEXT_ATTR, 'fill', 'stroke']
const non_color_fields = ['id', 'class', 'cx', 'cy', TEXT_ATTR]
const fieldDefaultValue = {
  'id' : '', 
  'class' : '',
  'cx' : '',
  'cy' : '',
  'fill' : DEFAULT_FILL_COLOR,
  'stroke' : DEFAULT_STROKE_COLOR
}
fieldDefaultValue[TEXT_ATTR] = ''

let _inspecting_element
let _isColorFieldFocused = false
let _currentColorField = SVG('#field_fill').node 
let _lastVisibleFillColor = DEFAULT_FILL_COLOR
let _lastVisibleStrokeColor = DEFAULT_STROKE_COLOR

export function lastVisibleFillColor() {
  return _lastVisibleFillColor
}

export function lastVisibleStrokeColor() {
  return _lastVisibleStrokeColor
}

export function whichColorField() {
  return _currentColorField.getAttribute('id').substr(6)
}

export function altColorPicker(fieldId) {
  const field = SVG(fieldId).node
  console.assert(field, 'field not found', fieldId)
  _currentColorField = field
  attachColorPicker(field)
}

export function editField(fieldId) {
  SVG(fieldId).node.focus()
}

function setInspecting(element) {
  return element?.attr(FSG_INSPECTING_ATTR, true)
}

function unsetInspecting(element) {
  return element?.attr(FSG_INSPECTING_ATTR, null)
}

function setSelected(element) {
  return element?.attr(FSG_SELECTED_ATTR, true)
}

function unsetSelected(element) {
  return element?.attr(FSG_SELECTED_ATTR, null)
}

function inspect_component(component) {
  if (component == null) {
    inspect_detach() 
    return
  }

  const element = component.element
  console.assert(element, 'can not inspect null element')

  // detach previous listeners
  if (_inspecting_element) {
    unsetInspecting(_inspecting_element)
      .off('update dragend', update_fields)
  }

  _inspecting_element = element

  // attach new listeners
  setInspecting(element)
  element.on('update dragend', update_fields)

  // read the values of the element
  const attributes = component.getAttributes()
  attributes.forEach(name => {
    if (name == FSG_STROKE_TYPE_ATTR) return // fsg-stroke-type has no inspector element
    const field = SVG('#field_' + name).node
    let value = component.getAttribute(name)

    if (typeof value === 'undefined')
      value = fieldDefaultValue[name]

    if (name == 'fill' || name == 'stroke') {
      if (name == 'fill' && value != 'none') _lastVisibleFillColor = value
      if (name == 'stroke' && value != 'none') _lastVisibleStrokeColor = value
      field.style.backgroundColor = value
    }

    field.value = value
    SVG(field).fire('change')
  })

}

function inspect_detach() {
  if (_inspecting_element) {
    unsetInspecting(_inspecting_element)
    _inspecting_element.off('update dragend', update_fields)
  }
  // set fields back to default values.
  non_color_fields.forEach(name => {
    const field = SVG('#field_' + name).node
    field.value = fieldDefaultValue[name]
  })
  _inspecting_element = null

  // remove colorchange event listeners
  SVG(document).off('colorpicker:change-start')
  SVG(document).off('colorpicker:change-end')
}

// in order to see original color of elements, 
// we need to make them unselected first.
function unsetAllSelected(draw) {
  const components = getSelectedComponents(draw)
  draw.selectedComponents = components.map(component => {
    const element = component.element
    unsetSelected(element)
    return component.no
  })
}

//
// after the color changes done, we should reset them back to the selected state.
//
function resetToSelected(draw) {
  draw.selectedComponents?.forEach(componentNo => {
    const component = componentByNo(draw, componentNo)
    const element = component.element
    setSelected(element)
  })
  draw.selectedComponents = null
}

export function init_module_inspector(draw) {

  // window.lastVisibleStrokeColor = lastVisibleStrokeColor
  // window.lastVisibleFillColor =  lastVisibleFillColor
  inspect_detach()

  init_fields(draw)
  SVG('#inspector').on('inspect-component', evt => {
    if(!draw.ready) return
    inspect_component(evt.detail.component)
  }).on('inspect-detach', () => {
    inspect_detach()
  })

  SVG(document).on('colorpicker:change-start', evt => {
    if(!_inspecting_element) return
    if (draw.targetComponents) return
    if (!draw.selectedComponents) unsetAllSelected(draw)

    const {field} = evt.detail
    const attributeName = field.substr(6)

    if (draw.shiftKey) {
      draw.targetComponents = draw.selectedComponents
    } else {
      draw.targetComponents = [_inspecting_element.component.no]
    }
    draw.targetComponents.forEach(componentNo => {
      const component = componentByNo(draw, componentNo)
      const element = component.element
      const orgValue = {}
      orgValue[attributeName] = component.getAttribute(attributeName)
      element.orgValue = orgValue
    })
    unsetInspecting(_inspecting_element)
  }).on('colorpicker:change-end', evt => {
    if (!_inspecting_element) return
    if (!draw.targetComponents) return // FIXME: temp workaround, somehow change-end was triggered twice. 

    const {field, newColor} = evt.detail
    const attributeName = field.substr(6)
    const newValue = {}
    newValue[attributeName] = newColor
    const refs = draw.targetComponents
    draw.fsg.history.doAction(changeStyle, {draw, refs, newValue})

    if (!_isColorFieldFocused) { // set the origianl selected components back to selected state
      resetToSelected(draw)
      setInspecting(_inspecting_element)
    }
    draw.targetComponents = null
  })
}

function checkColor(color) {
  if (/^#[a-f|0-9]{3}$/i.test(color)) {
    return color.toLowerCase()
  }
  if (/^#[a-f|0-9]{6}$/i.test(color)) {
    return color.toLowerCase()
  }
  if (/^#[a-f|0-9]{8}$/i.test(color)) {
    return color.toLowerCase()
  }
  return 'none'
}

function init_fields(draw) {

  _inspecting_element?.off('update dragend', update_fields)
  _inspecting_element = null

  fields.forEach(name => {
    const field = SVG('#field_' + name)
    console.assert(field, `#field_${name} not found`)

    field.off('input')
    field.on('input', evt => { // when user edit the field, apply to the inspecting element.

      const attributeName = evt.target.id.substr(6)

      let value = evt.target.value
      if (['fill', 'stroke'].includes(attributeName)) {
        value = checkColor(evt.target.value)
        if (value != 'none') {
          if (attributeName == 'fill') _lastVisibleFillColor = value
          else _lastVisibleStrokeColor = value
        }
      }

      try { // console.log(attribute_name, value)
        if (draw.targetComponents) {
          draw.targetComponents.forEach(componentNo => {
            const component = componentByNo(draw, componentNo)
            component.setAttribute(attributeName, value)
          })
          return
        }
        _inspecting_element?.component?.setAttribute(attributeName, value)
      } catch(err) {
        console.log(err)
      }

    }).on('keydown', evt => {
      if (evt.code == 'Enter') field.node.blur()
      draw.shiftKey = evt.shiftKey
    }).on('keyup', evt => {
      draw.shiftKey = evt.shiftKey
    })
  })

  const color_fields = SVG('#inspector').find('.field_color')
  color_fields.on('focus', evt => {
    _currentColorField = evt.target
    attachColorPicker(evt.target)
    unsetAllSelected(draw)
    unsetInspecting(_inspecting_element)
    _isColorFieldFocused = true
  }).on('blur', () => {
    resetToSelected(draw)
    setInspecting(_inspecting_element)
    _isColorFieldFocused = false
  }).on('input', evt => { // change backgroundColor once value changed
    evt.target.style.backgroundColor = evt.target.value
  })
  color_fields.forEach(field => field.node.style.backgroundColor = field.node.value)
}

function update_fields() {
  const component = _inspecting_element.component
  const attributes = component.getAttributes()
  attributes.forEach(name => {
    if (name == FSG_STROKE_TYPE_ATTR) return // fsg-stroke-type has no inspector element
    const field = SVG('#field_' + name).node
    let value = component.getAttribute(name)
    field.value = (value === '' || (typeof(value) == 'undefined')) ? null : String(value)
  })
}

