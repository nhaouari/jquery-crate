import { MarkerEvent } from './MarkerEvent'
var debug = require('debug')('CRATE:Communication:MarkerManager:PingManger')
export class PingManager extends MarkerEvent {
  constructor(opts) {
    const EventName = opts.EventName || 'Ping'
    super({ EventName, ...opts })

    /**
     * startimer A timer used for sending pings
     * @type {Timer}
     */
    this._startTimer = {}

    this._pingPeriod = opts.PingPeriod
    /**
     * @todo: make ping interval as option
     */
    this.startPing(this._pingPeriod)
  }

  /**
   * startPing send periodically ping
   * @param  {[type]} interval [description]
   * @return {[type]}          [description]
   * @todo TODO: Make interval as global parameter
   */
  startPing(interval) {
    this._startTimer = setInterval(() => {
      this.broadcast(this._document.user)
    }, interval)
  }

  /**
   * stopPing stopPing
   * @todo  implement this function
   * @return {[type]} [description]
   */
  stopPing() {
    clearInterval(this._startTimer)
  }

  /**
   * receive at the reception of ping
   * @param  {[type]} origin [description]
   * @param  {[type]} pseudo [description]
   * @return {[type]}        [description]
   */
  receive({ id, pseudo }) {
    this.emit('Ping_received', { id, pseudo })
  }

  close() {
    this.stopPing()
  }
}
