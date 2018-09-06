import {MarkerEvent} from './MarkerEvent'
var debug = require('debug')('CRATE:Communication:MarkerManager:CaretManger')

export class  CaretManger extends MarkerEvent {
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
  
  