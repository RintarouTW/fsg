'use strict'

import { loadSVG } from '../main.js'
import { test_svg } from './test_svg.js'

export function basic_svg_test() {
    loadSVG(test_svg)
}

export function intersect_test() {
}

export function latex_test() {
}

// TODO:
// save to svg test
// save to html test
// points
//   [selectable]
//   intersect point
//   parallel point
//   perp point
//
//   [draggable]
//   point test
//   pin point test
//   appending pin point
// lines
// 
// styles
//   dashed
//   solid
//   hidden
//
// text
//
// math (LaTeX)
//
// ui
//   [history]
//   undo
//   redo
//   delete
//   undelete
//
//   [selection]
//   select
//   deselect last
//   deselectAll
//
