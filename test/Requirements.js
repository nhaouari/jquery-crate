/**
 * This class for checking the requirement of starting CRATE .e.i  the signaling service, ICS(Availability,Function )
 */

import fetch from 'node-fetch'
import wrtc from 'wrtc'
var debug = require('debug')('CRATE:test:RequirementsTester')

export class RequirementsTester {
  constructor() {}

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
    /* server = {
      url: 'turn:172.16.9.236:3478?transport=udp',
      username: 'username',
      credential: 'password'
    }*/
    console.log(server)
    return new Promise(function(resolve, reject) {
      var promiseResolved = false

      var RTCPeerConnection = wrtc.RTCPeerConnection
      var RTCSessionDescription = wrtc.RTCSessionDescription

      server.urls = [server.url]
      let opts = {
        iceServers: [server]
      }

      let pc = new RTCPeerConnection(opts)

      debug('options:' + opts)
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
