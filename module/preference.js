'use strict'

let _visible = false

export function init_preference(draw) {
  const field_width = SVG('#field_pref_width')
  const field_height = SVG('#field_pref_height')
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
