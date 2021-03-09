'use strict';

import { wait } from '../common/common.js'

let speechLang = 'en'

let allVoices = []
let _storyboard
let isUtterEnd = true, isActionEnd = true

speechSynthesis.onvoiceschanged = initAllVoices
initAllVoices() // for FireFox

export function init_module_animatic() {
  window.animatic = animatic
}

export function animatic(lang, storyboard) {
  speechLang = lang
  _storyboard = storyboard
  actionStart()
}

export function actionStart() {
  if (!isUtterEnd || !isActionEnd) return

  const speech = _storyboard.shift()
  if (!speech) return

  const [utterText, action] = speech
  // Action Start
  isActionEnd = false
  isUtterEnd = false

  // User could control when is the end of action by calling actionEndCallback
  const actionEndCallback = nextAction => {
    isActionEnd = true
    if (nextAction) actionStart()
  }
  action(actionEndCallback)

  const utterCallback = () => {
    isUtterEnd = true
    actionStart()
  }
  speak(utterText, utterCallback)
}

export function speak(text, callback) {
  if (allVoices.length == 0) { // wait for voices initialization
    wait(300).then(() => speak(text, callback))
    return
  }

  const availableVoices = voicesBy(speechLang)
  if (availableVoices.length == 0) {
    console.warn('no available voice')
    return
  }
  const voiceIndex = availableVoices[0].index
  queueSpeech(voiceIndex, text, callback)
}

export function shutup() {
  speechSynthesis.cancel()
}

function initAllVoices() {
  speechSynthesis.cancel()
  allVoices = speechSynthesis.getVoices()
}

function voicesBy(lang) {
  let result = []
  for(const [index, voice] of allVoices.entries()) {
    if (voice.lang == lang) 
      result.push( {voice: voice, index: index} )
  }
  return result
}

function queueSpeech(voiceIndex, text, callback) {
  let utterthis = new SpeechSynthesisUtterance(text)
  utterthis.voice = allVoices[voiceIndex]
  utterthis.onend = callback
  speechSynthesis.speak(utterthis)
}
