import {MarkerManager} from "./MarkerManager/MarkerManager"

import {TextManager} from "./TextManager/TextManager"

import {
    Foglet,
    communication
} from "foglet-core"


var debug = require('debug')('CRATE:Communication')

  export class Communication {
    constructor(opts) {
        this._options=opts
        this._document = this._options.document
        this._foglet=this._options._foglet
    }

   initModules(opts={}){
        this.causality = this._data_comm.broadcast._causality
        this.markerManager = new MarkerManager(this._options)
        this.textManager= new TextManager(this._options)
    }

   async initConnection(){
      if (this._options.foglet) {
        await this._foglet.connection(this._options.foglet);
      } else {
        this._foglet.share();
        await this._foglet.connection();
      }

      this.setCommunicationChannels()

      this._foglet.emit("connected");
      debug("application connected!");
    }

    
    setCommunicationChannels(){
      this._data_comm = new communication(
        this._foglet.overlay().network,
        "_data_comm"
      )
      this.routeMsgToEvents(this._data_comm)

      this._behaviors_comm = new communication(
        this._foglet.overlay().network,
        "_behaviors_comm"
      )
      this.routeMsgToEvents(this._behaviors_comm)
    }



    routeMsgToEvents(communicatioChannel) {
        communicatioChannel.onBroadcast((id, message) => {
          this._document.emit(message.event, message)
    
        })
    
        communicatioChannel.onUnicast((id, message) => {
        
          this._document.emit(message.event, message)
        })
  
        communicatioChannel.onStreamBroadcast((id, message) => {
          this.receiveStream(id,message)  
        })
    
       
        communicatioChannel.onStreamUnicast((id, message) => {
         this.receiveStream(id,message)
        })
      }

    receiveStream(id,stream){
      let content=''
      stream.on('data', data => { content += data;})
      stream.on('end', () => {
        const packet= JSON.parse(content)  
        content = ''
        debug('document', 'Message received', packet, 'from', id)
        this.receive(packet.event, packet)
      })    
     
    }  

    receive(event,packet){
      debug('communication receive ',event,packet)
      this._document.emit(event, packet)
    }
    close() {
        this.markerManager.close()
        this.textManager.close()
    }

}