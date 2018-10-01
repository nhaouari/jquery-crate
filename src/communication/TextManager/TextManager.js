
import {TextEvent} from './TextEvent'
import {AntiEntropyManager} from './AntiEntropyManager'
import {InsertManager}  from './InsertManager'
import {RemoveManager}  from './RemoveManager'
import {TitleManager}  from './TitleManager'

var debug = require('debug')('CRATE:Communication:TextManager:TextManager')

export class TextManager extends TextEvent {
    constructor(opts) {
        const EventName = opts.EventName || 'TextManager'
        super({EventName,...opts})

        this._insertManager = new InsertManager({TextManager:this,...opts})
        this._removeManager = new RemoveManager({TextManager:this,...opts})
        this._titleManager = new TitleManager({TextManager:this,...opts})
        this._antiEntropyManager = new AntiEntropyManager({TextManager:this,...opts}) 
        this._antiEntropyManager.sendAntiEntropyRequest()


        this._removeBuffer=new Map()
       //this._antiEntropyManager.start()

        this.on('sendChangeTitle',()=> {
            this._titleManager.sendChangeTitle()
            
        })

        this.on('setLastChangesTime',()=> {
            this._titleManager.sendChangeTitle()
            
        })


    }

    addIdToRemoveBuffer(id){
        this._removeBuffer.set(this.hashCode(JSON.stringify(id)),id)
    }

    IsItInRemoveBuffer(id) {
        return this._removeBuffer.has(JSON.stringify(id))
    }

    removeFromRemoveBuffer(id) {
    this._removeBuffer.delete(JSON.stringify(id))
    }

    close(){
        
        this._insertManager.close()
        this._removeManager.close() 
        this._titleManager.close()
        this._antiEntropyManager.close()
    }

   
}
