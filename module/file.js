'use strict'

import { COMPONENT_REFS_ATTR, COMPONENT_NO_ATTR, OF_ATTR, SERVER_ROOT, FSG_NAMESPACE } from '../common/define.js'
import { addEdge, addLine, addRay, addVector, addAxis, addParallelLine } from '../components/line.js'
import { addPolygon, addCircle } from '../components/fillable.js'
import { addPoint, addMidPoint, addIntersectPoint, addParallelPoint, addPerpPoint, addPinPoint } from '../components/point.js'
import { addText } from '../components/text.js'

// reconstruct order by component_no
function findAllComponentElements(draw) {
  const componentElements = draw.find('.component')
  // sort by component_no
  componentElements.sort((a, b) => {
    return Number(a.attr(COMPONENT_NO_ATTR)) - Number(b.attr(COMPONENT_NO_ATTR))
  })
  // console.log(componentElements)
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
  const covers = draw.find('.cover')
  const list = findAllComponentElements(draw)
  list.forEach(element => {
    // without cover
    // console.log(element.attr(COMPONENT_NO_ATTR), element, element.classes())
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
      const refs_attr = element.attr(COMPONENT_REFS_ATTR)
      if (!refs_attr) return
      const componentRefs = refs_attr.split(',').map(item => Number(item))
      addParallelPoint({draw, componentRefs, element})
      return
    }
    if (element.hasClass('perp-point')) {
      const refs_attr = element.attr(COMPONENT_REFS_ATTR)
      if (!refs_attr) return
      const componentRefs = refs_attr.split(',').map(item => Number(item))
      addPerpPoint({draw, componentRefs, element})
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
    if (element.hasClass('text')) {
      addText({draw, element})
    }
    if (element.hasClass('axis-x')) { // axis component has no refs
      const cover = coverOf(covers, element.attr(COMPONENT_NO_ATTR))
      const type = 'axis-x'
      addAxis({draw, type, element, cover}) 
      return
    }
    if (element.hasClass('axis-y')) {
      const cover = coverOf(covers, element.attr(COMPONENT_NO_ATTR))
      const type = 'axis-y'
      addAxis({draw, type, element, cover}) 
      return
    }
    // with cover
    const refs = element.attr(COMPONENT_REFS_ATTR)
    if (!refs) return
    const componentRefs = refs.split(',').map(item => Number(item))
    const cover = coverOf(covers, element.attr(COMPONENT_NO_ATTR))
    if (element.hasClass('edge')) {
      addEdge({draw, componentRefs, element, cover}) 
      return
    }
    if (element.hasClass('vector')) {
      addVector({draw, componentRefs, element, cover}) 
      return
    }
    if (element.hasClass('line')) {
      addLine({draw, componentRefs, element, cover}) 
      return
    }
    if (element.hasClass('ray')) {
      addRay({draw, componentRefs, element, cover}) 
      return
    }
    if (element.hasClass('polygon')) {
      addPolygon({draw, componentRefs, element, cover}) 
      return
    }
    if (element.hasClass('circle')) {
      addCircle({draw, componentRefs, element, cover}) 
      return
    }
    if (element.hasClass('parallel-line')) {
      addParallelLine({draw, componentRefs, element, cover}) 
      return
    }
    console.log('WARNNING: unsupported component..', element)
  })
  return
}

function coverOf(covers, component_no) {
  let found = null
  covers.forEach(cover => {
    // console.log(component_no, cover, cover.attr(OF_ATTR))
    if (component_no == cover.attr(OF_ATTR) ) found = cover
  })
  console.assert(found, 'cover is required', covers, component_no)
  return found
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

// clean up the classes used by editor
function cleanupDirtyClasses(draw) {
  const dirtyElements = draw.find('.selected, .inspecting, dragging')
  dirtyElements.each(element => {
    element.removeClass('selected').removeClass('inspecting').removeClass('dragging')
  })
}

export function svgDocument(draw, optional_attributes = {}) {
  let content = draw.parent().svg()

  /* remove xmlns:svgjs first and add it back to prevent the svgjs redefine bug */
  const tmp = SVG(content)
    .attr('xmlns:svgjs', null)
    .attr('xmlns:svgjs', "https://svgjs.com/svgjs") 
    .attr('xmlns:fsg', null) // clean first to prevent the same bug of svgjs
    .attr('xmlns:fsg', FSG_NAMESPACE)

  for (const [key, value] of Object.entries(optional_attributes)) {
    tmp.attr(key, value)
  }

  patchSVGJS(tmp)
  cleanupDirtyClasses(tmp)

  return tmp.svg()
}

export function saveAsSVG(draw) {
  var download = document.createElement('a');
  const content = svgDocument(draw, { 'style' :  'width:100%;' })
  const filename = 'light.svg'
  download.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
  download.setAttribute('download', filename);
  download.style.display = 'none';
  document.body.appendChild(download);
  download.click();
  document.body.removeChild(download);
}

export function exportToHTML(draw) {
  var element = document.createElement('a');
  let content = svgDocument(draw, { 'style' :  'width:100%;' }) // for HTML

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
  const filename = 'light.html'
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
  element.setAttribute('download', filename);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

