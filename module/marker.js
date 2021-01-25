'use strict'

import { 
  VECTOR_START_MARKER_RADIUS,
  VECTOR_END_MARKER_ARROW_WIDTH,
  VECTOR_END_MARKER_ARROW_LENGTH 
} from '../common/define.js'

export function init_marker(draw) {
  deinit_marker(draw)
  draw.fsg.marker = {}

  let vector_start_marker = draw.parent().defs().findOne('.vector-start-marker')
  if(vector_start_marker) {
    draw.fsg.marker.vector_start_marker = vector_start_marker
  } else {
    vector_start_marker = draw.parent().marker(VECTOR_START_MARKER_RADIUS * 2, VECTOR_START_MARKER_RADIUS * 2, add => {
      const r = VECTOR_START_MARKER_RADIUS
      add.circle(r).radius(r).cx(r).cy(r).attr('class', 'vector-marker-start')
    })
    vector_start_marker.attr('class', 'vector-start-marker')
    draw.fsg.marker.vector_start_marker = vector_start_marker
  }

  // arrow
  let vector_end_marker = draw.parent().defs().findOne('.vector-end-marker')
  if (vector_end_marker) {
    draw.fsg.marker.vector_end_marker = vector_end_marker
    return
  }

  vector_end_marker = draw.parent().marker(VECTOR_END_MARKER_ARROW_LENGTH, VECTOR_END_MARKER_ARROW_WIDTH, add => {
    const path = String.raw`0 0, ${VECTOR_END_MARKER_ARROW_LENGTH} ${VECTOR_END_MARKER_ARROW_WIDTH / 2}, 0 ${VECTOR_END_MARKER_ARROW_WIDTH}`
    add.polygon(path)
      .stroke({width: 1})
      .attr('class', 'vector-marker-end')
  })
  vector_end_marker.size(VECTOR_END_MARKER_ARROW_LENGTH, VECTOR_END_MARKER_ARROW_WIDTH)
  vector_end_marker.ref(VECTOR_END_MARKER_ARROW_LENGTH, VECTOR_END_MARKER_ARROW_WIDTH/2)
  vector_end_marker.attr('class', 'vector-end-marker')
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
