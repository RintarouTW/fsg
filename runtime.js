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
  init_marker(draw)
  init_history(draw)
  init_selection(draw)
  init_component(draw)
  init_drag(draw, false)
  reconstruct_components(draw)
}

function execute_script_in_file() {
  const scripts = document.querySelectorAll('script')
  scripts.forEach(script => {
    if (script.getAttribute('xmlns') == FSG_NAMESPACE) {
      eval(script.textContent)
    }
  })
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

      const draw = SVG('svg').first()
      init_modules(draw)
      draw.ready = true
      execute_script_in_file()

      // Major issue:
      // There is no way to prevent naming polution of user scripts.
      console.warn('not full supported yet, only one svg is ok.')
      //
      // support multiple svgs, find the svgs that's in fsg namespace.
      // modules should be inited for each svg.
      // draw.fsg.history
      // draw.fsg.selection
      // draw.fsg.marker
      // draw.fsg.component
      /*
      const svgs = document.querySelectorAll('svg')
      svgs.forEach(svg => {
        if (SVG(svg).attr('xmlns:fsg') == FSG_NAMESPACE) {
          const draw = SVG(svg).first()
          init_modules(draw)
        }
      })
      // locate the user script and execute it.
      */
    } else { // svg
      const draw = SVG('svg').first()
      init_modules(draw)
      draw.ready = true
      execute_script_in_file()
    }

    console.log('runtime done')
  }
}

SVG.on(document, 'DOMContentLoaded', () => init())
