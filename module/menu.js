'use strict'

import { SERVER_ROOT } from '../common/define.js'
import { getHash, postCode } from './server.js'

const MENU_PADDING_LEFT = 10 
const MENU_PADDING_TOP = 5

class Menu {
  constructor(draw, coord) {
    this.draw = draw
    draw.on('contextmenu', evt => evt.preventDefault())
    const menu = draw.group().translate(coord.x, coord.y).attr('class', 'menu')
    menu.rect(100, 50).flip('y')  // background
      .stroke({ color:'#666', width: 0.3})
      .fill('#000')
    const item = menu.text('Edit').flip('y')
      .attr('class', 'menu_item')
      .move(MENU_PADDING_LEFT, MENU_PADDING_TOP)
    item.on('click', () => {
      this.editSVG(draw, menu)
    })
    this.menu = menu
  }
  show(coord) {
    this.menu.translate(coord.x, coord.y)
    this.menu.removeClass('ui-hidden')
  }
  hide() {
    this.menu.addClass('ui-hidden')
  }
  editSVG(draw, menu) {
    menu.remove()
    const code = { code : draw.parent().svg() }
    getHash().then( json => {
      const hash = json.hash
      postCode(hash, code).then( json => {
        window.open(SERVER_ROOT + '?source=pwa&hash=' + hash, '_blank', 'resizable')
      }).catch( error => console.log(error) )
    }).catch( error => console.log(error) )
  }
}

export function gen_menu(draw, coord) {
  return new Menu(draw, coord)
}

