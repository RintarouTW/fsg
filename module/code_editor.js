'use strict';

import { DEV_TESTING } from '../common/define.js'
import { loadCSS, loadScript } from '../common/common.js'

if (!DEV_TESTING) {

  /* Core, Theme, addons */
  loadCSS("https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.58.1/codemirror.min.css")
  loadCSS("https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.58.1/theme/tomorrow-night-bright.min.css")
  loadScript("https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.58.1/codemirror.min.js")
  loadScript("https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.58.1/addon/display/placeholder.min.js")

  /* Languages */
  loadScript("https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.58.1/mode/javascript/javascript.min.js")
  loadScript("https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.58.1/addon/display/autorefresh.min.js")

  /* Keymaps */
  loadScript("https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.58.1/keymap/vim.min.js")

} else {

  /* Core, Theme, addons */
  loadCSS(`lib/codemirror/codemirror.min.css`)
  loadCSS(`lib/codemirror/tomorrow-night-bright.min.css`)
  loadScript(`lib/codemirror/codemirror.min.js`)
  loadScript(`lib/codemirror/placeholder.min.js`)

  /* Languages */
  loadScript(`lib/codemirror/javascript.min.js`)
  loadScript(`lib/codemirror/autorefresh.min.js`)

  /* Keymaps */
  loadScript(`lib/codemirror/vim.min.js`)
}

var _cmInstance /* code mirror editor */
var _window

/*
 * Controller
 */

function codeEditor() {

  const textarea = document.querySelector('#codeEditor')
  _window = document.querySelector('#codeEditorWindow')

  // code mirror editor
  _cmInstance = CodeMirror.fromTextArea(textarea, {
    mode: {name: "javascript"},
    autoRefresh: true,
    autofocus: true,
    tabSize: 2,
    indentUnit: 2,
    lineNumbers: true,
    placeholder: "Edit code...",
    theme: "tomorrow-night-bright"
  })

  _cmInstance.execCommand("selectAll")

  _window.addEventListener('keydown', evt => {
    switch(evt.code) {
      case 'F1':
        toggle_code_editor()
        break
      case 'KeyE':
        {
          if(evt.ctrlKey) {
            SVG('#runButton').node.click()
            evt.preventDefault()
            evt.stopPropagation()
          }
        }
        break
      case 'KeyR':
        {
          if (evt.ctrlKey) { // reload
            SVG('#reloadButton').node.click()
            evt.preventDefault()
            evt.stopPropagation()
          }
        }
        break
    } 
  })
}

export function toggle_code_editor() {
  _window.classList.toggle("l4t-hidden")
  if(!_window.classList.contains("l4t-hidden")){
    _cmInstance.focus()
  }
}

export function init_code_editor(userCode) {
  if(!_cmInstance) { // singlton only
    codeEditor()
  } else {
    _cmInstance.off('change')
  }

  setCode(userCode.node.textContent)

  _cmInstance.on('change', () => {
    userCode.node.textContent = getCode()
  })

  // set keymap to vim , bug fixed
  if(CodeMirror.keyMap['vim']) {
    CodeMirror.keyMap['vim'].attach(_cmInstance)
    _cmInstance.options.keyMap = 'vim'
  }
}

export function getCode() {
  return _cmInstance.getValue()
}

export function setCode(text) {
  _cmInstance.setValue(text)
}
