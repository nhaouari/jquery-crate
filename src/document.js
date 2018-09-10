import {
  Foglet,
  communication
} from "foglet-core"
import {
  EventEmitter
} from "events"

import LSEQTree from "LSEQTree"
import {
  Communication
} from './communication/Communication'


var debug = require('debug')('crate:crate-document')

export default class doc extends EventEmitter {
  constructor(options, foglet) {
    super();
    this._foglet = foglet
    this._options = options

    this._lastChanges = new Date()

    this.name = options.name;
    this.date = new Date(); // (TODO) change

    //User ID
    this.user = options.user;
    this.uid = this.user.id;

    /**
     * connect to the session of the document
     */

  }
  async init() {
    let options = this._options

    if (options.display) {
      const {
        View
      } = await import( /* webpackMode: "eager", webpackChunkName: "Crate-View" */ "./View.js")
      this._view = new View(options, this, options.containerID);
      this.emit("ViewIsReady");
    }

    if (options.foglet) {
      await this._foglet.connection(options.foglet);
    } else {
      this._foglet.share();
      await this._foglet.connection();
    }



    console.log("application connected!");


    this._data_comm = new communication(
      this._foglet.overlay().network,
      "_data_comm"
    );
    this._behaviors_comm = new communication(
      this._foglet.overlay().network,
      "_behaviors_comm"
    );

    this.sequence = new LSEQTree(options.editingSessionID);
    // #1B if it is imported from an existing object, initialize it with these

    this.loadCommunicationModules()
    // #2 grant fast access

    this.broadcast = this._data_comm.broadcast;
    this.broadcastCaret = this._behaviors_comm.broadcast;
    this.rps = this._data_comm.network.rps;

    this.causality = this.broadcast._causality;
    this.signalingOptions = options.signalingOptions;


    if (options.importFromJSON) {
      this.loadFromJSON(options.importFromJSON);
    }

    this.routersInit()

    if (options.display) {
      this._view.init()
    }

    this._foglet.emit("connected");
    this.emit("connected");


  }

  routersInit() {

    this._behaviors_comm.onBroadcast((id, message) => {
      debug('document', '._behaviors_comm', 'Message received', message, 'from', id)
      this.emit(message.event, message)
      
    })

    this._data_comm.onBroadcast((id, message) => {
      debug('document', '._data_comm', 'Message received', message, 'from', id)
      this.emit(message.event, message)

    })

    this._data_comm.onUnicast((id, message) => {
      debug('document', '._data_comm unicast', 'Message received', message, 'from', id)
      this.emit(message.event, message)
    })

    this._data_comm.broadcast.on('antiEntropy', (id, remoteVVwE, localVVwE) => {
      debug('antiEntropy',{id, remoteVVwE, localVVwE})
      this.emit('antiEntropy_Event', {
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
        this.emit(packet.event, packet)
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
        this.emit(packet.event, packet)
      })    
     
    })
  }


0  /**
  0 * setLastChangesTime set the last time of changes
   */

  setLastChangesTime() {
    const d = new Date()
    const n = d.getTime()
    this._lastChanges = n
  }


  /*!
   * \brief create the core from an existing object
   * \param object the object to initialize the core model of crate containing a 
   * sequence and causality tracking metadata
   */
  loadFromJSON(object) {
    this.broadcast._causality = this.broadcast._causality.constructor.fromJSON(object.causality);
    const local = this.broadcast._causality.local;

    this._behaviors_comm.broadcast._causality.local.e = local.e;

    this.sequence.fromJSON(object.sequence);
    this.sequence._s = local.e;
    this.sequence._c = local.v;

  };

  loadCommunicationModules() {
    const defaultOpts = {
      document: this,
      editor: this._view._editor,
      PingPeriod: 5000,
      AntiEntropyPeriod: 5000
    }
    this._communication = new Communication(defaultOpts)
    this._communication.init()

    this._communication.markerManager.addMarker(this.uid, true)
  }

  /**
   * saveDocument save the document in local storage
   * @return {[type]} [description]
   */
  saveDocument() {
    try {
    const timeNow = new Date().getTime()
    const title = jQuery(`#${this._editorContainerID} #title`).text()
    const document = {
      date: timeNow,
      title: title,
      delta: this.viewEditor.editor.delta,
      sequence: this.sequence,
      causality: this.causality,
      name: this.name,
      webRTCOptions: this.webRTCOptions,
      markers: {},
      signalingOptions: this.signalingOptions
    }
    store.set("CRATE2-" + this.signalingOptions.session, document)
    return true
  } 
  catch(error) {
    console.error(error);
    return false
  }
  }


}