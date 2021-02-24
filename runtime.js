'use strict'

import { SERVER_ROOT } from './common/define.js'
import { fetchSrc } from './common/common.js'
import { init_component_system } from './components/component.js'
import { init_module_marker } from './module/marker.js'
import { init_module_drag } from './module/drag.js'
import { init_module_history } from './module/history.js'
import { init_module_selection } from './module/selection.js'
import { reconstruct_components } from './module/file.js'
import { contain_user_script, execute_user_script } from './module/script.js'

function init_modules(draw) {
  draw.fsg = {}
  init_module_marker(draw)
  init_module_history(draw)
  init_module_selection(draw)
  init_component_system(draw)
  init_module_drag(draw, false)
  reconstruct_components(draw)
}

function UILayer(draw) {
  let ui = draw.parent().findOne('#FSG_UI_LAYER')
  if (!ui) ui = draw.parent().group().attr('id', 'FSG_UI_LAYER')
  return ui
}

function drawTitle(draw, title) {
  const ui = UILayer(draw)
  const text = ui.text(title)
    .attr('class', 'title')
    .attr('offset_x', 0)
    .attr('offset_y', 0)
  const { width, height } = ui.parent().viewbox()
  const tw = text.bbox().width
  const position = {x: (width - tw)/2, y: height - 30}
  text.move(position.x, position.y)
  ui.add(text)

  const bbox = text.bbox()
  const bg = ui.rect(bbox.width + 30, bbox.height + 8)
    .radius(10, 15)
    .attr('fill', '#000')
    .attr('stroke', '#888')
    .center(text.cx(), text.cy())
  bg.insertBefore(text)
}

function showPlayButton(draw) {
  // inject filter for the hover effect.
  let filter = draw.parent().defs().findOne('#FSG_HOVER_FILTER')
  if (!filter) {
    filter = SVG(String.raw`<filter id="FSG_HOVER_FILTER" x="-20%" y="-20%" width="140%" height="140%" filterUnits="objectBoundingBox" primitiveUnits="userSpaceOnUse" color-interpolation-filters="linearRGB">
  <feBlend mode="screen" x="0%" y="0%" width="100%" height="100%" in="SourceGraphic" in2="SourceGraphic" result="blend1"/>
</filter>`)
    draw.parent().defs().add(filter)
  }

  const ui = UILayer(draw)
  const runButton = ui.image(`${SERVER_ROOT}/images/run.svg`).size(34, 34)
  // embeding svg would change draw.defs(), maybe the bug of SVGJS. don't use it so far.
  // use image filter instead.
  const { width } = draw.parent().viewbox()
  runButton.move(width - 44, 10)
    .on('click', () => execute_user_script(draw) )
    .on('mouseover', () => runButton.attr('filter', 'url(#FSG_HOVER_FILTER)') )
    .on('mouseleave', () => runButton.attr('filter', null) )
}

function init() {
  // runtime for html/svg, different envs.
  // html -> exported html
  // svg -> saved svg
  if (window.FSG_BUILDER) {
    console.error('runtime should not be run under builder')
    return
  }

  if (window.FSG_RUNTIME) return // already loaded

  window.FSG_RUNTIME = true // runtime should only be loaded once.

  // extend SVG.Element to support anime()
  SVG.extend(SVG.Element, {
    anime: function(...args) {
      return this.animate(args).during( () => this.fire('update') )
    }
  })
  // extend SVG.Runner
  SVG.extend(SVG.Runner, {
    update: function() {
      return this.during( () => this.element().fire('update') )
    }
  })

  if (document.contentType.includes('html')) { // loaded by html
    // search for custom tag <fsg>
    SVG.find('fsg')?.forEach(fsg => {
      const src = fsg.attr('src')
      fetchSrc(src).then(content => {
        if (!content) return
        const svg = SVG(content)
        const draw = svg.first()
        draw._content = svg.svg()
        init_modules(draw)
        draw.fsg.filename = src.split('/').pop()
        draw.ready = true
        fsg.add(svg)
        const title = fsg.attr('title')
        if (title) drawTitle(draw, title)
        if (contain_user_script(draw)) showPlayButton(draw)
      })
    })
    return
  }
  // loaded by standalone svg
  const svg = SVG('svg')
  const draw = svg.first()
  draw._content = svg.svg() // remember the original content
  init_modules(draw)
  draw.fsg.filename = window.location.pathname.split('/').pop()
  draw.ready = true
  // get title specified by the user in iframe
  const title = window.frameElement?.getAttribute('title')
  if (title) drawTitle(draw, title)
  if (contain_user_script(draw)) showPlayButton(draw)
  // console.log('runtime done')
}

SVG.on(document, 'DOMContentLoaded', () => init())
