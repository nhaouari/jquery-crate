
import VVwE from "version-vector-with-exceptions"
import {TextEvent} from './TextEvent'
import LSEQTree from "LSEQTree"
import BI  from "BigInt"

var debug = require('debug')('CRATE:Communication:TextManager:AntiEntropyManager')

export class AntiEntropyManager extends TextEvent {
    constructor(opts) {
        const name = opts.name || 'Anti-Entropy'
        super({name,...opts})
        this._antiEntropyPeriod= opts.AntiEntropyPeriod 
        this._textManager=opts.TextManager

        this.on('Request',(msg)=>{
            this.receiveRequest(msg)
        })

        this.on('Response',(msg)=>{
            this.receiveResponse(msg)
        })
    }

    start(){
        debug('AntiEntropyManager','start','Period',this._antiEntropyPeriod,this)
      //  this._communicationChannel.broadcast.startAntiEntropy(this._antiEntropyPeriod);
        this.startAntiEntropy(2000)
    }

    receive(msg) {
        this.emit(msg.type,{...msg})
    }


    receiveRequest({id, causality}){
       
        const localVVwE=this._document.causality.clone()
        const remoteVVwE = (new VVwE(null)).constructor.fromJSON(causality); // cast
       
        debug('receiveRequest',{antiEntropyPeriod:this._antiEntropyPeriod, id, remoteVVwE, localVVwE})
        let missingLSEQIDs=[]

        // #1 for each entry of our VVwE, look if the remote VVwE knows less
        
        const localEntries= localVVwE.vector.arr

        localEntries.forEach(localEntry => {
            const remoteEntryIndex= remoteVVwE.vector.indexOf(localEntry)
            let remoteEntry= null
            if(remoteEntryIndex>0) {
                remoteEntry=remoteVVwE.vector.arr[index]
            }
            const missingLSEQIDsEntry=this.getMissingLSEQIDs(localEntry,remoteEntry)
            Array.prototype.push.apply(missingLSEQIDs,missingLSEQIDsEntry);
                 
        })

        if(missingLSEQIDs.length>0){
        const elements = this.getElements(missingLSEQIDs);
            // #2 send back the found elements
        if (elements.length != 0) {
            debug('Receive AntiEntropy And there are differences', id, remoteVVwE, localVVwE, elements)
            this.sendAntiEntropyResponse(id, localVVwE, elements);         
           
           console.log("sendAction",'Title',this._document.name );
            this.sendAction('Title',this._document.name) ;
        }
    }
    }

    getMissingLSEQIDs(localEntry,remoteEntry){
        let start = 1
        if(remoteEntry){
            start = remoteEntry.v + 1;
        }   

        let missingLSEQIDs=[]

        for (let j = start; j <= localEntry.v; ++j) {
                    // #B check if not one of the local exceptions
                 //TODO: Check why it dose not work   if (localEntry.x.indexOf(j) < 0) {
                        missingLSEQIDs.push({ _e: localEntry.e, _c: j});
                   // };
                };
        


         // #C handle the exceptions of the remote vector
         if (remoteEntry) {
            for (let j = 0; j < remoteEntry.x.length; ++j) {
                let except = remoteEntry.x[j];
                if (localEntry.x.indexOf(except) < 0 && except <= localEntry.v) {
                    missingLSEQIDs.push({
                        _e: localEntry.e,
                        _c: except
                    })
               
                }
            }
        }
        return missingLSEQIDs
    }



  /*!
     * \brief search a set of elements in our sequence and return them
     * \param toSearch the array of elements {_e, _c} to search
     * \returns an array of nodes
     */
    getElements(toSearch) {
        debug('getElements ',{toSearch})
    
        let result = []
        const sequenceNodes= this.getSequenceNodes()
        debug('getSequenceNodes result ',{sequenceNodes})
        let lseqTreeTest= new LSEQTree('test')

       

        sequenceNodes.forEach((node)=>{
           
            const id = node.t.s
            const clock=node.t.c
            //node.children=[]
            if (this.isInToSearch({id,clock,toSearch})){
                const pair = {
                    elem: node.e,
                    id: this.fromNode(node),
                    antientropy: true // this to prevent the caret movement in the case of anti-entropy
                }
                lseqTreeTest.applyInsert(pair, false);
                result.push(this.MAEInsertOperation(pair, node.t.s));
            }

        })
           
        
        debug('getElements result ',{result: result.reverse()})
        debugger
         return  result.reverse();
    }
 


     getLSEQNodes(){
        let LSEQNodeArray=[]
        const root=this._sequence.root
    
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
    

    /**
      * Set the d,s,c values according to the node in argument
      * @param {LSeqNode} node The lseqnode containing the path in the tree
      * structure.
      * @return {Identifier} This identifier modified.
      */
     fromNode (node) {
        let _base = this._sequence._base
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

    getSequenceNodes(){
        let sequenceNodes = []

        for (let i = 0; i < this._sequence.root.subCounter; i++) {
            let tempNode = this._sequence._get(i);
            while (tempNode.children.length > 0) {
                tempNode = tempNode.children[0];
            };

            sequenceNodes.push(tempNode)    
        }
        
    return sequenceNodes
    }

    getSequenceNode({id,clock,sequenceNodes}){
        for (let j = 0; j < sequenceNodes.length; j++) {
            const tempNode=sequenceNodes[j]
            if (tempNode.t.s ===id &&
                tempNode.t.c === clock) {
                return tempNode        
             }      
        
    }
    }

    isInToSearch({id,clock,toSearch}) {

        for (let j = 0; j < toSearch.length; j++) {
            const {_e,_c}=toSearch[j]
           
            if (_e ===id &&
                _c === clock) {
                return true        
             } 
    }
    return false

}
    receiveResponse({elements,causalityAtReceipt}){
      
      debug('receiveResponse',{elements,causalityAtReceipt})
        // #1 considere each message in the response independantly     
        let elems=[]
        elements.forEach((element)=> {
            // #2 only check if the message has not been received yet
            if (!this.haveBeenReceived(element)) {
              this._document.causality.incrementFrom(element.id)
              elems.push(element.payload)
            }
          })
        
        this.Event('Insert', {pairs:elems})
 
          // #3 merge causality structures
        this._document.causality.merge(causalityAtReceipt) 
    }


    /**
   * We started Antientropy mechanism in order to retreive old missed files
   */
  startAntiEntropy (delta = 2000) { 
    this._intervalAntiEntropy = setInterval(() => {
        this.sendAntiEntropyRequest()
    }, delta)
  }


  sendAntiEntropyRequest(){
    let id = this._document._options.editingSessionID
    this.sendLocalBroadcast({type:'Request',id,causality:this._document.causality})
    debug('sendAntiEntropyRequest',{type:'Request',id,causality:this._document.causality})
  }

   /**
   * Send entropy response
   * @deprecated
   * @param  {[type]} origin             [description]
   * @param  {[type]} causalityAtReceipt [description]
   * @param  {[type]} elements           [description]
   * @return {[type]}                    [description]
   */
  sendAntiEntropyResponse (origin, causalityAtReceipt, elements) {
    let id = this._document._options.editingSessionID
    origin = origin + '-I'
    // #1 metadata of the antientropy response
    this.unicast(origin,{type:'Response',id, causalityAtReceipt, elements})  
    debug('sendAntiEntropyResponse',{type:'Response',id, causalityAtReceipt, elements})
  }


  

MAEInsertOperation(pair, id){
    const packet = {
    type : "MAEInsertOperation",
    payload :  {
        type : "Insert_Event",
        pair: pair,
        id : id
        },
    id: {e:id},
     isReady : null
    }
    return packet
};

stopAntiEnropy(){
    if (this._intervalAntiEntropy) {
        clearInterval(this._intervalAntiEntropy)
        }   
}

close(){
    this.stopAntiEnropy()
}
}