import Marker from './marker';
import { Event } from './../Event';
var debug = require('debug')('CRATE:Communication:MarkerManager:MarkerEvent')


export class MarkerEvent extends Event {
    constructor(opts) {
      super(opts)
      this._markers = opts.markers
      this._communicationChannel =  this._document._behaviors_comm
      this._defaultOptions = {
        lifeTime: 5 * 1000,
        range: {
          index: 0,
          length: 0
        },
        cursor: false
      }
    }
  
    addMarker(id, isItMe = false, opts = {}) {
      const options = Object.assign({ ...this._defaultOptions,
        isItMe
      }, opts);
  
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
  
    removeMarker() {
  
    }
  }
  
  