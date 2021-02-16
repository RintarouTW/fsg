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
  RUNTIME_STYLE_LINK,
  KATEX_STYLE_LINK,
} from './common/define.js'
import { wait } from "./common/common.js"

import { init_module_history } from './module/history.js'
import { init_module_selection } from './module/selection.js'
import { init_module_keybinding } from './module/keybinding.js'

import { init_module_drag } from './module/drag.js'
import { init_module_inspector } from './module/inspector.js'
import { init_ui_axis, buttonClass, opening_animation, showHint } from './module/ui.js'
import { init_module_color_picker, enableColorPicker } from './module/color_picker.js'
import { init_module_code_editor } from './module/code_editor.js'
import { init_module_preference } from './module/preference.js'

import { init_module_marker } from './module/marker.js'
// import { init_filter } from './module/filter.js' // not used yet
import { init_component_system, deinit_component_system, componentByNo } from './components/component.js'
import { reconstruct_components } from './module/file.js'
import { init_module_script, findUserScript, execute_user_script } from './module/script.js'
import { getCode } from './module/server.js'
import './lib/svg.panzoom.js'

let _draw = null
let _content = null
let _windowSize = {}

function openFile(file) {
  if(!file) return
  const reader = new FileReader();
  reader.addEventListener("load", function () {
    _draw = loadFSG(reader.result)
    if (_draw) _draw.fsg.filename = file.name
  }, false);
  reader.readAsText(file);
}

function resized(draw) {
  const clientWidth = document.body.clientWidth
  const viewbox = { x: 0, y: 0, width: clientWidth, height: clientWidth * 0.75 }
  draw.parent().size(viewbox.width, viewbox.height).viewbox(viewbox)
  const transform = draw.transform()
  draw.translate(viewbox.width / 2 - transform.translateX, viewbox.height / 2 - transform.translateY)

  // update board size and position
  draw.findOne('.fsg-board')?.size(viewbox.width, viewbox.height).center(0, 0)

  // update axises
  // 
  let coord1 = { x: -viewbox.width/2 , y: 0}
  let coord2 = { x: viewbox.width/2, y: 0}
  draw.findOne('.axis-x')?.component.setCoord(coord1, coord2)
  coord1 = { x: 0, y: -viewbox.height/2 }
  coord2 = { x: 0, y: viewbox.height/2 }
  draw.findOne('.axis-y')?.component.setCoord(coord1, coord2)
}

function cleanUp() {
  if (_draw) deinit_component_system(_draw)
  // clear edit areas
  SVG('#editArea').clear()
  _draw = null
  _content = null
}

function setSnapshotHandler(draw) {
  draw.on('loadSnapshot', evt => {
    _draw = loadFSG(evt.detail.content)
    _draw.ready = true
    evt.detail.selections.forEach( component_no => {
      selectComponent(_draw, componentByNo(_draw, component_no))
    })
  })
}

function newFSG() {

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

  init_module_marker(draw)
  // put the style before scripts
  draw.defs().add(SVG(RUNTIME_DEFAULT_STYLE))
  draw.defs().add(SVG(RUNTIME_STYLE_LINK))
  draw.defs().add(SVG(KATEX_STYLE_LINK))
  init_module_script(draw)

  // creat board as background
  draw.rect(viewbox.width, viewbox.height)
    .attr('class', CLASS_FSG_BOARD)
    .attr('fill', DEFAULT_TRANSPARENT_COLOR) // fill with transparent color
    .radius(DEFAULT_BOARD_RADIUS)
    .move(-viewbox.width/2, -viewbox.height/2)
  init_module_history(draw)
  init_module_selection(draw)
  init_component_system(draw)
  init_module_drag(draw)

  init_module_inspector(draw)
  init_module_keybinding(draw)
  init_ui_axis(draw)

  const userScript = findUserScript(draw)
  init_module_code_editor(userScript)
  init_module_preference(draw)
  setSnapshotHandler(draw)
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

  init_module_marker(draw)

  //
  // Fix the old fsg files which doesn't have default style.
  //
  const defs = draw.defs()
  if(defs.find('style').length == 0) {
    defs.first().before(SVG(RUNTIME_DEFAULT_STYLE))
  }

  init_module_script(draw)

  init_module_history(draw)
  init_module_selection(draw)
  init_component_system(draw)
  init_module_drag(draw)

  init_module_keybinding(draw)
  reconstruct_components(draw)
  draw.ready = true
  enableColorPicker()

  const userScript = findUserScript(draw)
  init_module_code_editor(userScript)
  init_module_preference(draw)

  setSnapshotHandler(draw)

  // respect svg's width, make the window to fit to it automatically.
  const width = draw.parent().attr('width') + (window.innerWidth - document.body.clientWidth)
  window.resizeTo(width, window.outerHeight) // use original outerHeight
  _windowSize = { width: width, height: window.outerHeight }
  return draw
}

function init() {

  if (typeof CodeMirror === 'undefined') {
    wait(300).then(() => init())
    return
  }

  window.FSG_BUILDER = true // define to prevent runtime being init again by the script within svg file.

  window.resizeTo(DEFAULT_WINDOW_WIDTH, DEFAULT_WINDOW_HEIGHT) // default window size

  // extend SVG.Runner
  SVG.extend(SVG.Runner, {
    update: function() {
      this.during( () => this.element().fire('update') )
    }
  })

  init_module_color_picker()

  _draw = newFSG() // new file
  console.assert(_draw, 'something wrong failed to get draw')

  SVG('#file').on('input', evt => {
    openFile(evt.target.files[0])
    evt.preventDefault()
    evt.stopPropagation()
  })

  buttonClass(SVG('#runButton'), () => execute_user_script(_draw))
  buttonClass(SVG('#reloadButton'), () => {
    if (_content) _draw = loadFSG(_content)
  })

  _draw.mousePosition = { x: -150, y: 30 }
  const reset_mouse_position = () => {
    (_draw) && (_draw.mousePosition = { x: 0, y: 0 })
  }
  window.addEventListener('focus', reset_mouse_position)
  window.addEventListener('blur', reset_mouse_position)
  window.addEventListener('resize', () => {
    // Bug fix:
    // Chrome download bar would change window.innerHeight and trigger the window resize event,
    // Close the download bar would trigger the resize event too.
    // Don't resize until the outerWidth or outerHeight is changed.
    if ((window.outerWidth == _windowSize.width) && (window.outerHeight == _windowSize.height)) return
    _windowSize = { width: window.outerWidth, height: window.outerHeight }
    resized(_draw)
  })

  // when mouse up out of drag area.
  document.addEventListener('mouseup', () => {
    _draw?.fire('mouseup_on_document')
  })

  opening_animation(_draw, () => {
    _windowSize = { width: window.outerWidth, height: window.outerHeight }
    const params = new URLSearchParams(window.location.search)
    if (params.has('hash')) {
      const hash = params.get('hash')
      getCode(hash).then(json => {
        // console.log(json)
        _draw = loadFSG(json.code)
      }).catch(error => {
        // console.log(error)
        showHint(error.message)
      })
    }
  })
}

SVG.on(document, 'DOMContentLoaded', () => init())
