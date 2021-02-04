'use strict'

import { init_component } from './components/component.js'
import { init_marker } from './module/marker.js'
import { init_drag } from './module/drag.js'
import { init_history } from './module/history.js'
import { init_selection } from './module/selection.js'
import { reconstruct_components } from './module/file.js'
import { fetchSrc } from './common/common.js'

function init_modules(draw) {
  draw.fsg = {}
  init_marker(draw)
  init_history(draw)
  init_selection(draw)
  init_component(draw)
  init_drag(draw, false)
  reconstruct_components(draw)
}

function init() {
  // runtime for html/svg, different envs.
  // html -> exported html
  // svg -> saved svg
  if (window.FSG_BUILDER) {
    // run under editor? this should not happen.
    console.error('runtime should not be run under builder')

  } else {

    if (window.FSG_RUNTIME) return

    window.FSG_RUNTIME = true // runtime should only be loaded once.

    const contentType = document.contentType
    if (contentType.includes('html')) { // html goes here.

      const fsgs = SVG.find('fsg')
      fsgs.forEach(fsg => {
        const url = fsg.attr('src')
        fetchSrc(url).then(content => {
          if (!content) return
          const svg = SVG(content)
          const draw = svg.first()
          draw._content = svg.svg()
          init_modules(draw)
          draw.ready = true
          fsg.add(svg)
        })
      })

    } else { // svg
      const svg = SVG('svg')
      const draw = svg.first()
      draw._content = svg.svg() // remember the original content
      init_modules(draw)
      draw.ready = true
    }

    console.log('runtime done')
  }
}

SVG.on(document, 'DOMContentLoaded', () => init())
