import { MarkerManager } from './MarkerManager/MarkerManager'

import { TextManager } from './TextManager/TextManager'

import { Foglet, communication } from 'foglet-core'

import { EventEmitter } from 'events'

var debug = require('debug')('CRATE:Communication')

export class Communication extends EventEmitter {
  constructor(opts) {
    super()
    this._options = opts
    this._document = this._options.document
  }

  async initModules(opts = {}) {
    this.causality = this._data_comm.broadcast._causality
    this.markerManager = new MarkerManager(this._options)
    this.textManager = new TextManager(this._options)
    await this.waitAntientropy()
  }

  async initConnection() {
    // get ICEs

    this._document.setMessageState('Connecting: getting ICEs ...')
    await this.setWebRTCOptions(this._options)

    this._document.setMessageState('Connecting: establishing connection ...')
    //connection between foglets
    if (this._options.foglet) {
      this._foglet = this._options.foglet
    } else {
      //Connection using the signaling server
      this._foglet = this.getNewFoglet(this._options)
      this._options._foglet = this._foglet
      this._foglet.share()
    }
    try {
      await this.fogletConnection()
      this._document.setMessageState('Connecting: connection established...')
    } catch (error) {
      this._document.setMessageState(
        'Connecting: Could not establish connection!'
      )
    }

    this.setCommunicationChannels()
    this._foglet.emit('connected')
    debug('application connected!')
  }

  async fogletConnection(maxRetry = 3) {
    const connect = async retry => {
      try {
        await this._foglet.connection(this._options.foglet)
      } catch (err) {
        if (retry > 0) {
          console.error(err)
          await connect(retry - 1)
        } else {
          throw new Error('Could not establish connection!', err)
        }
      }
    }

    await connect(maxRetry)
  }

  async waitAntientropy() {
    return new Promise((resolve, reject) => {
      const neighborhoodSize = this._foglet.getNeighbours(Infinity).length
      if (neighborhoodSize === 0) {
        resolve()
      } else {
        this._document.setMessageState('Loading Content...')
        this.on('startReceivingStream', () => {})

        this.on('endReceivingStream', () => {
          resolve()
        })
      }
    })
  }
  //TODO: Make this global to use the same server for all the documents

  /**
   * set WebRTCOptions
   * @description  set the default options of ice Servers and replace them by the ice server if it is possible. if it run in node js use wrtc.
   */
  async setWebRTCOptions(options) {
    if (!options.foglet) {
      const defaultICE = [
        {
          url: options.stun,
          urls: options.stun
        }
      ]

      let twilioICEs = await this.getICEs(options)

      const iceServers = Object.assign(defaultICE, twilioICEs)

      options.webRTCOptions = {
        trickle: true,
        config: {
          iceServers
        }
      }

      if (options.wrtc) {
        options.webRTCOptions.wrtc = options.wrtc
      }
    }
  }

  /**
   * Get ICES
   * @description  Twillo is used to get list of ICEs servers, the script that generates the list of the servers is in the configuration "https://carteserver.herokuapp.com/ice"
   * @return arrays of ICE objects {url, urls, username, credential}
   */
  async getICEs(options) {
    return new Promise((resolve, reject) => {
      const url = options.ICEsURL || 'https://carteserver.herokuapp.com/ice'
      if (url) {
        fetch(url)
          .then(resp => resp.json()) // Transform the data into json
          .then(addresses => {
            let ICEs = addresses.ice.map(ice => {
              ice.urls = ice.url
              return ice
            })

            resolve(ICEs)
          })
      } else {
        reject('no ICEsURL in url')
      }
    })
  }

  getNewFoglet(options) {
    return new Foglet(options.fogletOptions)
  }

  setCommunicationChannels() {
    this._data_comm = new communication(
      this._foglet.overlay().network,
      '_data_comm'
    )
    this.routeMsgToEvents(this._data_comm)

    this._behaviors_comm = new communication(
      this._foglet.overlay().network,
      '_behaviors_comm'
    )
    this.routeMsgToEvents(this._behaviors_comm)
  }

  routeMsgToEvents(communicatioChannel) {
    communicatioChannel.onBroadcast((id, message) => {
      this._document.emit(message.event, message)
    })

    communicatioChannel.onUnicast((id, message) => {
      this._document.emit(message.event, message)
    })

    communicatioChannel.onStreamBroadcast((id, message) => {
      this.receiveStream(id, message)
    })

    communicatioChannel.onStreamUnicast((id, message) => {
      this.receiveStream(id, message)
    })
  }

  receiveStream(id, stream) {
    debug('document', 'receiving a stream from ', id)
    this.emit('startReceivingStream')

    let content = ''
    let first = true
    let numberOfChunks = 1
    let receivedChunks = 0
    let percentage = 0
    stream.on('data', data => {
      if (first) {
        numberOfChunks = data.numberOfChunks
        debug('numberOfChunks === ', numberOfChunks)
        first = false
      } else {
        receivedChunks++

        const percentageNow = Math.floor(
          (receivedChunks * 100) / numberOfChunks
        )
        if (percentageNow > percentage) {
          percentage = percentageNow
          debug('percentage === ', percentage)
          this._document.setMessageState('Loading Content ' + percentage + '%')
        }

        content += data
      }
    })

    stream.on('end', () => {
      const packet = JSON.parse(content)
      content = ''
      debug('document', 'Message received', packet.pairs, 'from', id)
      this.receive(packet.event, packet, id)
      this.emit('endReceivingStream')
    })
  }

  receive(event, packet, originID) {
    debug('communication receive ', event, packet)
    this._document.emit(event, { ...packet, originID })
  }

  close() {
    if (this.markerManager) this.markerManager.close()
    if (this.textManager) this.textManager.close()

    this._foglet.unshare()
    this._foglet._networkManager._rps.network._rps.disconnect()

    setTimeout(() => {
      this._foglet = null
    }, 2000)
  }
}
