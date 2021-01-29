'use strict';

const _serverURL = "https://fathomless-brushlands-18222.herokuapp.com"

// resolve({ code: "function..." })
// reject({ error : { code : integer, message : string } })

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

function stdGetHeader() {
  return {
    method: 'GET',
    headers: new Headers({'Content-Type': 'text/plain'})
  }
}

function getHash() {
  return fetchURL(_serverURL + '/code/hash', stdGetHeader())
}

function getCode(hash) {
  return fetchURL(_serverURL + '/code/' + hash, stdGetHeader())
}

function postCode(hash, codeObject) {
  return fetchURL(_serverURL + '/code/' + hash, {
    method: 'POST',
    body: JSON.stringify(codeObject),
    headers: new Headers({'Content-Type': 'application/json'})
  })
}

export { 
  getHash, 
  postCode,
  getCode,
}
