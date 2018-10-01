import {TextEvent} from './TextEvent'

var debug = require('debug')('CRATE:Communication:TextManager:RemoveManager')
export class RemoveManager extends TextEvent {
    constructor(opts) {

        const EventName = opts.EventName || 'Remove'
        super({EventName,...opts})
        
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
        const lseqNode= this._sequence._get(index+1)
        const causalId=this.getCausalID(lseqNode)
        const reference = this.removeFromSequence(index)
        debug("Remove",{index,reference})  
        if(reference) {
            this._sequence._c += 1;
            this.broadcast({
                id: this._document.uid, 
                causalId,
                reference
            })     
        }
      this.setLastChangesTime()
    };

    removeFromSequence(index){
       if(this._sequence.root.subCounter===2) {
           console.warn('remove from sequence is empty')
       } else if (index>=this._sequence.root.subCounter-2) {
           console.warn('Lseq, index is out Of Bounds')
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
    receive({id,reference}) {
        debug("receive remove",{id,reference})
        const index = this._sequence.applyRemove(reference);
       // this.emit('remoteRemove', index);

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
    }


}