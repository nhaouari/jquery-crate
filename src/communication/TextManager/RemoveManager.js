import {TextEvent} from './TextEvent'

var debug = require('debug')('CRATE:Communication:TextManager:RemoveManager')
export class RemoveManager extends TextEvent {
    constructor(opts) {

        const name = opts.name || 'Remove'
        super({name,...opts})
        this._lastSentId = null
        this._textManager=opts.TextManager
        this.action= this.remove
        this._pairs=[]
    }

    /*!
     * \brief local deletion of a character from the sequence structure. It 
     * broadcasts the operation to the rest of the network.
     * \param index the index of the element to remove
     * \return the identifier freshly removed
     */
    remove(index) { 
        debug("Remove",{index})  
       
        const reference = this.removeFromSequence(index)

        if(reference) {
        clearTimeout(this._timeout)
        this._sequence._c += 1;
        const lseqID= this.getLSEQID({id:reference})
        this._document.causality.incrementFrom(lseqID)

        this._pairs.push({
            id: this._document.uid, 
            reference
        })

        this._timeout=setTimeout(()=>{ 
            this._lastSentId = this.broadcast({pairs:this._pairs}, this._lastSentId)     
            this._pairs=[]
        },10)
        }
      //TODO:  this.setLastChangesTime()
      
       // return reference;
    };

    removeFromSequence(index){
       if(this._sequence.root.subCounter===2) {
           console.warn('sequence is empty')
           debugger
       } else if (index>=this._sequence.root.subCounter-2) {
           console.warn('error outofbounds ')
           debugger
       } else {

       const reference= this._sequence.remove(index)
       return reference
        }
       return null
 

    }
    /*!
     * \brief removal of an element from a remote site.  It emits 'remoteRemove'
     * with the index of the element to remove, -1 if does not exist
     * \param id the result of the remote insert operation
     * \param origin the origin id of the removal
     */
    receive({pairs}) {
        debug("receive remove",{pairs})
        pairs.forEach(elem => {
            const reference= elem.reference
            const id = elem.id
 
        const index = this._sequence.applyRemove(reference);
        this.emit('remoteRemove', index);

        if (index >= 0) {
            const range = {
                index: index-1  ,
                length: 0
            }
            const msg = {
                range,
                id
            }
            this.Event('Caret', msg)
        };
        
        this.setLastChangesTime()
    })
    }


}