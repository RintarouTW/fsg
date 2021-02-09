'use strict'

import { init_component } from './components/component.js'
import { init_marker } from './module/marker.js'
import { init_drag } from './module/drag.js'
import { init_history } from './module/history.js'
import { init_selection } from './module/selection.js'
import { reconstruct_components } from './module/file.js'
import { contain_user_script, execute_user_script } from './module/user_script.js'
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

function drawTitle(draw, title) {
  const text = draw.text(title)
    .attr('class', 'title')
    .attr('offset_x', 0)
    .attr('offset_y', 0)
    .flip('y')
  const { height } = draw.parent().viewbox()
  const tw = text.bbox().width
  const position = {x: -tw/2, y: height/2 - 30}
  // console.log(position, text.bbox())
  text.move(position.x, position.y)
  draw.add(text)
}

function showPlayButton(draw) {
  const runButton = SVG('<path d="M1 33V1L31 17L1 33Z" fill="#919191" stroke="black"/>')
  const { width, height } = draw.parent().viewbox()
  runButton.move(width/2 - 44, height/2 - 44)
    .on('click', () => execute_user_script(draw) )
    .on('mouseover', () => runButton.attr('fill', '#fff') )
    .on('mouseleave', () => runButton.attr('fill', '#919191') )
  draw.add(runButton)
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

    // extend SVG.Runner
    SVG.extend(SVG.Runner, {
      update: function() {
        this.during( () => this.element().fire('update') )
      }
    })

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
          const title = fsg.attr('title')
          if (title) drawTitle(draw, title)
          if (contain_user_script(draw)) showPlayButton(draw)
        })
      })

    } else { // svg
      const svg = SVG('svg')
      const draw = svg.first()
      draw._content = svg.svg() // remember the original content
      init_modules(draw)
      draw.ready = true
      // get title specified by the user in iframe
      const title = window.frameElement.getAttribute('title')
      if (title) drawTitle(draw, title)
      if (contain_user_script(draw)) showPlayButton(draw)
    }

    console.log('runtime done')
  }
}

SVG.on(document, 'DOMContentLoaded', () => init())
