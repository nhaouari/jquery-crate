import Document from './Document.js'
import { Foglet } from 'foglet-core'
import { GUID } from './helpers/randomID'
import store from 'store'
import { EventEmitter } from 'events'
import fetch from 'node-fetch'
export default class DocumentBuilder extends EventEmitter {
  /**
   * @param {*} options the different options of the document.
   * @example
   */

  constructor(defaultOptions, crate) {
    super()
    this._defaultOptions = defaultOptions
    this._crate = crate
  }

  /**
  * build the document and add it to the list of the documents
  @description here we considered that one session contains one document.  when we created another document in the same page is in another session, if it is not action's opened it will received the changes. 
  @todo add the possibility of adding other document in the same session, so all the changes will taken into consideration even if the open document is different. 
   this is will be an optional choice for the users because it could create a high overhead in the network, 
   for example in the case of a large number of linked document any change in any document will be broadcasted to all the users. 
  */

  async buildDocument(
    sessionId,
    sessionIndex,
    foglet = null,
    specialOpts = {}
  ) {
    let defaultOptions = { ...this._defaultOptions, ...specialOpts }
    let options = this.prepareOptions(sessionId, defaultOptions)

    if (!foglet) {
      foglet = this.getNewFoglet(options)
    }
    options._foglet = foglet
    const doc = new Document(options, sessionIndex, this._crate)
    return doc
  }

  /**
   * set the different options for the created document
   */
   prepareOptions(sessionId, options) {
    this.setSignalingOptions(options, sessionId)
    this.getLocalStorageData(options)
    this.setUser(options)
    this.setDocumentTitle(options)
    this.setTemporarySessionID(options)
    this.setFogletOptions(options)
    this.setDocumentActivityTimeout(options)
    return options
  }

  /**
   * set Temporary Session ID to be able to open the document in different tabs for the same user.
   * @description foglet is based on the id of the user, it will not work in the case of having two users with same id, this why we have add to the user id
   * a random part to consider each tab as separate user in foglet but it will be considered the same user in CRATE.
   */

  setTemporarySessionID(options) {
    this._editingSessionID = options.user.id + '-' + GUID()
    options.editingSessionID = this._editingSessionID
  }

  /**
   * set Document Title
   */
  setDocumentTitle(options) {
    let name = 'Untitled document'
    if (options.importFromJSON && options.importFromJSON.title) {
      name = options.importFromJSON.title
    }

    options.name = name
  }

  /**
   * set the user information
   * @description the default user is random if it is not stored in local storage of the browser.
   */
  setUser(options) {
    let uid = this.GUID()
    const randomId = {
      id: uid,
      pseudo: 'Anonymous'
    }
    let localStorageUser = {}
    if (store.get('config')) {
      const config = store.get('config')
      localStorageUser = { id: config.id, pseudo: config.pseudo }
    }

    options.user = Object.assign(randomId, localStorageUser)
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

  /**
   * set Signaling Options this includes the session ID and the signaling server
   *
   */
  setSignalingOptions(options, sessionId) {
    // Storage Server
    const defaultOptions = {
      address: 'https://carteserver.herokuapp.com',
      session: sessionId
    }

    options.signalingOptions = Object.assign(
      defaultOptions,
      options.signalingOptions
    )

    if (!options.storageServer) {
      options.storageServer = ''
    }
  }

  /**
   * load Local data if they exist
   */
  getLocalStorageData(options) {
    const sessionID = options.signalingOptions.session
    if (store.get('CRATE2-' + sessionID)) {
      options.importFromJSON = store.get('CRATE2-' + sessionID)
      options.signalingOptions = options.importFromJSON.signalingOptions
    }
  }

  /**
   * set foglet options
   * @param {*} options {editingSessionID,signalingOptions:{address,session}}
   */
  setFogletOptions(options) {
    const userId = options.editingSessionID
    const room = options.signalingOptions.session
    const address = options.signalingOptions.address
    const webrtc = options.webRTCOptions
    const rps = options.rps
    const fogletOptions = {
      id: userId,
      verbose: true, // want some logs ? switch to false otherwise
      rps: this.getRpsOptions(room, address, webrtc, rps)
    }

    options = Object.assign(options, {
      fogletOptions
    })
  }

  /**
   * @param {*} room  this is the id of the session, in crate it is the id of the document
   * @param {*} signalingServer the signaling server of foglet
   * @param {*} webrtc {config:{iceServers:[],trickle: bool}}
   * @param {*} rps rps might be cyclon (maxPeers) or spray-wrtc (a,b)
   */
  getRpsOptions(room, signalingServer, webrtc, rps = {}) {
    const defaultRps = {
      type: 'cyclon', //spray-wrtc,cyclon
      options: {
        maxPeers: 10,
        a: 1,
        b: 5,
        protocol: room, // foglet running on the protocol foglet-example, defined for spray-wrtc
        webrtc: webrtc,
        timeout: 10 * 1000, // spray-wrtc timeout before definitively close a WebRTC connection.
        pendingTimeout: 5 * 1000,
        delta: 120 * 1000, // spray-wrtc shuffle interval
        signaling: {
          address: signalingServer,
          room: room
        } // signaling options
      }
    }

    const rpsOptions = Object.assign(defaultRps, rps)
    return rpsOptions
  }

  getNewFoglet(options) {
    return new Foglet(options.fogletOptions)
  }

  setDocumentActivityTimeout(options) {
    const documentActivityTimeout =
      options.documentActivityTimeout || 120 * 1000

    Object.assign(options, {
      documentActivityTimeout
    })
  }
  /**
   * Function that generates random ID.
   * @returns random string
   */
  GUID() {
    return GUID()
  }
}
