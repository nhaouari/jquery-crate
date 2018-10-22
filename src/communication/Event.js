import {EventEmitter} from "events"

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

    broadcast(message,causal=true){
        clearTimeout(this._timeoutBuffer)
        
        
        this._buffer.push({...message,causalId:this.getCausalId()})
        
        this._timeoutBuffer=setTimeout(()=>{
            let msg = this.getPacket({pairs:this._buffer})
            this.broadcastStream({...msg,stream:causal})
            debug('broadcast message',msg)
            this._buffer=[]
         },1)
    
    }

    getCausalId(){
        const causalId = this._communicationChannel.broadcast._causality.increment() 
        return causalId 
    }

    


    broadcastStream(msg) {
            const stream= this._communicationChannel.streamBroadcast()
            this.sendStream(stream,msg)
            this.setLastChangesTime()
    };

    unicast(id,message,causal=false,causalId=null){
      if(!causalId) {
        causalId=this.getCausalId()
        }
        const msg =this.getPacket({pairs:[{...message,causalId}]}) 
        id=this.formatId(id)
        this.unicastStream(id,{...msg,stream:causal})  
    }

    formatId(id){
        debug('Id before formatiting', id)           
        let cleanId= this.cleanId(id)
        cleanId=cleanId+'-I'
        debug('Id after formatiting', cleanId)  
        return cleanId 
    }

    cleanId(id){
           
        const fixedPart= id.slice(0,id.length-4)
        let varPart=id.slice(id.length-4,id.length)
       
        varPart=this.removeFromString('-I',varPart)
        varPart=this.removeFromString('-O',varPart)
         return fixedPart+varPart
    }

    removeFromString(StringtoBeremove,s) {
        const indexOfLast=s.lastIndexOf(StringtoBeremove)

        if(indexOfLast>=0) {
            s= s.slice(0,indexOfLast)+s.slice(indexOfLast+StringtoBeremove.length)
        }
        return s
    }

    unicastStream(id,msg){
        debug('message sent on stream unicast');
        const stream= this._communicationChannel.streamUnicast(id)
        this.sendStream(stream,msg)
        this.setLastChangesTime()
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
        //msg=this.setBatchCounter({pairs:[msg]})
        this._communicationChannel.broadcast._source.getNeighbours().forEach(neighbourId =>this.unicast(neighbourId, msg,false,this.getCausalId())) 
    }

       

    receiveBuffer({pairs,stream,originID} ) {
        debug("receiveBuffer",this.getType(),pairs.length,pairs)

        // remove the first element since it has passed by _receive 

        if(pairs.length>=1) { 
            pairs.forEach(elem => {
                if(stream) {
                    this.passMsgByBroadcast(elem,originID) 
                }else {
                    this.receive(elem)
                }       
            }) 
    
        } else {
            console.warn("Receiving empty message")
        }

     }
       
     
    passMsgByBroadcast(elem,originID){
        const causalId=elem.pair&& elem.pair.causalId || elem.causalId

        debug('passMsgByBroadcast:', {elem,originID,causalId})

        // stream false to avoid to have a loop in the case of a stream
        const packet=this.getPacket({pairs:[elem],stream:false}) 
        const isReady=elem.isReady

        const broadcast=  this._communicationChannel.broadcast
        const message=this.getBroadcastMessageFormat(broadcast._protocol,causalId,isReady,packet)

        if(!(message.id&&message.id.e)){
            debugger
        }

        broadcast._receive(causalId+'-O',message)
     }

    sendBroadcast(msg,isReady= null){
        debug("Send Broadcast ",{msg,isReady})
        this._document.lastSentMsgId =  this._communicationChannel.broadcast.send({...msg,isReady},null,isReady,false)  
        return this._document.lastSentMsgId
    }


    sendUnicast(id,msg){
        this._communicationChannel.sendUnicast(id,msg) 
    }


    
    haveBeenReceived(element){
        return (this._communicationChannel.broadcast._shouldStopPropagation(element))
    }
    getSize(msg) {
        const string = JSON.stringify(msg)
        return string.length
    }
    receive(msg) {
        
        debug("default receive",msg)
    }

    action(msg) {
        console.error('action not defined',this._name)
    }

    sendAction(name,args){
        debug('sendAction',args)
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
      close(){
          
      }
    }