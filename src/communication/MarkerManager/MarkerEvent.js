import { Event } from './../Event'
var debug = require('debug')('CRATE:Communication:MarkerManager:MarkerEvent')
export class MarkerEvent extends Event {
  constructor(opts) {
    super(opts)
    this._communicationChannel = this._document._communication._behaviors_comm
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
    this.emit('addMarker', id, isItMe, opts)
  }

  removeMarker() {}
}
