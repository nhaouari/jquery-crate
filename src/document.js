
import {
  EventEmitter
} from "events"

import LSEQTree from "LSEQTree"
import {
  Communication
} from './communication/Communication'
import BI  from "BigInt"
import VVwE from "version-vector-with-exceptions"

var debug = require('debug')('CRATE:Document')

export default class doc extends EventEmitter {
  constructor(options) {
    super();

    this._options = options
    this._foglet = this._options._foglet

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

    this._communication= new Communication({document:this,...this._options})
   
    await this._communication.initConnection()

    if (options.display) { 
      const {View} = await import( /* webpackMode: "eager", webpackChunkName: "Crate-View" */ "./View.js")
      this._view = new View(options, this, options.containerID);
    }


    

    this.sequence = new LSEQTree(options.editingSessionID);

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
    //this.testAntientropy()
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

 

  getLSEQNodes1(sequence){
    let sequenceNodes = []
    for (let i = 0; i < sequence.root.subCounter; i++) {
        let tempNode = sequence._get(i);
        while (tempNode.children.length > 0) {
            tempNode = tempNode.children[0];
        };
        
        if(tempNode.e&&tempNode.e!=""){
        sequenceNodes.push(tempNode) 
        }
    }
    
return sequenceNodes
}

  getLSEQNodes2(){
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

    preorder(root,true)
    return LSEQNodeArray
  }


  getDeltaFromSequence(sequence){
    let LSEQNodes=this.getLSEQNodes1(sequence)
    let ops=[]
    
    LSEQNodes.forEach((node)=>{
      ops.push({insert:node.e.content,attributes:node.e.attributes})
    })

    const length = ops.length

    if(length>=2&&ops[length-1].insert==="\n"&&ops[length-2].insert!="\n") {
      ops.push({insert:"\n"})
    }

    return {ops}
  }

  refreshDocument(sequence){
    clearTimeout(this.refreshDocumentTimeout)
    
    this.refreshDocumentTimeout=setTimeout(()=>{
      const delta=this.getDeltaFromSequence(sequence)
      console.log(delta)
      let range=this._view._editor.viewEditor.getSelection()

      this._view._editor.viewEditor.setContents(delta,'silent')
      this._view._editor.viewEditor.setSelection(range,'silent')
      session.default.openIn()
    },10)
  
  }

  testAntientropy() {
  
    const sequenceNodes= this.getLSEQNodes1(this.sequence)
    console.log('getSequenceNodes result ',{sequenceNodes})

    let lseqTreeTest= new LSEQTree(this._options.editingSessionID)


    sequenceNodes.forEach((node)=>{ 
            const pair = {
                elem: node.e,
                id: this.fromNode(node),
                antientropy: true // this to prevent the caret movement in the case of anti-entropy
            }
            lseqTreeTest.applyInsert(pair, false);

    })

    
    this.refreshDocument(lseqTreeTest)
       
  }
/**
      * Set the d,s,c values according to the node in argument
      * @param {LSeqNode} node The lseqnode containing the path in the tree
      * structure.
      * @return {Identifier} This identifier modified.
      */
     fromNode (node) {
      let _base = this.sequence._base
      let _s = []
      let _c= []


       // #1 process the length of the path
       let length = 1, tempNode = node
       
       while (!tempNode.isLeaf) {
       ++length;
           tempNode = tempNode.child
       };
       // #2 copy the values contained in the path
       let _d = BI.int2bigInt(0, _base.getSumBit(length - 1))
       
       for (let i = 0; i < length ; ++i) {
           // #1a copy the site id
          _s.push(node.t.s)
           // #1b copy the counter
          _c.push(node.t.c)
           // #1c copy the digit
           BI.addInt_(_d, node.t.p)
           if (i !== length - 1) {
               BI.leftShift_(_d, _base.getBitBase(i+1))
           };
           node = node.child;
       };
       
       return {_base,_d,_s,_c}
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