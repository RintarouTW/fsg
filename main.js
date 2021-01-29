'use strict'

/*
 * editor is the singleton instance per page.
 */

import { DEFAULT_TRANSPARENT_COLOR, CLASS_FSG_BOARD, DEFAULT_WINDOW_WIDTH, DEFAULT_WINDOW_HEIGHT,
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
import { reconstruct_components } from './module/file.js'
import { execute_user_script, init_scripts } from './module/user_script.js'
import { getCode } from './module/server.js'
import './lib/svg.panzoom.js'

// Tests
import { 
  basic_svg_test,
  intersect_test,
  latex_test,
} from './test/test.js'

function run_tests() {
  basic_svg_test()
  intersect_test()
  latex_test()
}

// CAUTION:
// css would override the styles.

let _draw = null
let _content = null

function openSVG(file) {
  const reader = new FileReader();
  reader.addEventListener("load", function () {
    _draw = loadSVG(reader.result)
  }, false);

  if (file) {
    reader.readAsText(file);
  }
}

function resized(draw) {
  const clientWidth = document.body.clientWidth
  const viewbox = { x: 0, y: 0, width: clientWidth, height: clientWidth * 0.75 }
  draw.parent().size(viewbox.width, viewbox.height).viewbox(viewbox)
  const transform = draw.transform()
  draw.translate(viewbox.width / 2 - transform.translateX, viewbox.height / 2 - transform.translateY)
}

// exported only for tests
export function loadSVG(content) {

  let svg

  // deal with corrupted content.
  try {
    svg = SVG(content)
  } catch(err) {
    console.log(err)
    alert(err)
    return
  }
  if (!svg || svg.type !== 'svg') {
    alert('not correct svg file')
    return
  }

  if (_draw) deinit_allcomponents(_draw)
  // clear edit areas
  SVG('#editArea').clear()

  _draw = null
  _content = content

  const isNewFile = !content

  const clientWidth = document.body.clientWidth
  const viewbox = { width: clientWidth, height: clientWidth * 0.75 }
  svg.addTo('#editArea')
    .size(viewbox.width, viewbox.height)
    .viewbox(0, 0, viewbox.width, viewbox.height)
    .panZoom({zoomMin: 1, zoomMax: 3})

  const draw = (!isNewFile) ? svg.first() : svg.group().flip('y').translate(viewbox.width/2, viewbox.height/2)
  draw.fsg = {} // create fsg context for modules

  init_marker(draw)
  if (isNewFile) { // put the style before scripts
    draw.defs().add(SVG(RUNTIME_STYLE_LINK))
  }
  const userScript = init_scripts(draw)

  if (isNewFile) {
    draw.rect(viewbox.width, viewbox.height)
      .attr('class', CLASS_FSG_BOARD)
      .attr('fill', DEFAULT_TRANSPARENT_COLOR) // fill with transparent color
      .move(-viewbox.width/2, -viewbox.height/2)
  }
  init_history(draw)
  init_selection(draw)
  init_component(draw)
  init_drag(draw)

  if(isNewFile) {
    init_inspector(draw)
    init_keybindings(draw)
    init_axis(draw)
    // init_filter(draw)
  } else { 
    init_keybindings(draw)
    reconstruct_components(draw)
    draw.ready = true
    enableColorPicker()
  }
  init_code_editor(userScript)
  return draw
}

function init() {

  if (typeof CodeMirror === 'undefined') {
    wait(300).then(() => init())
    return
  }

  window.FSG = true // define fsg to prevent runtime being init again by the script within svg file.

  window.resizeTo(DEFAULT_WINDOW_WIDTH, DEFAULT_WINDOW_HEIGHT) // default window size

  init_color_picker()

  // _draw = (DEV_TESTING) ? run_tests() : loadSVG() // for testing
  _draw = loadSVG() // new file
  console.assert(_draw, 'something wrong failed to get draw')

  SVG('#file').on('change', evt => {
    openSVG(evt.target.files[0])
  })

  buttonClass(SVG('#runButton'), () => execute_user_script(_draw))
  buttonClass(SVG('#reloadButton'), () => _draw = loadSVG(_content))

  _draw.mousePosition = { x: -150, y: 30 }
  const reset_mouse_position = () => {
    (_draw) && (_draw.mousePosition = { x: 0, y: 0 })
  }
  window.addEventListener('focus', reset_mouse_position)
  window.addEventListener('blur', reset_mouse_position)
  window.addEventListener('resize', () => {
    resized(_draw)
  })

  // when mouse up out of drag area.
  document.addEventListener('mouseup', () => {
    _draw?.fire('mouseup_on_document')
  })

  opening_animation(_draw, () => {
    const params = new URLSearchParams(window.location.search)
    if (params.has('hash')) {
      const hash = params.get('hash')
      getCode(hash).then(json => {
        // console.log(json)
        loadSVG(json.code)
      }).catch(error => {
        // console.log(error)
        showHint(error.message)
      })
    }
  })
}

SVG.on(document, 'DOMContentLoaded', () => init())
