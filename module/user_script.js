'use strict'

import { 
  FSG_NAMESPACE, 
  FSG_RUNTIME_NAMESPACE, 
  SVGJS_SCRIPT_NAMESPACE,
  SVGJS_SCRIPT_URL,
  RUNTIME_SCRIPT_URL
} from '../common/define.js'

let _draw

export function contain_user_script(draw) {
  const scripts = draw.defs().find('script')
  let found = false
  scripts.forEach(script => {
    if (script.node.getAttribute('xmlns') == FSG_NAMESPACE) {
      if (script.node.textContent.length > 0) found = true
    }
  })
  return found
}

export function execute_user_script(draw) {
  if (!draw) draw = _draw
  const scripts = draw.defs().find('script')
  scripts.forEach(script => {
    if (script.node.getAttribute('xmlns') == FSG_NAMESPACE) {
      // TODO: security issue though. don't care so far.
      try {
        eval(script.node.textContent)
      } catch (err) {
        console.log(err)
        alert(err.stack)
      }
    }
  })
}

export function findUserScript(draw) {
  const scripts = draw.parent().find('script')
  // console.log(scripts)
  let found = false
  scripts.forEach(script => {
    if (script.node.getAttribute('xmlns') == FSG_NAMESPACE) {
      found = script
    }
  })

  if (!found) {
    // console.log('user script not found')
    found = SVG(`<script></script>`).attr('xmlns', FSG_NAMESPACE)
  }
  // console.log(found)
  return found
}

export function findScript(draw, ns) {
  const scripts = draw.parent().find('script')
  let found = false
  scripts.forEach(script => {
    if (script.node.getAttribute('namespace') == ns) {
      // console.log('found ', ns)
      found = script
    }
  })
  return found
}

export function init_scripts(draw) {
  // const userCode = `console.log('execute');const p1 = SVG('#p1'); if(p1) p1.animate(3000).rotate(360, 0, 0).during(() => SVG('#p1').fire('update'));`
  const userScript = findUserScript(draw)
  const svgjs = findScript(draw, SVGJS_SCRIPT_NAMESPACE)
  const runtime = findScript(draw, FSG_RUNTIME_NAMESPACE)

  if (!svgjs)
    draw.defs().add(SVG(SVGJS_SCRIPT_URL).attr('namespace', SVGJS_SCRIPT_NAMESPACE)) // inject svgjs script
  if (!runtime)
    draw.defs().add(SVG(RUNTIME_SCRIPT_URL).attr('namespace', FSG_RUNTIME_NAMESPACE))

  draw.defs().add(userScript)
  _draw = draw

  return userScript
}

