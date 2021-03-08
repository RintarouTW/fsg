'use strict';

let speechLang = 'en'

let allVoices = []
let _storyboard
let isUtterEnd = true, isActionEnd = true

export function init_module_animatic() {
  speechSynthesis.onvoiceschanged = initAllVoices
  initAllVoices() // for FireFox
  window.animatic = animatic
}

export function animatic(storyboard) {
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
  const voiceIndex = voicesBy(speechLang)[0].index
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
