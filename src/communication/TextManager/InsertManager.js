
import {TextEvent} from './TextEvent'

var debug = require('debug')('CRATE:Communication:TextManager:InsertManager')
export class InsertManager extends TextEvent {
    constructor(opts) {
        const name = opts.name || 'Insert'
        super({name,...opts})
        this._lastSentId = null
        this._textManager=opts.TextManager
        this.action=this.insert    
       
        this._pairs=[]
        this._pairs2=[]
    }


    /*!
     * \brief local insertion of a character inside the sequence structure. It
     * broadcasts the operation to the rest of the network.
     * \param character the character to insert in the sequence
     * \param index the index in the sequence to insert
     * \return the identifier freshly allocated
     */
    insert({packet, position}) {

        clearTimeout(this._timeout)
       
        var pair = this._sequence.insert(packet, position)
        
        this._document.causality.incrementFrom(this.getLSEQID({pair}))
 
        debug('local Insert', packet, ' Index ', position, 'pair',pair)
        
        this._pairs.push({
                    id: this._document.uid,
                    pair
                })
        this._pairs2.push({
            id: this._document.uid,
            pair
        })
        this._timeout=setTimeout(()=>{ 
            if (this.isItConvertibleToJSON(pair)) {
                this._lastSentId = this.broadcast({pairs:this._pairs}, this._lastSentId)
                
                this.setLastChangesTime()
            }
            this._pairs=[]
        },10)
    };

    
    /*!
     * \brief insertion of an element from a remote site. It emits 'remoteInsert' 
     * with the index of the element to insert, -1 if already existing.
     * \param ei the result of the remote insert operation
     * \param origin the origin id of the insert operation
     */
    receive( {pairs} ) {
        pairs.forEach(elem => {
         const pair= elem.pair
         const id = elem.id

        const index = this._sequence.applyInsert(pair, false);
        debug('remoteInsert','pair', pair, ' sequence Index ', index)
       
        if (index >= 0) {
            this.emit('remoteInsert', pair.elem, index);
            this.setLastChangesTime()
          if(!pair.antientropy) {
            const range = {
                index: index,
                length: 0
            }
            const msg = {
                range,
                id
            }
            console.log('cursor sent    ')
            this.Event('Caret', msg)
        }
        }
    });
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