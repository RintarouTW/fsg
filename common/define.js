'use strict'

export const DEV_TESTING = false
// export const DEV_TESTING = true

let SERVER_ROOT
SERVER_ROOT = (DEV_TESTING) ? 'http://localhost:8080' : 'https://rintaroutw.github.com/fsg'
export { SERVER_ROOT }

export const FSG_NAMESPACE = 'https://rintaroutw.github.com/fsg'
export const FSG_RUNTIME_NAMESPACE = 'FSG_RUNTIME'
export const SVGJS_SCRIPT_NAMESPACE = 'SVGJS_SCRIPT'

export const SVGJS_SCRIPT_URL = String.raw`<script xlink:href="https://cdn.jsdelivr.net/npm/@svgdotjs/svg.js@3.0/dist/svg.min.js" />`
export const RUNTIME_SCRIPT_URL = String.raw`<script href="${SERVER_ROOT}/runtime.min.js" />`
export const RUNTIME_STYLE_LINK = String.raw`<link xmlns="http://www.w3.org/1999/xhtml" href="${SERVER_ROOT}/style/runtime.css" rel="stylesheet"/>`

// Editor
export const SNAP_GRID_INTERVAL = 5.0
export const DEFAULT_WINDOW_WIDTH = 883
export const DEFAULT_WINDOW_HEIGHT = 910

// Runtime
export const CLASS_FSG_BOARD = 'fsg-board'

// component attributes
export const COMPONENT_NO_ATTR = 'component_no'
export const COMPONENT_REFS_ATTR = 'component_refs'
export const OF_ATTR = 'of'

// marker
export const VECTOR_START_MARKER_RADIUS = 3
export const VECTOR_END_MARKER_ARROW_WIDTH = 6
export const VECTOR_END_MARKER_ARROW_LENGTH = 10

// point
export const POINT_RADIUS = 6

// text
export const DEFAULT_TEXT = String.raw`\LaTeX`
export const DEFAULT_LABEL_OFFSET_X = 5
export const DEFAULT_LABEL_OFFSET_Y = 5

// style
export const DEFAULT_FILL_COLOR = '#ff0f6328'
export const DEFAULT_STROKE_COLOR = '#888888aa'
export const DEFAULT_TRANSPARENT_COLOR = '#ffffff00'

/// Tests
export const test_user_script = String.raw`console.log('execute user script')
const p1 = SVG('#p1')
if(p1) 
  p1.animate(3000)
    .rotate(360, 0, 0)
    .during(() => SVG('#p1')
    .fire('update'))
`
