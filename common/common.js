'use strict'

import { SNAP_GRID_INTERVAL } from './define.js'

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

export function snapTo(pt) {
  return { x: pt.x -= pt.x % SNAP_GRID_INTERVAL, y: pt.y -= pt.y % SNAP_GRID_INTERVAL}
}

function isDebug() {
  //  return true
  return false
}

function isExperimental() {
  return false
}

function stdGetHeader() {
  return {
    method: 'GET',
    headers: new Headers({'Content-Type': 'text/plain'})
  }
}

function fetchSrc(url) {
  return fetch(url, stdGetHeader()).then(response => {
    if (response.ok)
    return response.text()
  })
}

function fetchURL(url, init) {
  return new Promise((resolve, reject) => {
    fetch(url, init).then(response => {
      return response.json()
    }).then(json => { // response from server
      if (json.error) {
        //console.log(json)
        reject(json.error)
        return
      }
      resolve(json)
    }).catch( error => {
      //console.error(error)
      reject(error)
    })
  })
}

function loadCSS(url) {
  const link = document.createElement('link')
  link.href = url
  link.type = 'text/css'
  link.rel = 'stylesheet';
  (document.head || document.documentElement).appendChild(link)
}

function loadScript(url, aSync = false, callback) {
  let s = document.createElement('script')
  s.type = "text/javascript"
  s.src = url
  s.async = aSync;
  if (callback) {
    s.onload = callback()
  }
  (document.head || document.documentElement).appendChild(s)
}

function makeid(length) {
  let result           = ''
  let characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let charactersLength = characters.length
  for (let i = 0; i < length; i++ ) 
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
  return result
}

export { isExperimental, isDebug, wait, makeid, loadCSS, loadScript, fetchURL, fetchSrc }
