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
      this.InitRouters()

      this._foglet.emit("connected");
      console.log("application connected!");
    }

    
    setCommunicationChannels(){
      this._data_comm = new communication(
        this._foglet.overlay().network,
        "_data_comm"
      );
      this._behaviors_comm = new communication(
        this._foglet.overlay().network,
        "_behaviors_comm"
      );
    }


    InitRouters() {

        this._behaviors_comm.onBroadcast((id, message) => {
          debug('document', '._behaviors_comm', 'Message received', message, 'from', id)
          this._document.emit(message.event, message)
          
        })
    
        this._data_comm.onBroadcast((id, message) => {
          debug('document', '._data_comm', 'Message received', message, 'from', id)
          this._document.emit(message.event, message)
    
        })
    
    
        this._data_comm.onUnicast((id, message) => {
          debug('document', '._data_comm unicast', 'Message received', message, 'from', id)
          this._document.emit(message.event, message)
        })
    
        this._data_comm.broadcast.on('antiEntropy', (id, remoteVVwE, localVVwE) => {
          debug('antiEntropy',{id, remoteVVwE, localVVwE})
          this._document.emit('antiEntropy_Event', {
            id,
            remoteVVwEJSON: remoteVVwE,
            localVVwE
          })
        })
    
        //TODO:consider receiving many images
    
        let content=''
        this._data_comm.onStreamBroadcast((id, message) => {
          message.on('data', data => { content += data})
          message.on('end', () => {
            const packet= JSON.parse(content)  
            content = ''
            debug('document', '._data_comm', 'Message received', packet, 'from', id)
            this._document.emit(packet.event, packet)
          })    
         
        })
    
        let content2=''
        this._data_comm.onStreamUnicast((id, message) => {
          message.on('data', data => { content2 += data;})
          message.on('end', () => {
            const packet= JSON.parse(content2)  
            content2 = ''
            console.log('data received');
            debug('document', '._data_comm', 'Message received', packet, 'from', id)
            this._document.emit(packet.event, packet)
          })    
         
        })
      }

    close() {
        this.markerManager.close()
        this.textManager.close()
    }

}