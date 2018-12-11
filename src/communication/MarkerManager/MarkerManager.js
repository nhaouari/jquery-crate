/**
 * This class manages markers,pings,cursors of the different users
 */

import { PingManager } from './PingManager'
import { CaretManager } from './CaretManager'
import { MarkerEvent } from './MarkerEvent'
var debug = require('debug')('CRATE:Communication:MarkerManager:MarkerManager')
export class MarkerManager extends MarkerEvent {
  constructor(opts) {
    const EventName = opts.EventName || 'MarkerManager'
    super({ EventName, ...opts })
    this._pingManager = new PingManager({ ...opts })
    this._caretManger = new CaretManager({ ...opts })

    this._pingManager.on('Ping_received', msg => {
      this.emit('Ping_received', msg)
    })

    this._caretManger.on('Caret_received', msg => {
      this.emit('Caret_received', msg)
      debug('Caret_received', msg)
    })
  }

  /**
   * Set the current caret position
   * @param {*} range the current caret position
   */
  caretMoved(range) {
    this._caretManger.caretMoved(range)
  }

  close() {
    this._pingManager.close()

    this._caretManger.close()
  }
}
