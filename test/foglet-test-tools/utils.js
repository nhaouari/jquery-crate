/* Testing utilities */
const uuid = require('uuid/v4')
const SimplePeerMoc = require('./simple-peer-moc-before.js')
const buildFog = (Foglet, size, overlays = [], ice = []) => {
  // eslint-disable-next-line no-debugger
  const fog = []
  // creates a random seed for romm & protocol
  const id = uuid()
  for (let i = 0; i < size; i++) {
    const options = {
      rps: {
        type: 'spray-wrtc', //cyclon,spray-wrtc
        options: {
          protocol: `test-protocol-generated-${id}`,
          webrtc: {
            // add WebRTC options
            trickle: true, // enable trickle (divide offers in multiple small offers sent by pieces)
            iceServers: ice // define iceServers in non local instance
          },
          timeout: 3600 * 1000, // spray-wrtc timeout before definitively close a WebRTC connection.
          delta: 3600 * 1000, // spray-wrtc shuffle interval
          maxPeers: 10,
          a: 1,
          b: 5,
          socketClass: SimplePeerMoc,
          signaling: {
            address: 'http://localhost:8000/',
            room: `test-room-generated-${id}`,
            origins: '*:*'
          }
        }
      },
      overlays
    }
    options.overlays.forEach(overlay => {
      overlay.options.socketClass = SimplePeerMoc
    })
    fog.push(new Foglet(options))
  }
  return fog
}

const signalingConnect = peers => {
  return Promise.all(
    peers.map(peer => {
      peer.share()
      return peer.connection()
    })
  )
    .then(() => {
      return Promise.resolve()
    })
    .catch(e => {
      return Promise.reject(e)
    })
}

const clearFoglets = peers => {
  return new Promise((resolve, reject) => {
    try {
      resolve(
        peers.map(p => {
          p._networkManager._rps._network.rps.disconnect()
          p._networkManager._overlays.forEach(overlay => {
            console.log(overlay)
            overlay._network._rps.disconnect()
          })
          return undefined
        })
      )
    } catch (e) {
      reject(e)
    }
  })
}

const pathConnect = async (peers, timeout, duplex = false) => {
  const connectedPairs = []
  await peers[0].connection(peers[1])

  connectedPairs.push(0)
  connectedPairs.push(1)
  for (let peerIndex = 2; peerIndex < peers.length; peerIndex++) {
    await peers[peerIndex].connection(
      peers[Math.floor(Math.random() * (connectedPairs.length - 1))]
    )
    connectedPairs.push(peerIndex)
  }
}

const overlayConnect = (index, timeout, ...peers) => {
  return peers.reduce((prev, peer) => {
    return prev.then(() => {
      peer.share(index)
      return peer.connection(null, index).then((...res) => {
        setTimeout(() => {
          return Promise.resolve(...res)
        }, timeout)
      })
    })
  }, Promise.resolve())
}

const doneAfter = (limit, done) => {
  let cpt = 0
  return () => {
    cpt++
    if (cpt >= limit) {
      done()
    }
  }
}

module.exports = {
  buildFog,
  pathConnect,
  signalingConnect,
  overlayConnect,
  clearFoglets,
  doneAfter
}
