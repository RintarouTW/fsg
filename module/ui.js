'use strict'

import { addPoint } from '../components/draggable-point.js'
import { addAxis } from '../components/line-segment.js'
import { addLaTeX } from '../components/latex.js'
import { enableColorPicker } from '../module/color_picker.js'

export function init_ui_axis(draw) {
  let type = 'axis-x'
  addAxis({draw, type})
  type = 'axis-y'
  addAxis({draw, type})
}

export function buttonClass(button, action) {
  button.on('click', () => {
    action()
  })
  /*
  button.on('mouseover', () => {
    button.addClass('highlight')
  }).on('mouseleave', () => {
    button.removeClass('highlight')
    button.removeClass('button-down')
  }).on('mousedown', () => {
    button.addClass('button-down')
  }).on('mouseup', () => {
    button.removeClass('button-down')
  }).on('click', () => {
    action()
  })*/
}

export function showHint(text) {
  const hintBox = SVG('#hintBox').node
  const message = SVG('#message').node
  message.innerText = text ?? message.innerText
  hintBox.classList.remove('fadeInOut')
  setTimeout(() => {
    hintBox.classList.add('fadeInOut')
  }, 100)
}

export function opening_animation(draw, callback) {
  // open animation
  const text = String.raw`Fast\ SVG\ Geometry\ Builder`
  const unselect = true
  const element = addLaTeX({draw, text, unselect}).element
  element.attr('style', 'color: #fff;')
  element.center(0, 0).attr('opacity', 0)
  element.animate(600).dmove(0, -30).attr('opacity', 1)
    .animate(600, 700).attr('opacity', 0)
    .after(() => {
      element.remove()
      draw.ready = true
      enableColorPicker()
      // select the axises by default
      const axis_x = draw.findOne('.axis-x').component
      const axis_y = draw.findOne('.axis-y').component
      selectComponent(draw, [axis_x, axis_y])
      // add the first point
      const coord = { x: 0, y: 0 }
      addPoint({draw, coord})
      showHint()
      callback?.()
    })
}
