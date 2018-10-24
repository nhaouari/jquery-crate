const wrtc = require('wrtc')

async function checkStunTurn(server, timeout = 2000) {
  return new Promise(function(resolve, reject) {
    var promiseResolved = false

    var RTCPeerConnection = wrtc.RTCPeerConnection
    var RTCSessionDescription = wrtc.RTCSessionDescription

    server.urls = [server.url]
    let opts = {
      iceServers: [server]
    }

    let pc = new RTCPeerConnection(opts)

    pc.onicecandidate = function(candidate) {
      if (candidate.candidate) {
        if (candidate.candidate.candidate.indexOf('typ relay') > -1) {
          // sometimes sdp contains the ice candidates...
          promiseResolved = true
          resolve(true)
        }
      }
    }

    setTimeout(() => {
      if (promiseResolved) return
      resolve(false)
      promiseResolved = true
    }, timeout)

    pc.createDataChannel('test')

    pc.createOffer().then(function(e) {
      pc.setLocalDescription(new RTCSessionDescription(e))
    })
  })
}

const server = {
  url: '172.16.9.236:3478',
  username: 'admin',
  credential: 'admin'
}

checkStunTurn(server).then(result => {
  if (result) {
    console.log('It works!')
  }
})
