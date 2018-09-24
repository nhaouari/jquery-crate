import {TextEvent} from './TextEvent'
var debug = require('debug')('CRATE:Communication:TextManager:TitleManager')

export class TitleManager extends TextEvent {
    constructor(opts) {
        const EventName = opts.EventName || 'Title'
        super({EventName,...opts})
        
        this._textManager=opts.TextManager
        this.action = this.sendChangeTitle
    }
    /**
     * [sendChangeTitle Broadcast the new title]
     * @param  {[type]} title [description]
     * @return {[type]}       [description]
     */
    sendChangeTitle(title) {   
        console.log('Title sent ');
        this._document.name = title
        this.broadcast({
            id:this._document.uid,
            title: title
        })
    };

    /**
     * [changeTitle At the reception of MTitleChanged ]
     * @param  {[type]} title [description]
     * @return {[type]}       [description]
     */

    receive(msg) {
        this.emit('changeTitle', msg.title);
    };

}