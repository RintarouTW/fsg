'use strict'

import {
  DEFAULT_FILL_COLOR,
  DEFAULT_STROKE_COLOR,
  DEFAULT_TRANSPARENT_COLOR,
} from '../common/define.js'

///
/// ColorPicker is always attached to one of the input fields now.
///
let _enabled = false
let _hexInput
let _colorPicker
let _colorBeforeChange

export function enableColorPicker() {
  _enabled = true
  attachColorPicker(SVG('#field_fill').node) // default attach to fill field
}

// init color picker for editor env only.
export function init_module_color_picker() {
  // Create a new color picker instance
  // https://iro.js.org/guide.html#getting-started
  _colorPicker= new iro.ColorPicker("#colorPicker", {
    // color picker options
    // Option guide: https://iro.js.org/guide.html#color-picker-options
    width: 120,
    color: "#8a0238ff",
    borderWidth: 1,
    borderColor: "#fff",
    layoutDirection: 'horizontal',
    layout: [
      {
        component: iro.ui.Wheel,
      },
      {       
        component: iro.ui.Slider,
        options: {
          // can also be 'saturation', 'value', 'red', 'green', 'blue', 'alpha' or 'kelvin'
          sliderType: 'value'
        }
      },
      {       
        component: iro.ui.Slider,
        options: {
          // can also be 'saturation', 'value', 'red', 'green', 'blue', 'alpha' or 'kelvin'
          sliderType: 'alpha'
        }
      }
    ]
  })

  SVG('#field_fill').node.value = DEFAULT_FILL_COLOR
  SVG('#field_stroke').node.value = DEFAULT_STROKE_COLOR

  _enabled = false // disabled until enableColorPicker()
}

function toHex8String(color) {
  if (/^#[a-f|0-9]{3}$/i.test(color)) {
    let str = '#' + color[1] + color[1] + color[2] + color[2] + color[3] + color[3] + 'ff'
    return str.toLowerCase()
  }
  if (/^#[a-f|0-9]{6}$/i.test(color)) {
    return color.toLowerCase() + 'ff'
  }
  if (/^#[a-f|0-9]{8}$/i.test(color)) {
    return color.toLowerCase()
  }
  if (/^none$/i.test(color)) {
    return DEFAULT_TRANSPARENT_COLOR
  }
  return null
}

function onInputChange() {
  const color = toHex8String(_hexInput.value)
  if (!color) return // prevent illegal color inputs
  _enabled = false
  _colorPicker.color.hex8String = color
  _enabled = true 
}

function onColorChange(color) {
  // Show the current color in different formats
  // Using the selected color: https://iro.js.org/guide.html#selected-color-api
  console.assert(_hexInput, 'hexInput must be attached first')
  if (!_enabled) return
  _hexInput.value = color.hex8String
  SVG(_hexInput).fire('input')
}

export function attachColorPicker(hexInput) {
  if (!_colorPicker) return
  if (!_enabled) return

  // console.assert(hexInput, 'hexInput must exist')

  _hexInput = hexInput ?? _hexInput
  _hexInput.addEventListener('change', onInputChange)

  if (_hexInput.getAttribute('id') == 'field_fill')
    document.querySelector('#colorIndicator').style.right = '180px';
  else
    document.querySelector('#colorIndicator').style.right = '260px';

  onInputChange() // show the attached input field color

  _colorPicker.on("color:change", onColorChange)
  _colorPicker.on("input:start", () => {
    _colorBeforeChange = _hexInput.value
    const colorChangeInfo = {
      field: _hexInput.getAttribute('id')
    }
    document.dispatchEvent(new CustomEvent('colorpicker:change-start', { detail: colorChangeInfo }))
  })
  _colorPicker.on("input:end", () => {
    const colorChangeInfo = {
      field: _hexInput.getAttribute('id'),
      oldValue: _colorBeforeChange,
      newValue: _hexInput.value
    }
    document.dispatchEvent(new CustomEvent('colorpicker:change-end', { detail: colorChangeInfo }))
  })

}

export function currentFillColor() {
  return SVG('#field_fill').node.value
}

export function currentStrokeColor() {
  return SVG('#field_stroke').node.value
}

export function useCurrentColors(element) {
  if (window.FSG_BUILDER) { // run in editor
    const fillColor = currentFillColor()
    const strokeColor = currentStrokeColor()
    element.attr('fill', fillColor)
    element.attr('stroke', strokeColor)
  }
}

export function setStrokeColor(element) {
  if (window.FSG_BUILDER) {
    const strokeColor = currentStrokeColor()
    element.attr('stroke', strokeColor)
  }
}

