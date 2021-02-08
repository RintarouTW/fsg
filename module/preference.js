'use strict'

let _visible = false

export function init_preference(draw) {
  const svg = draw.parent()
  const field_width = SVG('#field_pref_width')
  field_width.node.value = svg.attr('width')
  field_width.on('input', () => {
    const value = Number(field_width.node.value)
    if (typeof value === 'NaN') return
    const svg = draw.parent()
    svg.attr('width', value)
  })
  const field_height = SVG('#field_pref_height')
  field_height.node.value = svg.attr('height')
  field_height.on('input', () => {
    const value = Number(field_height.node.value)
    if (typeof value === 'NaN') return
    const svg = draw.parent()
    svg.attr('height', value)
  })
  const field_background = SVG('#field_pref_background')
  const close_button = SVG('#pref_close_button')
  close_button.on('click', () => hide())
}

function show() {
  SVG('#preferenceWindow').attr('style', 'visibility: visible;')
  _visible = true
}

function hide() {
  SVG('#preferenceWindow').attr('style', 'visibility: hidden;')
  _visible = false
}

export function toggle_preference_window() {
  (_visible) ? hide() : show()
}
