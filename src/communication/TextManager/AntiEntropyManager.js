
import VVwE from "version-vector-with-exceptions"
import {TextEvent} from './TextEvent'


var debug = require('debug')('CRATE:Communication:TextManager:AntiEntropyManager')

export class AntiEntropyManager extends TextEvent {
    constructor(opts) {
        const EventName = opts.EventName || 'Anti-Entropy'
        super({EventName,...opts})
        this._antiEntropyPeriod= opts.AntiEntropyPeriod 
        this._textManager=opts.TextManager
        this._communicationChannel = this._document._communication._behaviors_comm
       
       
        this.on('Request',(msg)=>{
            this.receiveRequest(msg)
        })

        this.on('Response',(msg)=>{
            this.receiveResponse(msg)
        })

        setTimeout(() => {
            this.sendAntiEntropyRequest() 
        }, 1000);
        
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
        const localVVwE=this._document._communication.causality.clone()
        const remoteVVwE = (new VVwE(null)).constructor.fromJSON(causality); // cast
       
        debug('receiveRequest',{antiEntropyPeriod:this._antiEntropyPeriod, id, remoteVVwE, localVVwE})
        let missingLSEQIDs=[]

        // #1 for each entry of our VVwE, look if the remote VVwE knows less
        
        const localEntries= localVVwE.vector.arr

        localEntries.forEach(localEntry => {
            const remoteEntryIndex= remoteVVwE.vector.indexOf(localEntry)
            let remoteEntry= null
            if(remoteEntryIndex>0) {
                remoteEntry=remoteVVwE.vector.arr[remoteEntryIndex]
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
            this.sendAction('Title',this._document.name,id) ;
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
                  if (localEntry.x.indexOf(j) < 0) {
                    missingLSEQIDs.push({ _e: localEntry.e, _c: j})
                    }
                }
    
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
     
   
    const lseqNodes= this.getLSEQNodes()
    debug('getElements',{toSearch,lseqNodes})

    let elements=[]
    lseqNodes.forEach((lseqNode)=>{
        if (this.isIdInSet({id:lseqNode.t.s,clock:lseqNode.t.c,toSearch})){
            elements.push(lseqNode)
        }

    })

    return elements
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

    isIdInSet({id,clock,toSearch}) {


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
        elements.forEach((lseqNode)=> {
            
            const causalId=this.getCausalID(lseqNode) 
            const msg={id:causalId}
            const authorID=lseqNode.t.s.split("-")[0]
            const pair={elem:lseqNode.e,id:lseqNode.e.id}
            // #2 only check if the message has not been received yet
            if (!this.haveBeenReceived(msg)) {
             // this._document.causality.incrementFrom(causalID)
               
            // this to prevent the caret movement in the case of anti-entropy

              elems.push({pair,id:authorID,causalId, antientropy: true})
            }
          })
        
        this.Event('Insert', {pairs:elems,stream:true})
 
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
    this.sendLocalBroadcast({type:'Request',id,causality:this._document._communication.causality})
    debug('sendAntiEntropyRequest',{type:'Request',id,causality:this._document._communication.causality})
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
    // #1 metadata of the antientropy response
    this.unicast(origin,{type:'Response',id, causalityAtReceipt, elements})  
    debug('sendAntiEntropyResponse',{type:'Response',id, causalityAtReceipt, elements})
  }



stopAntiEnropy(){
    if (this._intervalAntiEntropy) {
        clearInterval(this._intervalAntiEntropy)
        }   
}

close(){
    this.stopAntiEnropy()
}
}