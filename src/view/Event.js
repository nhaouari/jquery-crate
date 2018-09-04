import {EventEmitter} from "events"

export class Event extends EventEmitter {
    constructor(opts) {
      super()
      this._document = opts.document
      this._editor = opts.editor

      this._communicationChannel = this._document._data_comm
      this._name=opts.name

      this._document.on(this.getType(), (msg) => {
        console.log("receive",this.getType(),msg)
        this.receive(msg)
      })


      console.log(`on "${this._name}_Action_Event"`);
      this._document.on(`${this._name}_Action_Event`, (msg) => {
        this.action(msg)
      })
  }
    getEncapsulatedMessage(msg){   

    } 

    setLastChangesTime(){
        this._document.setLastChangesTime()
    }
    
    getType(){
        if(this._name) {
        return `${this._name}_Event`
        } else {
            console.error("Event without name")
        }
    }

    broadcast(msg,lastSentMsgId=null){
    //TODO: const messageId=  this._communicationChannel.sendBroadcast({type: this.getType(),...msg},null,lastSentMsgId)  
    const messageId=  this._communicationChannel.sendBroadcast({type: this.getType(),...msg})  
    return messageId
    }

    receive(msg) {

        
        console.log("receive",msg)
    }

    action(msg) {
        console.error('action not defined',this._name)
    }

    sendAction(name,args){
        this.Event(`${name}_Action`,args)
    }

    Event(name,args) {

        console.log('Event: ',`${name}_Event`,args);
        this._document.emit(`${name}_Event`,args);
    }
}
  