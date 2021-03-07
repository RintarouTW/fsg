'use strict'

import { FSG_HIDDEN_ATTR } from '../common/define.js'

export function init_module_extension() {
  // extend SVG.Element to support anime()
  SVG.extend(SVG.Element, {
    anime: function(...args) {
      return this.animate(...args).during( () => this.fire('update') )
    },
    unhide: function() {
      return this.attr(FSG_HIDDEN_ATTR, null)
    },
    hide: function() {
      return this.attr(FSG_HIDDEN_ATTR, true)
    },
  })
  // extend SVG.Runner
  SVG.extend(SVG.Runner, {
    update: function() {
      return this.during( () => this.element().fire('update') )
    }
  })
}

