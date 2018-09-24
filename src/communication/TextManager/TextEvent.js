import { Event } from './../Event';

var debug = require('debug')('CRATE:Communication:TextManager:TextEvent')

export class TextEvent extends Event {
    constructor(opts) {
        super(opts)
        this._communicationChannel = this._document._communication._data_comm
        this._sequence = this._document.sequence       
    }
    getLSEQID({pair,id}){
       let LSEQID = id
       if (pair) LSEQID=pair.id

       
        const idForCausal = {e: LSEQID._s[LSEQID._s.length-1], c: LSEQID._c[LSEQID._c.length-1]};

        return idForCausal
    }
}

