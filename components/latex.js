'use strict'

import { DEFAULT_TEXT, OF_ATTR } from '../common/define.js'
import { Component, componentByNo } from './component.js'
import { currentStrokeColor } from '../module/color_picker.js'

function useCurrentColors(element) {
  if (window.FSG_BUILDER) { // run in editor
    const strokeColor = currentStrokeColor()
    element.attr('style', `color: ${strokeColor};`)
  }
}

///
/// LaTeX 
/// (optional) componentRef is the target component no that this latex relative to.
///
export class LaTeX extends Component {
  constructor({draw, element, componentRef}) {
    super({draw, element})
    { // patch old diagrams(.text) to new class(.latex)
      element.removeClass('text')
      element.addClass('latex')
    }

    if (componentRef) {
      const target = componentByNo(draw, componentRef).element
      this.target = target
      this.watchUpdate([this.target], () => {
        const offsetX = element.attr('offset_x')
        const offsetY = element.attr('offset_y')
        const position = { x: target.cx() + offsetX, y: -target.cy() + offsetY }
        element.move(position.x, position.y)
      })
    }

    this.makeDraggable(draw, element)
  }
  makeDraggable(draw, element) {
    const target = this.target
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
      if (target) {
        const offset = { dx: element.x() - target.cx(), dy: element.y() + target.cy() }
        element.attr('offset_x', offset.dx).attr('offset_y', offset.dy)
      }
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
    element = genLaTeX(this.draw, text, position)
    element.component = this
    this.makeDraggable(draw, element)
    draw.add(element)
    this.element = element
  }
  getText() {
    return this.element.attr('text')
  }
  getAttributes() {
    return ['id', 'class', 'cx', 'cy', 'text', 'stroke']
  }
  getAttribute(attributeName) {
    if (attributeName == 'stroke') {
      const color = this.element.node.getAttribute('style')
      const value = color?.replace(/(color| |:|;)/g, '')
      return value ?? '#999999ff' // default text color
    }
    return super.getAttribute(attributeName)
  }
  setAttribute(attributeName, value) {
    if (attributeName == 'stroke') {
      this.element.attr('style', `color: ${value};`)
      return
    }
    super.setAttribute(attributeName, value)
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
      /* xmlns="http://www.w3.org/1999/xhtml" is required for foreignObject that could be rendered in standalonee svg */
      const tex = SVG(String.raw`<div xmlns="http://www.w3.org/1999/xhtml" class="latex-container"></div>`)
      let foreignObject
      try {
        let html = katex.renderToString(text, katex_options)
        // &nbsp; is not a defined entity in svg, replace it with &#160;
        html = html.replace(/\&nbsp;/g, '&#160;')
        tex.node.innerHTML = html
        foreignObject = draw.foreignObject(800, 600).add(tex)
        const {width, height} = tex.node.getBoundingClientRect()
        /*
    const katex = tex.node.firstElementChild
    const height = tex.node.getBoundingClientRect().height
    const width = katex.getBoundingClientRect().width
    */
        foreignObject.size(width, height)
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

function genLaTeX(draw, text, position) {
  const element = foreignTex(draw, text).flip('y')
    .attr('class', 'latex selected component')
    .attr('text', text)
    .attr('x', position.x)
    .attr('y', -position.y)
    .attr('style', 'color: #888')
  // genCover(draw, element, position)
  return element
}

export function addLaTeX({draw, element, text, unselect, componentRef}) {
  if (!element) {
    /*
     * <g label=''>
     *   <foreignObject></foreignObject>
     * </g>
     */
    if (!componentRef) {
      const position = draw.mousePosition
      text = text ?? DEFAULT_TEXT
      element = genLaTeX(draw, text, position)
      useCurrentColors(element)
    } else {
      let position = componentByNo(draw, componentRef).center()
      text = text ?? DEFAULT_TEXT
      element = genLaTeX(draw, text, position)
      element.attr('offset_x', 0)
        .attr('offset_y', 0)
        .attr(OF_ATTR, componentRef)
      useCurrentColors(element)
    }
  } else {
    componentRef = element.attr(OF_ATTR)
  }
  const component = new LaTeX({draw, element, componentRef})
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

