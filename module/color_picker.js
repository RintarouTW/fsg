'use strict'

import { DEFAULT_FILL_COLOR, DEFAULT_STROKE_COLOR } from '../common/define.js'

///
/// ColorPicker is always attached to one of the input fields now.
///
let _enabled = false
let _hexInput
let _colorPicker

export function enableColorPicker() {
  _enabled = true
  attachColorPicker(SVG('#field_fill').node) // default attach to fill field
}

// init color picker for editor env only.
export function init_color_picker() {
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

  _enabled = false // enable until enableColorPicker()
}

function onInputChange() {
  // console.log('user input changed')
  _colorPicker.color.hex8String = _hexInput.value;
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
  // console.log('attach to ', hexInput)

  _hexInput = hexInput ?? _hexInput
  _hexInput.addEventListener('change', onInputChange)

  if (_hexInput.getAttribute('id') == 'field_fill')
    document.querySelector('#colorIndicator').style.right = '180px';
  else
    document.querySelector('#colorIndicator').style.right = '260px';


  _colorPicker.color.hex8String = _hexInput.value
  // console.log(_colorPicker.color.hex8String, _hexInput.value)

  // _colorPicker.on(["color:init", "color:change"], onColorChange)
  _colorPicker.on("color:change", onColorChange)
  _colorPicker.on("input:start", () => {
    document.dispatchEvent(new CustomEvent('colorpicker:change-start'))
  })
  _colorPicker.on("input:end", () => {
    document.dispatchEvent(new CustomEvent('colorpicker:change-end'))
  })

}

export function currentFillColor() {
  return SVG('#field_fill').node.value
}

export function currentStrokeColor() {
  return SVG('#field_stroke').node.value
}
