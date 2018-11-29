import Marker from './marker'
import { EventEmitter } from 'events'
var debug = require('debug')('CRATE:View:MarkerViewManager')
/**
 * This class manages markers,pings,cursors of the different users
 */
export class MarkerViewManager extends EventEmitter {
  constructor(MarkerManager, editor) {
    super()
    /**
     * markers contains all marks of the users: carets, avatars...
     * @type {Marker[]}
     */
    this._markerManager = MarkerManager
    this._editor = editor
    this._markers = {}

    this.addMarker(this._markerManager._document.uid, true)
    this._markerManager.on('Ping_received', msg => {
      this.receivePing(msg)
    })

    this._markerManager.on('Caret_received', msg => {
      this.receiveCaret(msg)
    })

    this._defaultOptions = { lifeTime: 5000 }
  }

  addMarker(id, isItMe = false, opts = {}) {
    const options = Object.assign(
      {
        ...this._defaultOptions,
        isItMe
      },
      opts
    )

    if (!this._markers.hasOwnProperty(id)) {
      this._markers[id] = new Marker(id, options, this._editor)

      if (isItMe) {
        if (store.get('myId')) {
          this._markers[id].setPseudo(store.get('myId').pseudo)
        } else {
          store.set('myId', {
            id: id,
            pseudo: this._markers[id].pseudoName
          })
        }
      }
    }
    return this._markers[id]
  }

  getMarker(id) {
    return this._markers[id]
  }

  receivePing({ id, pseudo }) {
    debug('Ping Received', id, pseudo)
    if (this.getMarker(id)) {
      this.getMarker(id)
        .update(null, false) // to keep avatar
        .setPseudo(pseudo)
    } else {
      // to create the avatar
      this.addMarker(id, false).setPseudo(pseudo)
    }
  }
  /**
   *  At the reception of CARET position
   * @param  {[type]} range  [description]
   * @param  {[type]} id [description]
   * @return {[type]}        [description]
   */

  receiveCaret({ range, id }) {
    if (!id) return

    if (this.getMarker(id)) {
      this.getMarker(id).update(range, true) // to keep avatar
    } else {
      this.addMarker(id, false, {
        range
      })
    }
  }

  removeMarker() {}
}
