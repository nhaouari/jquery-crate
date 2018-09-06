import {TextEvent} from './TextEvent'

var debug = require('debug')('CRATE:Communication:TextManager:RemoveManager')
export class RemoveManager extends TextEvent {
    constructor(opts) {

        const name = opts.name || 'Remove'
        super({name,...opts})
        this._lastSentId = null
        this._textManager=opts.TextManager
        this.action= this.remove
    }

    /*!
     * \brief local deletion of a character from the sequence structure. It 
     * broadcasts the operation to the rest of the network.
     * \param index the index of the element to remove
     * \return the identifier freshly removed
     */
    remove(index) {
        var reference = this._sequence.remove(index);
        this._sequence._c += 1;
        this._lastSentId = this.broadcast({
            id: this._document.uid,
            reference
        }, this._lastSentId)
      
      //TODO:  this.setLastChangesTime()
      
        return reference;
    };


    /*!
     * \brief removal of an element from a remote site.  It emits 'remoteRemove'
     * with the index of the element to remove, -1 if does not exist
     * \param id the result of the remote insert operation
     * \param origin the origin id of the removal
     */
    receive({id,reference}) {
    
        const index = this._sequence.applyRemove(reference);
        this.emit('remoteRemove', index);

        if (index >= 0) {
            const range = {
                index: index - 1,
                length: 0
            }
            const msg = {
                range,
                id
            }
            this.Event('Caret', msg)
        };

        this.setLastChangesTime()
    };



}