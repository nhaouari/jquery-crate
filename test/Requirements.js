/**
 * This class for checking the requirement of starting CRATE .e.i  the signaling service, ICS(Availability,Function )
 */

import fetch from 'node-fetch'
import wrtc from 'wrtc'
var debug = require('debug')('CRATE:test:RequirementsTester')

export class RequirementsTester {
  constructor() {
    this.candidates = []
  }

  async getWorkingICEs(ICEs) {
    let workingICEs = 0

    for (const ICE of ICEs) {
      await this.checkStunTurn(ICE).then(result => {
        if (result) {
          workingICEs++
        }
      })
    }

    return workingICEs
  }

  async checkStunTurn(server, timeout = 2000) {
    /*server = {
      url: 'turn:172.16.9.236:3478?transport=udp',
      username: 'username',
      credential: 'password'
    }*/
    /*server = {
      url: 'stun:172.16.9.1:3478'
    }*/

    return new Promise((resolve, reject) => {
      var promiseResolved = false

      var RTCPeerConnection = wrtc.RTCPeerConnection
      var RTCSessionDescription = wrtc.RTCSessionDescription

      server.urls = [server.url]
      let opts = {
        iceServers: [server]
      }

      let pc = new RTCPeerConnection(opts)

      debug('options:' + opts)

      const obj = this
      pc.onicecandidate = candidate => {
        if (candidate.candidate) {
          obj.candidates.push(obj.parseCandidate(candidate.candidate.candidate))
        } else {
          const result = obj.getFinalResult(server)
          promiseResolved = true
          resolve(result)
        }
      }

      pc.gatheringStateChange = () => {
        if (pc.iceGatheringState === 'complete') {
          const result = obj.getFinalResult(server)
          resolve(result)
        }
      }

      setTimeout(() => {
        if (promiseResolved) return
        const result = obj.getFinalResult(server)
        resolve(result)
      }, timeout)

      pc.createDataChannel('test')

      pc.createOffer().then(function(e) {
        pc.setLocalDescription(new RTCSessionDescription(e))
      })
    })
  }

  parseCandidate(text) {
    const candidateStr = 'candidate:'
    const pos = text.indexOf(candidateStr) + candidateStr.length
    let [
      foundation,
      component,
      protocol,
      priority,
      address,
      port,
      ,
      type
    ] = text.substr(pos).split(' ')
    return {
      component: component,
      type: type,
      foundation: foundation,
      protocol: protocol,
      address: address,
      port: port,
      priority: priority
    }
  }

  // Try to determine authentication failures and unreachable TURN
  // servers by using heuristics on the candidate types gathered.
  getFinalResult(server) {
    // get the candidates types (host, srflx, relay)
    const types = this.candidates.map(cand => cand.type)

    if (server.urls[0].indexOf('turn:') === 0) {
      if (types.indexOf('relay') !== -1) {
        return true
      }
    }

    return false
  }
  async checkSignalingServer(url) {
    const response = await fetch(url)
    if (response.status !== 200) {
      debug('Error Code: ' + response.status)
      return false
    } else {
      return true
    }
  }

  async getICS(url) {
    const response = await fetch(url)
    if (response.status !== 200) {
      debug('Error Code: ' + response.status)
      return []
    } else {
      const jsonICEs = await response.json()
      const ICEs = jsonICEs.ice
      return ICEs
    }
  }
}
