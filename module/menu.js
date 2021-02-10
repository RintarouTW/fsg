'use strict'

import { SERVER_ROOT, DEFAULT_WINDOW_WIDTH, DEFAULT_WINDOW_HEIGHT } from '../common/define.js'
import { execute_user_script } from './user_script.js'
import { getHash, postCode } from './server.js'
import { saveAsSVG, exportToHTML, svgDocument } from './file.js'
import { toggle_preference_window } from './preference.js'
import { showHint } from './ui.js'

// so far, menu is only working in runtime, not the editor.

const MENU_WIDTH = 130
const MENU_PADDING_LEFT = 10 
const MENU_PADDING_TOP = 5
const MENU_PADDING_BOTTOM = 5
const MENU_ITEM_HEIGHT = 23
const MENU_BACKGROUND_COLOR = '#202020'
const MENU_BORDER_COLOR = '#666'
const MENU_SEPARATOR_COLOR_TOP = '#555'
const MENU_SEPARATOR_COLOR_BOTTOM = '#121212'

///
/// MenuItem
/// menu : element
///

class MenuItem {
  constructor(draw, menu, text) {
    const item = menu.text(text).flip('y')
      .attr('class', 'menu_item')
    item.on('mousedown', evt => {
      this.onMouseDown(draw)
      evt.preventDefault()
      evt.stopPropagation()
    })
    item.menu = menu
    this.item = item
  }
  move(x, y) {
    this.item.move(x, y)
  }
  onMouseDown() {
    console.warn('this should be overriden')
  }
}

class Menu {
  constructor(draw, coord, title) {
    this.draw = draw
    const menu = draw.group().translate(coord.x, coord.y).attr('class', 'menu')
    const bg = menu.rect(MENU_WIDTH, 50).flip('y')  // background
      .stroke({ color: MENU_BORDER_COLOR, width: 0.3})
      .fill(MENU_BACKGROUND_COLOR)
    menu.text(title).flip('y')
      .attr('class', 'menu_title')
      .move(MENU_PADDING_LEFT, MENU_PADDING_TOP)
    this.numItems = 0
    this.menu = menu
    this.background = bg
    draw.menu = this
  }
  addMenuItem(title, action) {
    const item = new MenuItem(this.draw, this.menu, title)
    item.onMouseDown = () => {
      this.remove()
      action()
    }
    this.numItems++
    const y = MENU_PADDING_TOP + MENU_ITEM_HEIGHT * this.numItems
    this.menu.line(MENU_PADDING_LEFT - 5, y, MENU_WIDTH + 5 - MENU_PADDING_LEFT, y).flip('y')
      .stroke(MENU_SEPARATOR_COLOR_TOP)
    this.menu.line(MENU_PADDING_LEFT - 5, y+1, MENU_WIDTH + 5 - MENU_PADDING_LEFT, y+1).flip('y')
      .stroke(MENU_SEPARATOR_COLOR_BOTTOM)
    item.move(MENU_PADDING_LEFT, y + 3)
    // update background
    this.background.size(MENU_WIDTH, y + MENU_ITEM_HEIGHT + MENU_PADDING_BOTTOM)
  }
  remove() {
    this.menu.remove()
    this.draw.menu = null
  }
}

export class RuntimeMenu extends Menu {
  constructor(draw, coord) {
    super(draw, coord, 'Menu')

    this.addMenuItem('Edit', () => {
      const code = { code : draw.parent().svg() }
      getHash().then( json => {
        const hash = json.hash
        postCode(hash, code).then( () => {
          window.open(SERVER_ROOT + '?source=pwa&hash=' + hash,
            '_blank',
            `resizable, width=${DEFAULT_WINDOW_WIDTH}, height=${DEFAULT_WINDOW_HEIGHT}`)
        }).catch( error => console.log(error) )
      }).catch( error => console.log(error) )
    })
    
    this.addMenuItem('Play', () => execute_user_script(draw) )
    this.addMenuItem('Reload', () => location.reload() )
  }
}

export class BuilderMenu extends Menu {
  constructor(draw, coord) {
    super(draw, coord, 'Menu')

    this.addMenuItem('Copy As SVG', () => {
      const content = svgDocument(draw) 
      navigator.clipboard.writeText(content).then(() => {
        showHint('Copied!')
      })
    })

    this.addMenuItem('Save As SVG', () => saveAsSVG(draw) )
    this.addMenuItem('Export to HTML', () => exportToHTML(draw) )

    this.addMenuItem('Reset Viewbox', () => {
      const width = draw.parent().attr('width')
      const height = draw.parent().attr('height')
      draw.parent().viewbox(0, 0, width, height)
    })
    
    this.addMenuItem('Preference', () => toggle_preference_window(draw) )
  }
}
