'use strict'

import { htmlForPlayer } from './file.js'

export function init_module_player() {

  const playerWindow = SVG('#playerWindow')
  const playerViewbox = SVG('#playerViewbox')
  const playerCloseButton = SVG('#playerCloseButton')

  playerCloseButton.on('click', () => {
    playerViewbox.node.innerHTML = ''
    playerWindow.addClass('hidden')
  })
}

export function playInBuilder(draw) {

  const { width, height } = draw.parent().viewbox()
  const iframe = document.createElement('iframe')
  iframe.width = width + 8
  iframe.height = height + 20 
  iframe.setAttribute('autoplay', true)
  iframe.srcdoc = htmlForPlayer(draw)

  const playerViewbox = SVG('#playerViewbox')
  playerViewbox.node.appendChild(iframe)
  SVG('#playerWindow').removeClass('hidden')
}
