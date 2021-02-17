'use strict'

/*
 * editor is the singleton instance per page.
 */

import {
  RUNTIME_DEFAULT_STYLE,
} from './common/define.js'

import { init_module_selection } from './module/selection.js'
import { init_module_marker } from './module/marker.js'
import { init_component_system, deinit_component_system } from './components/component.js'
import { reconstruct_components, saveAsSVG } from './module/file.js'
import { init_module_script } from './module/script.js'
import './lib/svg.panzoom.js'

let _draw = null
let _content = null

function cleanUp() {
  if (_draw) deinit_component_system(_draw)
  // clear edit areas
  SVG('#editArea').clear()
  _draw = null
  _content = null
}

function loadAsSVG(content) {
  let svg
  // deal with corrupted content.
  try {
    svg = SVG(content)
  } catch(err) {
    console.log(err)
    alert(err)
    return null
  }
  if (!svg || svg.type !== 'svg') {
    alert('not correct svg file')
    return null
  }
  return svg
}

// exported only for tests
export function loadFSG(content) {

  const svg = loadAsSVG(content)
  if (!svg) return

  cleanUp()

  _content = content

  svg.addTo('#editArea') // use content's viewbox
    .panZoom({zoomMin: 1, zoomMax: 3})

  const draw = svg.first()
  draw.fsg = {} // create fsg context for modules
  draw.fsg.filename = 'fsg.svg'

  init_module_marker(draw)

  //
  // Fix the old fsg files which doesn't have default style.
  //
  const defs = draw.defs()
  // remove the old style, force to use new default anyway.
  const defaultStyle = defs.find('style')
  if (defaultStyle) defaultStyle.remove()
  // if(defs.find('style').length == 0) {
  defs.first().before(SVG(RUNTIME_DEFAULT_STYLE))
  // }

  init_module_script(draw)
  init_module_selection(draw)

  init_component_system(draw)
  reconstruct_components(draw)
  draw.ready = true
  return draw
}

function convertFile(file) {
  console.log(file.name)
  file.text().then(content => {
    _draw = loadFSG(content)
    _draw.fsg.filename = file.name
    saveAsSVG(_draw)
  }).then(() => {
    setTimeout(convertOneFileAtATime, 200)
  })
}

let _files = []

function convertOneFileAtATime() {
  if (_files.length == 0) return
  const file = _files.shift()
  if (file.type == 'image/svg+xml')
    convertFile(file)
  else
    convertOneFileAtATime()
}

function init() {
  SVG('#dropArea').on(['drag', 'dragstart', 'dragend', 'dragover', 'dragenter', 'dragleave'], evt => {
    evt.preventDefault()
    evt.stopPropagation()
  }).on('drop', evt => {
    evt.dataTransfer.files.forEach(file => {
      _files.push(file)
    })
    evt.preventDefault()
    evt.stopPropagation()
    convertOneFileAtATime()
  })
}

SVG.on(document, 'DOMContentLoaded', () => init())
