'use strict'

/*
 * editor is the singleton instance per page.
 */

import {
  DEFAULT_TRANSPARENT_COLOR,
  CLASS_FSG_BOARD,
  DEFAULT_BOARD_RADIUS,
  DEFAULT_WINDOW_WIDTH,
  DEFAULT_WINDOW_HEIGHT,
  RUNTIME_DEFAULT_STYLE,
  RUNTIME_STYLE_LINK
} from './common/define.js'
import { wait } from "./common/common.js"

import { init_history } from './module/history.js'
import { init_selection } from './module/selection.js'
import { init_keybindings } from './module/keybinding.js'

import { init_drag } from './module/drag.js'
import { init_inspector } from './module/inspector.js'
import { init_axis, buttonClass, opening_animation, showHint } from './module/ui.js'
import { init_color_picker, enableColorPicker } from './module/color_picker.js'
import { init_code_editor } from './module/code_editor.js'

import { init_marker } from './module/marker.js'
// import { init_filter } from './module/filter.js' // not used yet
import { init_component, deinit_allcomponents } from './components/component.js'
import { reconstruct_components, saveAsSVG } from './module/file.js'
import { execute_user_script, init_scripts } from './module/user_script.js'
import { getCode } from './module/server.js'
import './lib/svg.panzoom.js'

let _draw = null
let _content = null

function openFile(file) {
  if(!file) return
  const reader = new FileReader();
  reader.addEventListener("load", function () {
    _draw = loadFSG(reader.result)
    if (_draw) _draw.fsg.filename = file.name
  }, false);
  reader.readAsText(file);
}

function cleanUp() {
  if (_draw) deinit_allcomponents(_draw)
  // clear edit areas
  SVG('#editArea').clear()
  _draw = null
  _content = null
}

export function newFSG() {

  cleanUp()

  const svg = SVG()

  // init edit area
  const clientWidth = document.body.clientWidth
  const viewbox = { width: clientWidth, height: clientWidth * 0.75 }
  svg.addTo('#editArea')
    .size(viewbox.width, viewbox.height)
    .viewbox(0, 0, viewbox.width, viewbox.height)
    .panZoom({zoomMin: 1, zoomMax: 3})

  const draw = svg.group().flip('y').translate(viewbox.width/2, viewbox.height/2)
  draw.fsg = {} // create fsg context for modules
  draw.fsg.filename = 'fsg.svg'

  init_marker(draw)
  // put the style before scripts
  draw.defs().add(SVG(RUNTIME_DEFAULT_STYLE))
  draw.defs().add(SVG(RUNTIME_STYLE_LINK))
  const userScript = init_scripts(draw)

  // creat board as background
  draw.rect(viewbox.width, viewbox.height)
    .attr('class', CLASS_FSG_BOARD)
    .attr('fill', DEFAULT_TRANSPARENT_COLOR) // fill with transparent color
    .radius(DEFAULT_BOARD_RADIUS)
    .move(-viewbox.width/2, -viewbox.height/2)
  init_history(draw)
  init_selection(draw)
  init_component(draw)
  init_drag(draw)

  init_inspector(draw)
  init_keybindings(draw)
  init_axis(draw)

  init_code_editor(userScript)
  return draw
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

  init_marker(draw)

  //
  // Fix the old fsg files which doesn't have default style.
  //
  const defs = draw.defs()
  if(defs.find('style').length == 0) {
    defs.first().before(SVG(RUNTIME_DEFAULT_STYLE))
  }

  const userScript = init_scripts(draw)

  init_history(draw)
  init_selection(draw)
  init_component(draw)
  init_drag(draw)

  init_keybindings(draw)
  reconstruct_components(draw)
  draw.ready = true
  enableColorPicker()

  init_code_editor(userScript)
  return draw
}

function convertFile(file) {
  file.text().then(content => {
    _draw = loadFSG(content)
    _draw.fsg.filename = file.name
    saveAsSVG(_draw)
  })
}

function init() {
  console.log("init")
  SVG('#file').on('input', evt => {
    evt.target.files.forEach(file => convertFile(file))
  })
}

// window.dropHandler = dropHandler

SVG.on(document, 'DOMContentLoaded', () => init())
