'use strict'

import { FSG_NAMESPACE } from './common/define.js'
import { init_component } from './components/component.js'
import { init_marker } from './module/marker.js'
import { init_drag } from './module/drag.js'
import { init_history } from './module/history.js'
import { init_selection } from './module/selection.js'
import { reconstruct_components } from './module/file.js'

function init_modules(draw) {
  draw.fsg = {}
  init_history(draw)
  init_selection(draw)
  init_marker(draw)
  init_component(draw)
  init_drag(draw, false)
  reconstruct_components(draw)
}

function init() {
  // runtime for html/svg, different envs.
  // html -> exported html
  // svg -> saved svg
  if (window.FSG) {
    // run under editor? this should not happen.
    console.log('runtime should not be run under editor')

  } else {

    if (window.FSG_RUNTIME) return

    window.FSG_RUNTIME = true // runtime should only be loaded once.

    function execute_script_in_file() {
      const scripts = document.querySelectorAll('script')
      scripts.forEach(script => {
        if (script.getAttribute('xmlns') == FSG_NAMESPACE) {
          eval(script.textContent)
        }
      })
    }

    const contentType = document.contentType
    if (contentType.includes('html')) { // html goes here.

      // support multiple svgs, find the svgs that's in fsg namespace.
      // modules should be inited for each svg.
      // draw.fsg.history
      // draw.fsg.selection
      // draw.fsg.marker
      // draw.fsg.component
       const svgs = document.querySelectorAll('svg')
      let fsgs = []
      svgs.forEach(svg => {
        if (SVG(svg).attr('xmlns:fsg') == FSG_NAMESPACE)
          fsgs.push(svg)
      })

      svgs.forEach(svg => {
        const draw = SVG(svg).first()
        init_modules(draw)
      })
     // locate the user script and execute it.

    } else { // svg
      const draw = SVG('svg').first()
      init_modules(draw)
      draw.ready = true
      execute_script_in_file()
    }
  }
}

SVG.on(document, 'DOMContentLoaded', () => init())
