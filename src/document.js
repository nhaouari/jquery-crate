import {Foglet,communication} from "foglet-core"
import {EventEmitter} from "events"

import LSEQTree from "LSEQTree"
var debug = require('debug')('crate:crate-document')

export default class doc extends EventEmitter {
  constructor(options, foglet) {
    super();
    this._foglet = foglet
    this._options=options
    
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


    if (options.foglet) {
      await this._foglet.connection(options.foglet);
    } else {
      this._foglet.share();
      await this._foglet.connection();
    }


    
      console.log("application connected!");
      

      this._data_comm = new communication(
        this._foglet.overlay().network,
        "anti-entropy"
      );
      this._behaviors_comm = new communication(
        this._foglet.overlay().network,
        "No-anti-entropy"
      );
     

      // #1B if it is imported from an existing object, initialize it with these
      if (options.importFromJSON) {
        this.core.init(options.importFromJSON);
      }

   

      // #2 grant fast access
      this.sequence = new LSEQTree(options.editingSessionID);   
      this.broadcast = this._data_comm.broadcast;
      this.broadcastCaret = this._behaviors_comm.broadcast;
      this.rps = this._data_comm.network.rps;

      this.causality = this.broadcast._causality;
      this.signalingOptions = options.signalingOptions;
      console.log('options',options)
     
      this.routersInit()

      if (options.display) {
        const {View} = await import(/* webpackMode: "eager", webpackChunkName: "Crate-View" */ "./View.js")
        this._view = new View(options, this, options.containerID);
        this.emit("ViewIsReady");
      }

      this._foglet.emit("connected");
      this.emit("connected");


}

routersInit() {
  
  this._behaviors_comm.onBroadcast((id, message) => {
      this.emit(message.type,message)
      debug('document','._behaviors_comm','Message received',message,'from', id)
    })

  this._data_comm.onBroadcast((id, message) => {
    debug('document','._data_comm','Message received',message,'from', id)
    this.emit(message.type,message)
     
})


this._data_comm.broadcast.on('antiEntropy', (id, remoteVVwE, localVVwE) => {
    console.log('document','.antiEntropy','Message received',{id, remoteVVwE, localVVwE},'from', id)
    this.emit('antiEntropy_Event',{id, remoteVVwEJSON:remoteVVwE, localVVwE})
  }) 

}


    /**
     * setLastChangesTime set the last time of changes
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
 /*TODO:init(object) {
      // import the sequence and version vector, yet it keeps the identifier of
      // this instance of the core.

      // this.broadcast = Object.assign(new VVwE(this.id),object.causality);

      // var local = this.broadcast.causality.local;
      this._data_comm.broadcast._causality = this.broadcast._causality.constructor.fromJSON(object.causality);


      // this.broadcast.causality.local = local;
      var local = this.broadcast._causality.local;
      // this.broadcast.causality.vector.insert(this.broadcast.causality.local);

      this.No_antientropy.broadcast._causality.local.e = local.e;

      this.sequence.fromJSON(object.sequence);
      this.sequence._s = local.e;
      this.sequence._c = local.v;
  };
*/

}

