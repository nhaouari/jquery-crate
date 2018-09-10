import {EventEmitter} from "events"
import { Foglet } from 'foglet-core';
var debug = require('debug')('crate:Event')
export class Event extends EventEmitter {
    constructor(opts) {
      super()
      this._document = opts.document
      this._editor = opts.editor

      this._communicationChannel = this._document._data_comm
      this._name=opts.name

      this._document.on(this.getType(), (msg) => {
        debug("receive",this.getType(),msg)
        this.receive(msg)
      })

      this._document.on(`${this._name}_Action_Event`, (msg) => {
        debug(`on "${this._name}_Action_Event"`);
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

    getPacket(message){
        return {event: this.getType(),...message}
    }
    broadcast(message,lastSentMsgId=null){
    const msg = this.getPacket(message)
    if(this.getSize(msg)>=20000) {
        this.broadcastStream(msg)
    } else {
        this.sendBroadcast(msg)
    }
    }

    haveBeenReceived(element){
       return (this._communicationChannel.broadcast._shouldStopPropagation(element))
    }
    getSize(msg) {
        const string = JSON.stringify(msg)
        return string.length
    }
    sendBroadcast(msg){
          //TODO: const messageId=  this._communicationChannel.sendBroadcast({type: this.getType(),...msg},null,lastSentMsgId)  
    const messageId=  this._communicationChannel.sendBroadcast(msg)  
    return messageId
    }

    broadcastStream(msg) {
            console.log('message sent on stream');
            const stream= this._communicationChannel.streamBroadcast()
            const msgString= JSON.stringify(msg)
            const chunks= this.chunkSubstr(msgString,10000)
            chunks.forEach(chunk => {
                stream.write(chunk)
            });

            stream.end()

            this.setLastChangesTime()
    };

    sendUnicast(id,message){
        const msg = this.getPacket(message)
        this._communicationChannel.sendUnicast(id,msg) 
    }

    sendLocalBroadcast(msg){ 
        this._document.broadcast._source.getNeighbours().forEach(neighbourId =>this.sendUnicast(neighbourId, msg)) 
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
    chunkSubstr(str, size) {
        const numChunks = Math.ceil(str.length / size)
        const chunks = new Array(numChunks)
      
        for (let i = 0, o = 0; i < numChunks; ++i, o += size) {
          chunks[i] = str.substr(o, size)
        }
      
        return chunks
      }
}
  