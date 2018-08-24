import {EventEmitter} from "events"
import Marker from "../view/marker"
/**
 * This class manages markers,pings,cursors of the different users
 */
export class MarkerManager  extends EventEmitter { 
   
  
  constructor(core,editor) {
        super()
        this._core = core
        this._editor = editor
    
    /**
     * markers contains all marks of the users: carets, avatars...
     * @type {Marker[]}
     */
    this.markers = {}
    
    /**
     * startimer A timer used for sending pings
     * @type {Timer}
     */
    this.startTimer = {}
   
    /**
    * @todo: make ping interval as option
    */
    this.startPing(5000)

    this.startEventListeners();
        
    }

  startEventListeners(){
      this._core.on('remoteCaretMoved', (range, origin) => {
        this.remoteCaretMoved(range, origin)
      })
      
      this._core.on('ping', (origin, pseudo) => {
        this.atPing(origin, pseudo)
      })
    }

    addMarker(id,isItMe=false,opts={}) {
        const defaultOptions = {
            lifeTime: 5 * 1000,
            range:{
              index: 0,
              length: 0},
            cursor: false,
            isItME: isItMe
          }

        const options = Object.assign(defaultOptions, opts);
        this.markers[id] = new Marker(id, options, this._editor)
        
        if (isItMe) {
            if (store.get('myId')) {
            this.markers[id].setPseudo(store.get('myId').pseudo)
            } else {
            store.set('myId', {
                id: id,
                pseudo: this.markers[id].pseudoName
            })
            }
        }
    }

    caretMoved(range){
        this._core.caretMoved(range)
    }


   /**
   * remoteCaretMoved At the reception of CARET position
   * @param  {[type]} range  [description]
   * @param  {[type]} origin [description]
   * @return {[type]}        [description]
   */
    remoteCaretMoved(range, origin) {
      if (!origin) return

      if (this.markers[origin]) {
        this.markers[origin].update(range, true) // to keep avatar
      } else {   
        this.addMarker(origin,false,{range,cursor:true})
        }
     }

   

        /**
         * startPing send periodically ping
         * @param  {[type]} interval [description]
         * @return {[type]}          [description]
         * @todo TODO: Make interval as global parameter
         */
        startPing(interval) {
          this._startTimer = setInterval(() => {
            let pseudo = "Anonymous"
            if (store.get('myId').pseudo) {
              pseudo = store.get('myId').pseudo;
            }
            this._core.sendPing(pseudo)
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
  atPing(origin, pseudo) {
    if (this.markers[origin]) {
      this.markers[origin].update(null, false) // to keep avatar
      this.markers[origin].setPseudo(pseudo)

    } else { // to create the avatar
      this.addMarker(origin,false)  
      this.markers[origin].setPseudo(pseudo)
    }
  }

}  