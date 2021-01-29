'use strict'

import { SERVER_ROOT, DEFAULT_WINDOW_WIDTH, DEFAULT_WINDOW_HEIGHT } from '../common/define.js'
import { getHash, postCode } from './server.js'

// so far, menu is only working in runtime, not the editor.

const MENU_PADDING_LEFT = 10 
const MENU_PADDING_TOP = 5
const MENU_PADDING_BOTTOM = 5
const MENU_ITEM_HEIGHT = 23
const MENU_BACKGROUND_COLOR = '#333'
const MENU_BORDER_COLOR = '#666'
const MENU_SEPARATOR_COLOR = '#555'

///
/// MenuItem/
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
  onMouseDown(draw) {
    console.warnning('this should be overriden')
  }
}

class Menu {
  constructor(draw, coord, title) {
    this.draw = draw
    const menu = draw.group().translate(coord.x, coord.y).attr('class', 'menu')
    const bg = menu.rect(100, 50).flip('y')  // background
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
  addMenuItem(item) {
    this.numItems++
    const y = MENU_PADDING_TOP + MENU_ITEM_HEIGHT * this.numItems
    this.menu.line(MENU_PADDING_LEFT - 5, y, 105 - MENU_PADDING_LEFT, y).flip('y')
      .stroke(MENU_SEPARATOR_COLOR)
    item.move(MENU_PADDING_LEFT, y + 3)
    // update background
    this.background.size(100, y + MENU_ITEM_HEIGHT + MENU_PADDING_BOTTOM)
  }
  remove() {
    this.menu.remove()
    this.draw.menu = null
  }
}

class RuntimeMenu extends Menu {
  constructor(draw, coord) {
    super(draw, coord, 'Menu')
    const editItem = new MenuItem(draw, this.menu, 'Edit')
    editItem.onMouseDown = () => {
      this.remove()
      const code = { code : draw.parent().svg() }
      getHash().then( json => {
        const hash = json.hash
        postCode(hash, code).then( () => {
          window.open(SERVER_ROOT + '?source=pwa&hash=' + hash,
            '_blank',
            `resizable, width=${DEFAULT_WINDOW_WIDTH},height=${DEFAULT_WINDOW_HEIGHT}`)
        }).catch( error => console.log(error) )
      }).catch( error => console.log(error) )
    }
    this.addMenuItem(editItem)
  }
}

export function gen_menu(draw, coord) {
  return new RuntimeMenu(draw, coord)
}

