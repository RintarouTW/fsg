'use strict'

import { DEFAULT_TEXT } from '../common/define.js'
import { Component } from './component.js'

export class Text extends Component {
  constructor({draw, element}) {
    super({draw, element})
    this.makeDraggable(draw, element)
  }
  makeDraggable(draw, element) {
    // selectable and draggable
    element.on('mousedown', evt => {
      element.lastEvent = 'mousedown'
      element.fire('dragstart', { dragTarget: element })
      evt.stopPropagation()
    }).on('mouseup', () => {
      if (element.lastEvent == 'mousedown') this.toggleSelected()
      element.lastEvent = 'mouseup'
      element.fire('dragend')
    }).on('mousemove', () => {
      element.lastEvent = 'mousemove'
    }).on('dragstart', () => {
      element.addClass('dragging')
      draw.dragTarget = element
    }).on('dragend', () => {
      element.removeClass('dragging')
      draw.dragTarget = null
    }).on('dragmove', () => {
      element.fire('update', { target: this })
    })
  }
  // override default label interface
  setText(text) {
    if (!text) text = ''
    let element = this.element
    const draw = this.draw
    const position = { x: element.attr('x'), y: -element.attr('y') }
    element.clear().remove()
    element = genText(this.draw, text, position)
    element.component = this
    this.makeDraggable(draw, element)
    draw.add(element)
    this.element = element
  }
  getText() {
    return this.element.attr('text')
  }
  getAttributes() {
    return ['id', 'class', 'cx', 'cy', 'text']
  }
}

/* MathJax Implementation 
function foreignTex(draw, text) {
  const tex = SVG(String.raw`<div>$${text}$</div>`)
  console.log(tex)
  let foreignObject
  try {
    // renderMathInElement(tex.node, katex_options)
    foreignObject = draw.foreignObject(500, 200).add(tex)
    MathJax.typeset()
    const svg = foreignObject.findOne('svg')
    svg.attr('xmlns:svgjs', null)
    return foreignObject
  } catch(err) {
    console.log(err)
    if (foreignObject) foreignObject.remove()
    return null
  }
}
*/

/* KaTeX Implementation */
function foreignTex(draw, text) {
  /* new implementation depends on css fit-content */
  const tex = SVG(String.raw`<div class="latex-container">$${text}$</div>`)
  let foreignObject
  try {
    renderMathInElement(tex.node, katex_options)
    foreignObject = draw.foreignObject(500, 200).add(tex)
    const {width, height} = tex.node.getBoundingClientRect()
    /*
    const katex = tex.node.firstElementChild
    const height = tex.node.getBoundingClientRect().height
    const width = katex.getBoundingClientRect().width
    */
    foreignObject.size(width, height)
    // .attr('xmlns', 'http://w3.org/1999/xhtml')
    return foreignObject
  } catch(err) {
    console.log(err)
    if (foreignObject) foreignObject.remove()
    return null
  }
}

// for debug
function genCover(draw, element, position) {
  const bbox = element.bbox()
  const cover = draw.rect(bbox.width, bbox.height)
    .move(position.x, -position.y).stroke('#888').fill('none')
  element.add(cover)
}

function genText(draw, text, position) {
  const element = foreignTex(draw, text).flip('y')
    .attr('class', 'text selected component')
    .attr('text', text)
    .attr('x', position.x)
    .attr('y', -position.y)
  // genCover(draw, element, position)
  return element
}

export function addText({draw, element, text, unselect}) {
  if (!element) {
    /*
     * <g label=''>
     *   <foreignObject></foreignObject>
     * </g>
     */
    const position = draw.mousePosition
    text = text ?? DEFAULT_TEXT
    element = genText(draw, text, position)
  }
  const component = new Text({draw, element})
  if(unselect) unselectComponent(draw, component)
  return component
}

const katex_options = {
  throwOnError: false,
  output: "html", // keep mathml for copy-tex to work
  delimiters: [
    // { left: "$$", right: "$$", display: true },
    { left: "$", right: "$", display: false },
    { left: "\\(", right: "\\)", display: false },
    { left: "\\[", right: "\\]", display: true },
    { left: "\\begin{equation}", right: "\\end{equation}", display: true}
  ],
  trust: true,
  strict: "ignore",
  macros: {
    "\\eqref": "\\href{#1}{}",   // not support yet
    "\\label": "\\href{#1}{}",   // not support yet
    "\\require": "\\href{#1}{}", // not support yet
    "\\tag": "\\href{#1}{}",     // not support yet
    "\\hfil": "\\space",         // not support yet
    "\\style": "\\href{#1}{}",   // not support yet
    "\\def": "\\gdef", // def only work in local context, make it global
    "\\cal": "\\mathcal",
    "\\pmatrix": "\\begin{pmatrix}#1\\end{pmatrix}",
    "\\vmatrix": "\\begin{vmatrix}#1\\end{vmatrix}",
    "\\bmatrix": "\\begin{bmatrix}#1\\end{bmatrix}",
    "\\cases": "\\begin{cases}#1\\end{cases}",
    "\\align": "\\begin{aligned}#1\\end{aligned}",
    "\\eqalign": "\\begin{aligned}#1\\end{aligned}",
    "\\array": "\\begin{array}#1\\end{array}",
    "\\gather": "\\begin{gathered}#1\\end{gathered}",
  },
}

