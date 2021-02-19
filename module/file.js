'use strict'

import { 
  COMPONENT_REFS_ATTR,
  COMPONENT_NO_ATTR,
  SERVER_ROOT,
  FSG_NAMESPACE,
  RUNTIME_DEFAULT_STYLE,
  RUNTIME_STYLE_LINK,
  KATEX_STYLE_LINK,
  CLASS_FSG_UI_SELECT_BOX,
  FSG_SELECTED_ATTR,
  FSG_INSPECTING_ATTR,
  FSG_DRAGGING_ATTR,
  FSG_HOVER_ATTR,
  FSG_FILL_NONE_ATTR,
  FSG_HIDDEN_ATTR,
  FSG_SHAPE_ATTR,
} from '../common/define.js'

import { addLine, addRay, addParallelLine, addPerpLine, addBisectorLine } from '../components/line.js'
import { addEdge, addVector, addAxis } from '../components/line-segment.js'
import { addPolygon, addCircle, addAngle } from '../components/fillable.js'
import { addMidPoint, addIntersectPoint } from '../components/point.js'
import { addPoint, addPinPoint } from '../components/draggable-point.js'
import { addLaTeX } from '../components/latex.js'
import { addArrowedAngle } from '../components/measure.js'

// reconstruct order by component_no
function findAllComponentElements(draw) {
  const componentElements = draw.find(`[${COMPONENT_NO_ATTR}]`)
  // sort by component_no
  componentElements.sort((a, b) => {
    const no1 = Number(a.attr(COMPONENT_NO_ATTR)) //; console.assert(a, "component has no component_no")
    const no2 = Number(b.attr(COMPONENT_NO_ATTR)) //; console.assert(b, "component has no component_no")
    return no1 - no2
  })
  return componentElements
}

function elementByNo(components, no) {
  let found
  components.forEach(element => {
    if (Number(element.attr(COMPONENT_NO_ATTR)) == (no)) found = element
  })
  return found
}

export function reconstruct_components(draw) {
  const list = findAllComponentElements(draw)
  list.forEach(element => {
    // console.log(element.attr(COMPONENT_NO_ATTR), element, element.classes())
    // const position = element.position()
    if (element.hasClass('point')) {
      addPoint({draw, element})
      return
    }
    if (element.hasClass('mid-point')) {
      const refs_attr = element.attr(COMPONENT_REFS_ATTR)
      if (!refs_attr) return
      const componentRefs = refs_attr.split(',').map(item => Number(item))
      addMidPoint({draw, componentRefs, element})
      return
    }
    if (element.hasClass('intersect-point')) {
      const refs_attr = element.attr(COMPONENT_REFS_ATTR)
      if (!refs_attr) return
      const componentRefs = refs_attr.split(',').map(item => Number(item))
      addIntersectPoint({draw, componentRefs, element})
      return
    }
    if (element.hasClass('parallel-point')) {
      // not used anymore
      return
    }
    if (element.hasClass('perp-point')) {
      // not used anymore
      return
    }
    if (element.hasClass('pin-point')) {
      const componentRef = element.attr(COMPONENT_REFS_ATTR)
      if (!componentRef) return
      const refElement = elementByNo(list, componentRef)
      console.assert(refElement, 'failed to locate the refereneced element')
      let type = 'line'
      if (refElement instanceof SVG.Circle) type = 'circle'
      addPinPoint({draw, type, componentRef, element})
      return
    }
    if (element.hasClass('latex') || element.hasClass('text')) {
      addLaTeX({draw, element})
      return
    }
    if (element.hasClass('axis-x')) { // axis component has no refs
      const type = 'axis-x'
      addAxis({draw, type, element}) 
      return
    }
    if (element.hasClass('axis-y')) {
      const type = 'axis-y'
      addAxis({draw, type, element}) 
      return
    }
    // shapes
    const refs = element.attr(COMPONENT_REFS_ATTR)
    if (!refs) return
    const componentRefs = refs.split(',').map(item => Number(item))
    if (element.hasClass('edge')) {
      addEdge({draw, componentRefs, element}) 
      return
    }
    if (element.hasClass('vector')) {
      addVector({draw, componentRefs, element}) 
      return
    }
    if (element.hasClass('line')) {
      addLine({draw, componentRefs, element}) 
      return
    }
    if (element.hasClass('ray')) {
      addRay({draw, componentRefs, element}) 
      return
    }
    if (element.hasClass('polygon')) {
      addPolygon({draw, componentRefs, element}) 
      return
    }
    if (element.hasClass('circle')) {
      addCircle({draw, componentRefs, element}) 
      return
    }
    if (element.hasClass('angle')) {
      addAngle({draw, componentRefs, element}) 
      return
    }
    if (element.hasClass('angle-marker')) {
      addArrowedAngle({draw, componentRefs, element}) 
      return
    }
    if (element.hasClass('parallel-line')) {
      // patch for the old files that used parallel-point
      let refs = componentRefs
      const [ , no2] = componentRefs
      const p2 = elementByNo(list, no2) 
      if (p2.hasClass('parallel-point')) {
        refs = p2.attr(COMPONENT_REFS_ATTR).split(',')
      }
      addParallelLine({draw, componentRefs : refs, element}) 
      return
    }
    if (element.hasClass('perp-line')) {
      // patch for the old files that used parallel-point
      let refs = componentRefs
      const [ , no2] = componentRefs
      const p2 = elementByNo(list, no2) 
      if (p2.hasClass('perp-point')) {
        refs = p2.attr(COMPONENT_REFS_ATTR).split(',')
      }
      addPerpLine({draw, componentRefs : refs, element}) 
      return
    }
    if (element.hasClass('bisector-line')) {
      addBisectorLine({draw, componentRefs, element}) 
      return
    }
    console.warn('WARNNING: Fixme - unsupported component..', element)
  })

  return
}

// remove xmlns:svgjs that could be inserted more than once and casue the svg broken. (should be a bug of svgjs.)
// katex and mathjax both use svgjs too.
function patchSVGJS(draw) {
  const latex_containers = draw.find('.latex-container')
  latex_containers.each(latex => {
    const mathSVGs = latex.find('svg')
    mathSVGs.each(svg => {
      svg.attr('xmlns:svgjs', null) 
      svg.attr('xmlns:svgjs', "https://svgjs.com/svgjs") 
    })
  })
}

// clean up the classes used by editor and remove the outdated elements
function cleanupDirtyElements(draw) {

  // clean up the outdated elements
  const outdatedElements = draw.find('.hidden-point, .cover, .parallel-point, .perp-point')
  outdatedElements.each(element => element.remove())

  const dirtyElements = draw.find('.selected, .inspecting, .dragging, .hover, .component, .none, .hidden, .shape')
  dirtyElements.each(element => {
    element.removeClass('component')
      .removeClass('selected')
      .removeClass('inspecting')
      .removeClass('dragging')
      .removeClass('hover')

    if (element.hasClass('shape')) {
      element.removeClass('shape').attr(FSG_SHAPE_ATTR, true)
    }
    if (element.hasClass('none')) {
      element.removeClass('none').attr(FSG_FILL_NONE_ATTR, true)
    }
    if (element.hasClass('hidden')) {
      element.removeClass('hidden').attr(FSG_HIDDEN_ATTR, true)
    }
  })

  // clean up the attributes only used by the builder.
  const dirtyAttributes = [
    `[${FSG_SELECTED_ATTR}]`,
    `[${FSG_INSPECTING_ATTR}]`,
    `[${FSG_DRAGGING_ATTR}]`,
    `[${FSG_HOVER_ATTR}]`,
  ]
  dirtyAttributes.forEach(attr => {
    const dirtyElements = draw.find(attr)
    dirtyElements.forEach(element => {
      element.attr(FSG_SELECTED_ATTR, null)
        .attr(FSG_INSPECTING_ATTR, null)
        .attr(FSG_DRAGGING_ATTR, null)
        .attr(FSG_HOVER_ATTR, null)
    })
  })
}

///
/// patch for the old files that doesn't have KATEX_STYLE_LINK
///
function patchStyles(draw) {
  const defs = draw.defs()
  const styles = defs.find('style')
  styles.forEach(style => style.remove())
  defs.first().before(SVG(RUNTIME_DEFAULT_STYLE))

  const links = defs.find('link')
  links.forEach(link => link.remove())
  // first() is the the default style
  defs.first().after(SVG(KATEX_STYLE_LINK))
  defs.first().after(SVG(RUNTIME_STYLE_LINK))
}

///
/// patch the old LaTeX containers
///

function patchForeignObjectLaTeX(draw) {
  const latexContainers = draw.find('div.latex-container')
  latexContainers.forEach(div => {
    div.attr('xmlns', null) // in case it exists already
      .attr('xmlns', 'http://www.w3.org/1999/xhtml')
  })
}

function patchToNewClass(draw) {
  // replace old class to new class
  draw.findOne('.ui-select-box')?.attr('class', CLASS_FSG_UI_SELECT_BOX)
}

export function svgDocument(draw, optional_attributes = {}) {
  let content = draw.parent().svg() 

  /* remove xmlns:svgjs first and add it back to prevent the svgjs redefine bug */
  const tmp = SVG(content)
    .attr('xmlns:svgjs', null)
    .attr('xmlns:svgjs', "https://svgjs.com/svgjs") 
    .attr('xmlns:fsg', null) // clean first to prevent the same bug of svgjs
    .attr('xmlns:fsg', FSG_NAMESPACE)
    .attr('style', null)

  for (const [key, value] of Object.entries(optional_attributes)) {
    tmp.attr(key, value)
  }

  patchSVGJS(tmp)
  cleanupDirtyElements(tmp)
  patchStyles(tmp)
  patchForeignObjectLaTeX(tmp)
  patchToNewClass(tmp)

  // &nbsp; is not a defined entity in svg, replace it with &#160;
  const html = tmp.svg()
  return html.replace(/\&nbsp;/g, '&#160;')
}

export function saveAsSVG(draw) {
  var download = document.createElement('a')
  const content = svgDocument(draw)
  download.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content))
  download.setAttribute('download', draw.fsg.filename)
  download.style.display = 'none'
  document.body.appendChild(download)
  download.click()
  document.body.removeChild(download)
}

export function exportToHTML(draw) {
  const filename = draw.fsg.filename.replace(/\.svg/, '.html')
  var element = document.createElement('a');
  let content = svgDocument(draw, { 'style' :  'width:100%;' }) // only for HTML

  const head = String.raw`<head>
    <title>Fast SVG Geometry</title>
    <script src="https://cdn.jsdelivr.net/npm/@svgdotjs/svg.js@3.0/dist/svg.min.js"></script>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.12.0/dist/katex.min.css">
    <link rel="stylesheet" type="text/css" href="${SERVER_ROOT}/style/runtime.css">
    <link rel="icon" href="${SERVER_ROOT}/images/favicon.ico" type="image/x-icon" />
  </head>
`
  // <link rel="stylesheet" type="text/css" href="${SERVER_ROOT}/style/runtime.css">
  // <link rel="stylesheet" type="text/css" href="${SERVER_ROOT}/style/dark-background.css">
  // <link rel="stylesheet" type="text/css" href="${SERVER_ROOT}/style/theme-dark.css">
  // <link rel="stylesheet" type="text/css" href="${SERVER_ROOT}/style/theme-light.css">

  content = '<!DOCTYPE html>' + head + '<body><div style="overflow:hidden">' + content + '</div></body></html>'
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
  element.setAttribute('download', filename);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

