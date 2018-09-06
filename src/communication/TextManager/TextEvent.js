import { Event } from './../Event';

var debug = require('debug')('CRATE:Communication:TextManager:TextEvent')

export class TextEvent extends Event {
    constructor(opts) {
        super(opts)
        this._communicationChannel = this._document._data_comm
        this._sequence = this._document.sequence       
    }
}

