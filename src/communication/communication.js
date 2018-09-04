import {EventEmitter} from "events"
import VVwE from "version-vector-with-exceptions"
import LSEQTree from "LSEQTree"
import {Foglet,communication} from "foglet-core"
import {MInsertOperation,MAEInsertOperation,MRemoveOperation, MCaretMovedOperation } from "./messages";
import {MAntiEntropyRequest,MAntiEntropyResponse,MBroadcast} from "./messages";

var debug = require('debug')('crate:crate-core')
/*!
 * \brief link together all components of the model of the CRATE editor
 * \param id the unique site identifier
 * \param options the webrtc specific options 
 */


export default class Communication extends EventEmitter {

    constructor(id, options, data_comm) {
        super()
        // EventEmitter.call(this);

        this.options = options

        /**
         * this variables are used to manage the sleeping mode in nodejs, to detect if the user is no longer editing for a period of changesTimeOut. 
         */
        this.setLastChangesTime()
        this._timer = setInterval(() => this.checkIfOutdated(), 1000);
      
      
        this._changesTimeOut = options.changesTimeOut || 10 * 1000; //default timeout is 10m

        this._communication = data_comm

        this.broadcast = this._communication.broadcast
        // Default channel for antientropy operations : insert, remove, changeTitle

        // No-anti-entropy channel for the operations that dose not need antientropy : ping, cartet position

        // listen for incoming broadcast

        this.id = id
        this.sequence = new LSEQTree(this.options.editingSessionID);   
    }
       
       

    /**
     * checkIfOutdated check if the user is outdated and if it is the case remove its caret and avatar 
     */
    checkIfOutdated() {
        var timeNow = new Date().getTime();
        var dff = (timeNow - this._lastChanges);
        // if  cursor  is outdated 
        if ((timeNow - this._lastChanges) >= this._changesTimeOut) {
            clearInterval(this._timer);
            this.emit('outdated')
            return true
        } else {
            // jQuery(`#${this._editorContainerID} #${this.origin}`).css('opacity', (1 - ((timeNow - this.time) / this.lifeTime)));
            return false
        }

    }

   
    
    

   

   


 


   
}
