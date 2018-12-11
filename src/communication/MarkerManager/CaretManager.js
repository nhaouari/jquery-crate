import { MarkerEvent } from './MarkerEvent'
var debug = require('debug')('CRATE:Communication:MarkerManager:CaretManger')
export class CaretManager extends MarkerEvent {
  constructor(opts) {
    const EventName = opts.EventName || 'Caret'
    super({ EventName, ...opts })

    this._defaultOptions = {
      lifeTime: 5 * 1000,
      cursor: true
    }
  }

  /**
   * [caretMoved description]
   * @param  {[type]} range [description]
   * @return {[type]}       [description]
   */
  caretMoved(range) {
    this.broadcast({ range, id: this._document.uid })
    return range
  }

  /**
   *  At the reception of CARET position
   * @param  {[type]} range  [description]
   * @param  {[type]} id [description]
   * @return {[type]}        [description]
   */
  receive({ range, id }) {
    this.emit('Caret_received', { range, id })
  }
}
