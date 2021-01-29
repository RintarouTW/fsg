'use strict'

import { SERVER_ROOT, DEFAULT_WINDOW_WIDTH, DEFAULT_WINDOW_HEIGHT } from '../common/define.js'
import { getHash, postCode } from './server.js'

// so far, menu is only working in runtime, not the editor.

const MENU_PADDING_LEFT = 10 
const MENU_PADDING_TOP = 5

class Menu {
  constructor(draw, coord) {
    this.draw = draw
    const menu = draw.group().translate(coord.x, coord.y).attr('class', 'menu')
    menu.rect(100, 50).flip('y')  // background
      .stroke({ color:'#666', width: 0.3})
      .fill('#000')
    const item = menu.text('Edit').flip('y')
      .attr('class', 'menu_item')
      .move(MENU_PADDING_LEFT, MENU_PADDING_TOP)
    item.on('mousedown', evt => {
      this.editSVG(draw)
      evt.preventDefault()
      evt.stopPropagation()
    })
    this.menu = menu
    draw.menu = this
  }
  remove() {
    this.menu.remove()
    this.draw.menu = null
  }
  editSVG(draw) {
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
}

export function gen_menu(draw, coord) {
  return new Menu(draw, coord)
}

