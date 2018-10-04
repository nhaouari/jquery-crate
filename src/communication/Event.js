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
        
        msg=this.setBatchCounter(msg)
        this.broadcastStream({...msg,stream:true})
        debug('broadcast buffer',msg)
       /* if(this.getSize(msg)>=20000) {
            this.broadcastStream({...msg,stream:true})
        } else {
            this.sendBroadcast({...msg,stream:false})
        }*/
        this._buffer=[]
   },1)
    
    }

    setBatchCounter(msg){
        if(msg.pairs){
        msg.pairs.forEach((pair)=>{
            const causalId = this._communicationChannel.broadcast._causality.increment()  
            pair.causalId=causalId  
        })

        return msg
        } else {
            console.error("sending empty msg")
            
        }
    }

    haveBeenReceived(element){
        return (this._communicationChannel.broadcast._shouldStopPropagation(element))
    }
    getSize(msg) {
        const string = JSON.stringify(msg)
        return string.length
    }
    sendBroadcast(msg,isReady= null){
          //TODO: const messageId=  this._communicationChannel.sendBroadcast({type: this.getType(),...msg},null,lastSentMsgId)  
    // this brodcast will not change the id the causal broadcast
    //const id = this._document._communication.causality.vector.local
        
        if(this._name==="Remove") {isReady=msg.pairs[0].isReady}
        
        debug("Send Broadcast ",{msg,isReady})
        
        this._document.lastSentMsgId =  this._communicationChannel.broadcast.send({...msg,isReady},msg.pairs[0].causalId,isReady,false)  
        return this._document.lastSentMsgId
    }

    broadcastStream(msg) {
            const stream= this._communicationChannel.streamBroadcast()
            this.sendStream(stream,msg)
            this.setLastChangesTime()
    };

    unicast(id,message){
        const msg = this.getPacket(message)
        if(this.getSize(msg)>=20000) {
            this.unicastStream(id,{...msg,stream:true})
        } else {
            this.sendUnicast(id,{...msg,stream:false})
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
        msg=this.setBatchCounter({pairs:[msg]})
        this._communicationChannel.broadcast._source.getNeighbours().forEach(neighbourId =>this.unicast(neighbourId, msg)) 
    }

    receiveBuffer({pairs,stream} ) {
        debug("receiveBuffer",this.getType(),pairs.length,pairs)

        // remove the first element since it has passed by _receive 

        if(pairs.length>=1) {
            if(stream) {
                this.passMsgByBroadcast(pairs[0]) 
            }else {
                this.receive(pairs[0])
            }  

            pairs.shift()
           
            pairs.forEach(elem => {        
                this.passMsgByBroadcast(elem)     
            }) 
    
        } else {
            console.error("Receiving empty message")
        }

     }
       
     
     passMsgByBroadcast(elem){
        //no causal id : it is an internal event, we use our own id
        const causalId=elem.pair&& elem.pair.causalId || elem.causalId || this._communicationChannel.broadcast._causality.local.e
        debugger
        const broadcast=  this._communicationChannel.broadcast
        // stream false to avoid to have a loop in the case of a stream

        const packet=this.getPacket({pairs:[elem],stream:false}) 
        const isReady=elem.isReady
        const message=this.getBroadcastMessageFormat(broadcast._protocol,causalId,isReady,packet)
       
        broadcast._receive(causalId.e+'-O',message)
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


getBroadcastMessageFormat (protocol, id, isReady, payload) {
        return {
          protocol,
          id:id,
          isReady,
          payload
        }
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
  