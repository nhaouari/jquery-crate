import Marker from './marker';



export class MarkerEvent {
  constructor(opts) {
    this._markers = opts.markers
    this._document = opts.core
    this._editor = opts.editor
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


  constructor(core, editor) {

    const markers = {}
    const opts = {
      markers,
      core,
      editor
    }
    super(opts)

    this._document = core
    this._editor = editor

    /**
     * markers contains all marks of the users: carets, avatars...
     * @type {Marker[]}
     */

    this._markers = markers

    this._pingManager = new PingManger({ ...opts,
      period: 5000
    })

    this._caretManger = new CaretManger({ ...opts
    })


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
    super(opts)
    /**
     * startimer A timer used for sending pings
     * @type {Timer}
     */
    this._startTimer = {}

    /**
     * @todo: make ping interval as option
     */
    this.startPing(opts.period)

    this._document.on('Mping', (origin, pseudo) => {
      this.atPing(origin, pseudo)
    })
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
      this._communicationChannel.sendBroadcast({
          type: 'Mping',
          origin: id,
          pseudo: pseudo
      });

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
   * atPing at the reception of ping
   * @param  {[type]} origin [description]
   * @param  {[type]} pseudo [description]
   * @return {[type]}        [description]
   */
  atPing(msg) {
    const id = msg.origin
    const pseudo = msg.pseudo
 
  
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
    super(opts)
    this._document = opts.core
    this._defaultOptions = {
      lifeTime: 5 * 1000,
      cursor: true
    }

    this._document.on('MCaretMovedOperation', (range, origin) => {
      this.remoteCaretMoved(range, origin)
    })
  }

  /**
   * [caretMoved description]
   * @param  {[type]} range [description]
   * @return {[type]}       [description]
   */
  caretMoved(range) {
    this._communicationChannel.sendBroadcast(new MCaretMovedOperation(range, this._document.uid));
    return range;
  };



  /**
   * remoteCaretMoved At the reception of CARET position
   * @param  {[type]} range  [description]
   * @param  {[type]} origin [description]
   * @return {[type]}        [description]
   */
  remoteCaretMoved(range, origin) {
    if (!origin) return

    if (this.getMarker(origin)) {
      this.getMarker(origin).update(range, true) // to keep avatar
    } else {
      this.addMarker(origin, false, {
        range
      })
    }
  }

}


/*!
 * \brief object that represents the result of a caretMoved Operation
 * \param range the selection range
 * \param origin the origin of the selection
 */
export function MCaretMovedOperation(range, origin){
  this.type = "MCaretMovedOperation";
  this.range = range;
  this.origin = origin;
};
