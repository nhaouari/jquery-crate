import {TextEvent} from './TextEvent'
var debug = require('debug')('CRATE:Communication:TextManager:TitleManager')

export class TitleManager extends TextEvent {
    constructor(opts) {
        const EventName = opts.EventName || 'Title'
        super({EventName,...opts})
        
        this._textManager=opts.TextManager
        this._communicationChannel = this._document._communication._behaviors_comm
        this.action = this.sendChangeTitle
    }
    /**
     * [sendChangeTitle Broadcast the new title]
     * @param  {[type]} title [description]
     * @return {[type]}       [description]
     */
    sendChangeTitle(title,id=null) {

        debug('Title sent ',title);
        this._document.name = title
        const msg = {
            id:this._document.uid,
            title: title
        }

        if(!id) {
            this.broadcast(msg)
        } else {
            debug('send title in unicast')
            this.unicast(id,msg)
        }
    };


    /**
     * [changeTitle At the reception of MTitleChanged ]
     * @param  {[type]} title [description]
     * @return {[type]}       [description]
     */

    receive(msg) {
        this.emit('changeTitle', msg.title);
        this._document.name =  msg.title
    };

}