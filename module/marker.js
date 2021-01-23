'use strict'

import { 
  VECTOR_START_MARKER_RADIUS,
  VECTOR_END_MARKER_ARROW_WIDTH,
  VECTOR_END_MARKER_ARROW_LENGTH 
} from '../common/define.js'

export function init_marker(draw) {
  deinit_marker(draw)
  draw.fsg.marker = {}

  let vector_start_marker = draw.defs().findOne('.vector-start-marker')
  if(!vector_start_marker) {
    vector_start_marker = draw.marker(VECTOR_START_MARKER_RADIUS * 2, VECTOR_START_MARKER_RADIUS * 2, add => {
      const r = VECTOR_START_MARKER_RADIUS
      add.circle(r).radius(r).cx(r).cy(r).attr('class', 'vector-marker-start')
    }).attr('class', 'vector-start-marker')
  }
  draw.fsg.marker.vector_start_marker = vector_start_marker

  // arrow
  let vector_end_marker = draw.defs().findOne('.vector-end-marker')
  if (!vector_end_marker) {
    vector_end_marker = draw.marker(VECTOR_END_MARKER_ARROW_LENGTH, VECTOR_END_MARKER_ARROW_WIDTH, add => {
      add.polygon(`0 0, ${VECTOR_END_MARKER_ARROW_LENGTH} ${VECTOR_END_MARKER_ARROW_WIDTH / 2} , 0 ${VECTOR_END_MARKER_ARROW_WIDTH}`)
        .stroke({width: 1})
        .attr('class', 'vector-marker-end')
    }).size(VECTOR_END_MARKER_ARROW_LENGTH, VECTOR_END_MARKER_ARROW_WIDTH)
      .ref(VECTOR_END_MARKER_ARROW_LENGTH, VECTOR_END_MARKER_ARROW_WIDTH/2)
      .attr('class', 'vector-end-marker')
  }
  draw.fsg.marker.vector_end_marker = vector_end_marker
}

export function deinit_marker(draw) {
  if (draw.fsg.marker?.vector_start_marker) {
    draw.fsg.marker.vector_start_marker.remove()
    draw.fsg.marker.vector_start_marker = null
  }

  if (draw.fsg.marker?.vector_end_marker) {
    draw.fsg.marker.vector_end_marker.remove()
    draw.fsg.marker.vector_end_marker = null
  }
}
