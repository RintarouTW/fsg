'use strict'

export const DEV_TESTING = false
// export const DEV_TESTING = true

export const SERVER_ROOT = (DEV_TESTING) ? 'https://localhost:8080' : 'https://rintaroutw.github.io/fsg'

export const FSG_NAMESPACE = 'https://rintaroutw.github.io/fsg'
export const FSG_RUNTIME_NAMESPACE = 'FSG_RUNTIME'
export const SVGJS_SCRIPT_NAMESPACE = 'SVGJS_SCRIPT'

export const SVGJS_SCRIPT_URL = (DEV_TESTING)
  ? String.raw`<script href="${SERVER_ROOT}/lib/svg.min.js" />`
  : String.raw`<script href="https://cdn.jsdelivr.net/npm/@svgdotjs/svg.js@3.0/dist/svg.min.js" />`

export const RUNTIME_SCRIPT_URL = String.raw`<script href="${SERVER_ROOT}/runtime.min.js" />`

// default styles, functional related, not related to theme
export const RUNTIME_DEFAULT_STYLE = String.raw`<style>
svg {
  user-select: none;
  -webkit-user-select: none;
}

svg .fsg-board {
  fill: #151c23;
}

svg .fsg-ui-select-box {
  stroke-width: 0.5;
  fill: none;
}

svg .menu {
  font: 0.9em Roboto, Helvetica, Sans-Serif, Times, serif, monospace;
}

svg .menu_title {
  fill: #aaa;
  font-family: Georgia, 'Times New Roman', Times, serif;
}

svg .menu_item {
  font-weight: 300;
  fill: #888;
}

svg .menu_item:hover {
  fill: #fff;
  cursor: pointer;
}

svg *[fsg_hidden] {
  visibility: hidden;
}

svg *[fsg_shape]:hover {
  stroke: #fff;
}

svg *[fsg-stroke-type="dashed"] {
  stroke-dasharray: 2.5 2.5;
  stroke-width: 1.2;
}

svg *[fsg-stroke-type="dashed2"] {
  stroke-dasharray: 6 3;
  stroke-width: 1.2;
}

svg *[fsg-stroke-type="dashed3"] {
  stroke-dasharray: 5 5;
  stroke-width: 1.2;
}

svg *[fsg-stroke-type="dashed4"] {
  stroke-dasharray: 3 2 8;
  stroke-width: 1.2;
}

svg .axis-x, svg .axis-y {
  stroke: #555; 
  stroke-width: 1.2;
}

svg .vector-marker-start, svg .vector-marker-end {
  fill: #999;
}

svg .point {
  fill: #2f2f2f;
  stroke: #ff0;
}

svg .pin-point {
  fill: #777777aa;
  stroke: #ff0;
}

svg .mid-point, svg .intersect-point {
  fill: #777777aa;
  stroke: #8a8a8aaa;
}

svg .point:hover, svg .pin-point:hover {
  cursor: grab;
}

svg .mid-point:hover, svg .intersect-point:hover {
  cursor: pointer;
}

svg g, svg div, svg foreignObject, svg span {
  position: relative;
}

svg span.base {
  position: relative !important;
}

svg .latex-container {
  width: max-content;
  height: max-content;
  position: fixed; /* important for Safari */
}

svg .latex,
svg .label {
  color: #999;
  fill: #999;
  font-family: 'KaTeX_Math', 'Times New Roman', Times, serif;
}

svg .length-marker,
svg .angle-marker {
  fill: none
}
</style>`

export const RUNTIME_STYLE_LINK = String.raw`<link xmlns="http://www.w3.org/1999/xhtml" rel="stylesheet" href="${SERVER_ROOT}/style/runtime.css"/>`
export const KATEX_STYLE_LINK = (DEV_TESTING) 
? String.raw`<link xmlns="http://www.w3.org/1999/xhtml" rel="stylesheet" href="${SERVER_ROOT}/lib/katex/katex.min.css"/>`
: String.raw`<link xmlns="http://www.w3.org/1999/xhtml" rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.12.0/dist/katex.min.css"/>`

// Editor
export const SNAP_GRID_INTERVAL = 5.0
export const DEFAULT_WINDOW_WIDTH = 883
export const DEFAULT_WINDOW_HEIGHT = 910
export const FSG_HOVER_ATTR = 'fsg_hover'
export const FSG_DRAGGING_ATTR = 'fsg_dragging'
export const FSG_SELECTED_ATTR = 'fsg_selected'
export const FSG_INSPECTING_ATTR = 'fsg_inspecting'
export const FSG_SHAPE_ATTR = 'fsg_shape'

// Runtime
export const CLASS_FSG_BOARD = 'fsg-board'
export const CLASS_FSG_UI_SELECT_BOX = 'fsg-ui-select-box'
export const DEFAULT_BOARD_RADIUS = 8
export const FSG_HIDDEN_ATTR = 'fsg_hidden'

// component attributes
export const NO_ATTR = 'fsg-no'
export const REFS_ATTR = 'fsg-refs'
export const OF_ATTR = 'fsg-of'
export const TEXT_ATTR = 'fsg-text'

// marker
export const VECTOR_START_MARKER_RADIUS = 3
export const VECTOR_END_MARKER_ARROW_WIDTH = 6
export const VECTOR_END_MARKER_ARROW_LENGTH = 10

export const DEFAULT_LENGTH_MARKER_DISTANCE = 20
export const DEFAULT_LENGTH_MARKER_WIDTH = 7

// Angle
export const DEFAULT_ANGLE_RADIUS = 15

// point
export const POINT_RADIUS = 6

// text
export const DEFAULT_TEXT = String.raw`\LaTeX`
export const DEFAULT_LABEL_OFFSET_X = 5
export const DEFAULT_LABEL_OFFSET_Y = 5

// style
export const DEFAULT_FILL_COLOR = '#ff0f6328'
export const DEFAULT_STROKE_COLOR = '#888888aa'
export const DEFAULT_TEXT_COLOR = '#aaaaaaff'
export const DEFAULT_TRANSPARENT_COLOR = '#ffffff00'
export const FSG_STROKE_TYPE_ATTR = 'fsg-stroke-type'

/// Tests
export const test_user_script = String.raw`console.log('execute user script')
const p1 = SVG('#p1')
if(p1) 
  p1.animate(3000)
    .rotate(360, 0, 0)
    .during(() => SVG('#p1')
    .fire('update'))
`
