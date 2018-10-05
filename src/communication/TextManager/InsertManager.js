
import {TextEvent} from './TextEvent'

var debug = require('debug')('CRATE:Communication:TextManager:InsertManager')
export class InsertManager extends TextEvent {
    constructor(opts) {
        const EventName = opts.EventName || 'Insert'
        super({EventName,...opts})  
        this._textManager=opts.TextManager
        this.action=this.insert    
        this._lastSentId=null
    }


    /*!
     * \brief local insertion of a character inside the sequence structure. It
     * broadcasts the operation to the rest of the network.
     * \param character the character to insert in the sequence
     * \param index the index in the sequence to insert
     * \return the identifier freshly allocated
     */
    insert({packet, position,source='user'}) {

        if(this.isItConvertibleToJSON(packet)) {
            var pair = this.insertLSEQ(packet, position) 
            const causalID= this.getLSEQID({pair})
            this._document.delta.ops.splice(position,0,{insert:packet.content,attributes:packet.attributes})               
            debug('local Insert',{packet,causalID,position,source})
            
            if (source==='user'){
            {
                this.broadcast({id: this._document.uid,
                            pair})
                        
                this.setLastChangesTime()

                }
        };

    }
    }

    
    /**
     * Insert a value at the targeted index.
     * @param {Object} element The element to insert, e.g. a character if the
     * sequence is a string.
     * @param {Number} index The position in the array.
     * @return {Object} {_e: element of Object type, _i: Identifier}
     */
    insertLSEQ (element, index) {
        const pei = this._sequence._get(index), // #1a previous bound
              qei = this._sequence._get(index+1); // #1b next bound

         // #2a incrementing the local counter
         this._sequence._c += 1;
        // #2b generating the id inbetween the bounds
        const id =  this._sequence.alloc(pei, qei);

        // #3 add it to the structure and return value
        const pair = {elem: {id,...element}, id: id};

        this._sequence.applyInsert(pair);
        return pair;
    };

    getIDBeforeInsert(sequence){
        const pei = sequence._get(index), // #1a previous bound
        qei = sequence._get(index+1); // #1b next bound
          // #2a incrementing the local counter
        this._c += 1;
            // #2b generating the id inbetween the bounds
        const id = sequence.alloc(pei, qei);
        return id
    }
    
    /*!
     * \brief insertion of an element from a remote site. It emits 'remoteInsert' 
     * with the index of the element to insert, -1 if already existing.
     * \param ei the result of the remote insert operation
     * \param origin the origin id of the insert operation
     */
    receive( {id,pair,antientropy=false} ) {
      
  
        const index = this._sequence.applyInsert(pair, false);
        debug('remoteInsert','pair', pair, ' sequence Index ', index)
        this._document.delta.ops.splice(index-1,0,{insert:pair.elem.content,attributes:pair.elem.attributes})  
        if (index >= 0) {
          //  this.emit('remoteInsert', pair.elem, index);
            this.setLastChangesTime()
          if(!antientropy) {
            const range = {
                index: index,
                length: 0
            }
            const msg = {
                range,
                id,
                stream:false,
            }
            this.Event('Caret', msg)
        }
        }
   
    }

    /**
     * Validate that the message is convertable to JSON
     * @param {*} msg 
     */
    isItConvertibleToJSON(msg) {
        try {
            const test = JSON.parse(JSON.stringify(msg))
            return true
        } catch (e) {
            console.error('The object cannot be convert to json ', e, insertMsg)
            return false
        }
    }


}