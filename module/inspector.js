'use strict'

/*
 * singleton per editor instance.
 */

import { DEFAULT_FILL_COLOR, DEFAULT_STROKE_COLOR, FSG_INSPECTING_ATTR, FSG_SELECTED_ATTR } from '../common/define.js'
import { attachColorPicker } from './color_picker.js'

const fields = ['id', 'class', 'cx', 'cy', 'text', 'fill', 'stroke']
const non_color_fields = ['id', 'class', 'cx', 'cy', 'text']
const fieldDefaultValue = {
  'id' : '', 
  'class' : '',
  'cx' : '',
  'cy' : '',
  'text' : '',
  'fill' : DEFAULT_FILL_COLOR,
  'stroke' : DEFAULT_STROKE_COLOR
}

export function editField(fieldId) {
  let element = SVG(fieldId)
  element.node.focus()
}

let _inspecting_element

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
    // _inspecting_element.removeClass('inspecting')
    unsetInspecting(_inspecting_element)
      .off('update', update_fields)
      .off('dragend', update_fields)
  }
  _inspecting_element = element
  // attach new listeners
  if (element) {
    // element.addClass('inspecting')
    setInspecting(_inspecting_element)
    element.on('update', update_fields)
      .on('dragend', update_fields)
  }

  // read the values of the element
  const attributes = component.getAttributes()
  // console.log(element, attributes)
  attributes.forEach(name => {
    const field = SVG('#field_' + name).node
    let  value = component.getAttribute(name)

    if (typeof value === 'undefined')
      value = fieldDefaultValue[name]

    if (name == 'fill' || name == 'stroke') {
      /// use component.getAttribute() now, don't access element attributes directly anymore.
      // value = element.attr(name)
      // if (value === null)
      // value = fieldDefaultValue[name]
      field.style.backgroundColor = value
      field.value = value
      SVG(field).fire('change')
    } else {
      field.value = value
    }
  })

  update_fields()
}

function inspect_detach() {
  if (_inspecting_element) {
    // _inspecting_element.removeClass('inspecting')
    unsetInspecting(_inspecting_element)
    _inspecting_element.off('update', update_fields)
    _inspecting_element.off('dragend', update_fields)
  }
  // set fields back to default values.
  non_color_fields.forEach(name => {
    const field = SVG('#field_' + name).node
    field.value = fieldDefaultValue[name]
  })
  _inspecting_element = null
}

export function init_module_inspector(draw) {
  init_fields()
  SVG('#inspector').on('inspect-component', evt => {
    if(!draw.ready) return
    // console.log('inspect-component')
    inspect_component(evt.detail.component)
  }).on('inspect-detach', () => {
    inspect_detach()
  })
  document.addEventListener('colorpicker:change-start', () => {
    // _inspecting_element?.removeClass('inspecting').removeClass('selected')
    unsetInspecting(_inspecting_element)
    unsetSelected(_inspecting_element)
  })
  document.addEventListener('colorpicker:change-end', () => {
    // _inspecting_element?.addClass('selected').addClass('inspecting')
    setSelected(_inspecting_element)
    setInspecting(_inspecting_element)
  })
}

function init_fields() {

  _inspecting_element?.off('update', update_fields)
    .off('dragend', update_fields)
  _inspecting_element = null

  fields.forEach(name => {
    const field = SVG('#field_' + name)
    if (!field) return

    field.on('input', evt => {
      const attribute_name = evt.target.id.substr(6)
      let value = evt.target.value
      if (value == '') value = null

      try {
        // console.log(attribute_name, value)
        _inspecting_element?.component?.setAttribute(attribute_name, value)
      } catch(err) {
        console.log(err)
      }
    }).on('keydown', evt => {
      if (evt.code == 'Enter') field.node.blur()
    })
  })

  const color_fields = SVG('#inspector').find('.field_color')
  color_fields.on('focus', evt => {
    attachColorPicker(evt.target)
    // _inspecting_element?.removeClass('inspecting').removeClass('selected')
    unsetInspecting(_inspecting_element)
    unsetSelected(_inspecting_element)
  }).on('blur', () => {
    // _inspecting_element?.addClass('selected').addClass('inspecting')
    setSelected(_inspecting_element)
    setInspecting(_inspecting_element)
  }).on('input', evt => { // change backgroundColor once value changed
    evt.target.style.backgroundColor = evt.target.value
  })
  color_fields.forEach(field => field.node.style.backgroundColor = field.node.value)
}

function update_fields() {
  // console.log('update_fields')
  const component = _inspecting_element.component
  const attributes = component.getAttributes()
  attributes.forEach(name => {
    const field = SVG('#field_' + name).node
    let value = component.getAttribute(name)
    if (value === '' || (typeof(value) == 'undefined')) {
      value = null
      field.value = value
    } else {
      field.value = String(value)
    }
  })
}


