import {PingManger} from './PingManager'
import {CaretManger} from './CaretManager'
import {MarkerEvent} from './MarkerEvent';
var debug = require('debug')('CRATE:Communication:MarkerManager:MarkerManager')
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
  
    close() {
      this._pingManager.close()
  
      this._caretManger.close()
    }
  }
  