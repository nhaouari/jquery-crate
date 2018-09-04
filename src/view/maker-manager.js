import Marker from './marker';
import { Event } from './Event';


var debug = require('debug')('crate:marker-manager')

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


/**
 * This class manages markers,pings,cursors of the different users
 */
export class MarkerManager extends MarkerEvent {
  constructor(opts) {
    const markers = {}
    opts.markers=markers
    const name = opts.name || 'MarkerManager'
    super({name,...opts})
    /**
     * markers contains all marks of the users: carets, avatars...
     * @type {Marker[]}
     */

    this._markers = markers

    this._pingManager = new PingManger({ ...opts})

    this._caretManger = new CaretManger({ ...opts})


  }

  /**
   * Set the current caret position
   * @param {*} range the current caret position 
   */
  caretMoved(range){
    this._caretManger.caretMoved(range)
  }

}




class PingManger extends MarkerEvent {
  constructor(opts) {

    const name = opts.name || 'Ping'
    super({name,...opts})

    /**
     * startimer A timer used for sending pings
     * @type {Timer}
     */
    this._startTimer = {}

    /**
     * @todo: make ping interval as option
     */
    this.startPing(opts.period)

    
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

}


class CaretManger extends MarkerEvent {
  constructor(opts) {
    const name = opts.name || 'Caret'
    super({name,...opts})
  
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
    this.broadcast({range, id: this._document.uid});
    return range;
  };

  /**
   *  At the reception of CARET position
   * @param  {[type]} range  [description]
   * @param  {[type]} id [description]
   * @return {[type]}        [description]
   */
  receive(msg) {
    
    const {range,id}= msg
   
    if (!id) return

    if (this.getMarker(id)) {
      this.getMarker(id).update(range, true) // to keep avatar
    } else {
      this.addMarker(id, false, {
        range
      })
    }
  }

}

