import {EventEmitter} from "events"
import { Foglet } from 'foglet-core';
var debug = require('debug')('CRATE:Event')
export class Event extends EventEmitter {
    constructor(opts) {
      super()
      this._buffer = []
      this._document = opts.document
      this._communicationChannel = this._document._communication._data_comm
      this._name=opts.EventName
      this._document.on(this.getType(), (msg) => {

        if(msg&&msg.pairs){
        this.receiveBuffer(msg)
        } else if(msg) {
        this.receiveBuffer({pairs:[msg]})
        } else {
            console.error('Receive Event without data',this.getType() )
        }
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

    broadcast(message){
    clearTimeout(this._timeoutBuffer)

    this._buffer.push(message)
    
   
    this._timeoutBuffer=setTimeout(()=>{
        let msg = this.getPacket({pairs:this._buffer})
        
        msg=this.setBatchCounter(this._communicationChannel.broadcast._causality.local.e,msg)
    
        debug('broadcast buffer',msg)
        if(this.getSize(msg)>=20000) {
            this.broadcastStream(msg)
        } else {
            this.sendBroadcast(msg)
        }
        this._buffer=[]
   },1)
    
    }

    setBatchCounter(id,msg){
        const start = this._communicationChannel.broadcast._causality.local.v
        const counter = start+msg.pairs.length-1
        const e = id

        for (let c = start; c <= counter; c++) {
            const causalId= {e,c}
            msg.pairs[c-start].causalId=causalId
            this._communicationChannel.broadcast._causality.incrementFrom(causalId)  
        }
        return msg
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
    // this brodcast will not change the id the causal broadcast
    //const id = this._document._communication.causality.vector.local

    let isReady= null
    
    if(this._name==="Remove") {isReady=msg.pairs[0].causalId}
    
    debug("Send Broadcast ",{msg,isReady})
    
    this._document.lastSentMsgId =  this._communicationChannel.sendBroadcast({...msg,isReady},null,isReady)  
    return this._document.lastSentMsgId
    }

    broadcastStream(msg) {
        debug('message sent on stream');
            const stream= this._communicationChannel.streamBroadcast()
            this.sendStream(stream,msg)
            this.setLastChangesTime()
    };

    unicast(id,message){
        const msg = this.getPacket(message)
        if(this.getSize(msg)>=20000) {
            this.unicastStream(id,msg)
        } else {
            this.sendUnicast(id,msg)
        }
       
    }

    unicastStream(id,msg){
        debug('message sent on stream');
        const stream= this._communicationChannel.streamUnicast(id)
        this.sendStream(stream,msg)
        this.setLastChangesTime()
    }

    sendUnicast(id,msg){
        this._communicationChannel.sendUnicast(id,msg) 
    }

    sendStream(stream,msg,maxSize=10000) {
        const msgString= JSON.stringify(msg)
        const chunks= this.chunkSubstr(msgString,maxSize)
        chunks.forEach(chunk => {
            stream.write(chunk)
        });

        stream.end()
    }

    sendLocalBroadcast(msg){ 
        msg=this.setBatchCounter(this._communicationChannel.broadcast._causality.local.e,{pairs:[msg]})
        this._communicationChannel.broadcast._source.getNeighbours().forEach(neighbourId =>this.unicast(neighbourId, msg)) 
    }

    receiveBuffer({pairs} ) {
        debug("receiveBuffer",this.getType(),pairs.length,pairs)

        pairs.forEach(elem => {    
            const causalId=elem.pair&& elem.pair.causalId || elem.causalId
            
            if(causalId){
            this._communicationChannel.broadcast._causality.incrementFrom(causalId)
            this._communicationChannel.broadcast._reviewBuffer()
            }
            

            this.receive(elem)
           
        }) 
     }
         

    receive(msg) {
        
        debug("default receive",msg)
    }

    action(msg) {
        console.error('action not defined',this._name)
    }

    sendAction(name,args){
        this.Event(`${name}_Action`,args)
    }


    Event(name,args) {

        debug('Event: ',`${name}_Event`,args);
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
      getCausalID(lseqNode){
        const causalId= {e:lseqNode.t.s,c:lseqNode.t.c} 
        debug("getCausalID",{lseqNode,causalId} )
        return causalId
    }

 /**
 * Returns a hash code for a string.
 * (Compatible to Java's String.hashCode())
 *
 * The hash code for a string object is computed as
 *     s[0]*31^(n-1) + s[1]*31^(n-2) + ... + s[n-1]
 * using number arithmetic, where s[i] is the i th character
 * of the given string, n is the length of the string,
 * and ^ indicates exponentiation.
 * (The hash value of the empty string is zero.)
 *  @link https://gist.github.com/hyamamoto/fd435505d29ebfa3d9716fd2be8d42f0
 * @param {string} s a string
 * @return {number} a hash code value for the given string.
 */
hashCode(s) {
    var h = 0, l = s.length, i = 0;
    if ( l > 0 )
      while (i < l)
        h = (h << 5) - h + s.charCodeAt(i++) | 0;
    return h;
  };
      close(){

    }
}
  