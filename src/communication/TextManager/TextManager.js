
import {TextEvent} from './TextEvent'
import {AntiEntropyManager} from './AntiEntropyManager'
import {InsertManager}  from './InsertManager'
import {RemoveManager}  from './RemoveManager'
import {TitleManager}  from './TitleManager'

var debug = require('debug')('CRATE:Communication:TextManager:TextManager')

export class TextManager extends TextEvent {
    constructor(opts) {
        const name = opts.name || 'TextManager'
        super({name,...opts})

        this._insertManager = new InsertManager({TextManager:this,...opts})
        this._removeManager = new RemoveManager({TextManager:this,...opts})
        this._titleManager = new TitleManager({TextManager:this,...opts})
        this._antiEntropyManager = new AntiEntropyManager({TextManager:this,...opts}) 
        this._antiEntropyManager.start()
        
        this.on('sendChangeTitle',()=> {
            this._titleManager.sendChangeTitle()
            
        })

        this.on('setLastChangesTime',()=> {
            this._titleManager.sendChangeTitle()
            
        })


    }

   
}
