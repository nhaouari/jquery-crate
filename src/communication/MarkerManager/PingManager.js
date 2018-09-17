import {MarkerEvent} from './MarkerEvent';

var debug = require('debug')('CRATE:Communication:MarkerManager:PingManger')

export class PingManger extends MarkerEvent {
    constructor(opts) {
  
      const name = opts.name || 'Ping'
      super({name,...opts})
  
      /**
       * startimer A timer used for sending pings
       * @type {Timer}
       */
      this._startTimer = {}
  
  
      this._pingPeriod= opts.PingPeriod
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
        const id=this._document.uid
        const pseudo = this.getMarker(id).pseudoName
        this.broadcast({id,pseudo});
  
      }, interval)
    }
  
    /**
     * stopPing stopPing
     * @todo  implement this function
     * @return {[type]} [description]
     */
    stopPing() {
      clearInterval(this._startTimer);
    }
  
    /**
     * receive at the reception of ping
     * @param  {[type]} origin [description]
     * @param  {[type]} pseudo [description]
     * @return {[type]}        [description]
     */
    receive({id,pseudo} ) {
      debug('Ping Received',id,pseudo)
  
      if (this.getMarker(id)) {
        this.getMarker(id)
          .update(null, false) // to keep avatar
          .setPseudo(pseudo)
  
      } else { // to create the avatar
        this.addMarker(id, false)
          .setPseudo(pseudo)
      }
    }

    close(){
      this.stopPing()
    }
  
  }
  
  