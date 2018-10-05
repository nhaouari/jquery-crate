
import {
  EventEmitter
} from "events"

import LSEQTree from "LSEQTree"
import {
  Communication
} from './communication/Communication'


var debug = require('debug')('CRATE:Document')

export default class doc extends EventEmitter {
  constructor(options) {
    super();

    this._options = options
    this._foglet = this._options._foglet

    this._lastChanges = new Date()

    this.name = options.name
    this.date = new Date()
    //User ID
    this.user = options.user
    this.uid = this.user.id

    this.lastSentMsgId=null
    /**
     * connect to the session of the document
     */
  }
  async init() {
    let options = this._options

    this._communication= new Communication({document:this,...this._options})
   
    await this._communication.initConnection()

    if (options.display) { 
      const {View} = await import( /* webpackMode: "eager", webpackChunkName: "Crate-View" */ "./View.js")
      this._view = new View(options, this, options.containerID);
    }


    

    this.sequence = new LSEQTree(options.editingSessionID)
    this.delta= {ops:[]}

    /* TODO:Think about the creation of modules without view */
        this._communication.initModules()

    // #1B if it is imported from an existing object, initialize it with these
  
   
    // #2 grant fast access

    this.broadcast = this._communication._data_comm.broadcast;
    this.broadcastCaret = this._communication._behaviors_comm.broadcast;
    this.rps = this._communication._data_comm.network.rps;
    this.causality =  this._communication.causality
    this.signalingOptions = options.signalingOptions;
    
    if (options.importFromJSON) {
      this.loadFromJSON(options.importFromJSON);
    } 
    
    if (options.display) {
      this._view.init()
    } 

    this.emit("connected");
  }


0  /**
  0 * setLastChangesTime set the last time of changes
   */

  setLastChangesTime() {
    const d = new Date()
    const n = d.getTime()
    this._lastChanges = n
    this.refreshDocument(this.sequence)
   // this.testAntientropy()
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

  

  /**
   * saveDocument save the document in local storage
   * @return {[type]} [description]
   */
  saveDocument() {
    try {
    const timeNow = new Date().getTime()
    const document = {
      date: timeNow,
      title:  this.name,
      delta: this._view._editor.viewEditor.editor.delta,
      sequence: this.sequence,
      causality: this.causality,
      name: this.name,
      webRTCOptions: this.webRTCOptions,
      markers: {},
      signalingOptions: this.signalingOptions
    }
    store.set("CRATE2-" + this.signalingOptions.session, document)

    debug('Document saved => ',document)
    return true
  } 
  catch(error) {
    console.error(error);
    return false
  }
  }



  refreshDocument(sequence,WhoWriteIt=false){
    clearTimeout(this.refreshDocumentTimeout)
    
    this.refreshDocumentTimeout=setTimeout(()=>{
      let range=this._view._editor.viewEditor.getSelection()

      this._view._editor.viewEditor.setContents(this.delta,'silent')
      this._view._editor.viewEditor.setSelection(range,'silent')
      this._view._editor.updateCommentsLinks()    
      
    },10)
  
  }

  getDeltaFromSequence(WhoWriteIt=false){
    let LSEQNodes=this.getLSEQNodes()
    let ops=[]
    
    LSEQNodes.forEach((node)=>{
      let op ={insert:node.e.content,attributes:node.e.attributes}
      if(WhoWriteIt){
        const id = node.t.s 
        op.attributes.color=session.default.Marker.getColor(id)
      }
      ops.push(op)
    })

    const length = ops.length

    if(length>=2&&ops[length-1].insert==="\n"&&ops[length-2].insert!="\n") {
      ops.push({insert:"\n"})
    }
    this.delta={ops}
    return {ops}
  }


  getLSEQNodes(){
    let LSEQNodeArray=[]
    const root=this.sequence.root

    let preorder=(node)=>{
      if(node.e&&node.e!=""){
      LSEQNodeArray.push(node)
     }
      const children = node.children
      children.forEach(child => {
        preorder(child)
      });
    }

    preorder(root)
    return LSEQNodeArray
  }

  close() {
    this._foglet.unshare();
    this._foglet._networkManager._rps.network._rps.disconnect();
    if (this._view) {
      clearInterval(this._view._timerStorageServer);
      for (let marker in this._view._editor.markers) {
        clearInterval(marker.timer);
      }
     }
     this._communication.close()
     
    setTimeout(() => {
      this._foglet._networkManager._rps.network._rps.disconnect();
      this._document = null;
      this._foglet = null;
    }, 2000);

}
}