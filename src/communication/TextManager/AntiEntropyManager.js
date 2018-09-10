
import VVwE from "version-vector-with-exceptions"
import {TextEvent} from './TextEvent'
var debug = require('debug')('CRATE:Communication:TextManager:AntiEntropyManager')

export class AntiEntropyManager extends TextEvent {
    constructor(opts) {
        const name = opts.name || 'Antientropy'
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
        debug('AntiEntropyManager','Antientrpu received','Period',this._antiEntropyPeriod, id, remoteVVwE, localVVwE)
        let toSearch = [];

        // #1 for each entry of our VVwE, look if the remote VVwE knows less
        for (let i = 0; i < localVVwE.vector.arr.length; ++i) {
            const localEntry = localVVwE.vector.arr[i];
            const index = remoteVVwE.vector.indexOf(localVVwE.vector.arr[i]);
            let start = 1;
            // #A check if the entry exists in the remote vvwe
            if (index >= 0) {
                start = remoteVVwE.vector.arr[index].v + 1;
            };

            for (var j = start; j <= localEntry.v; ++j) {
                // #B check if not one of the local exceptions
                if (localEntry.x.indexOf(j) < 0) {
                    toSearch.push({
                        _e: localEntry.e,
                        _c: j
                    });
                };
            };
            // #C handle the exceptions of the remote vector
            if (index >= 0) {
                for (var j = 0; j < remoteVVwE.vector.arr[index].x.length; ++j) {
                    var except = remoteVVwE.vector.arr[index].x[j];
                    if (localEntry.x.indexOf(except) < 0 && except <= localEntry.v) {
                        toSearch.push({
                            _e: localEntry.e,
                            _c: except
                        });
                    };
                };
            };
        };

        const elements = this.getElements(toSearch);
        // #2 send back the found elements

        if (elements.length != 0) {
            debug('Receive AntiEntropy And there are differences', id, remoteVVwE, localVVwE, elements)
            this.sendAntiEntropyResponse(id, localVVwE, elements);         
           
           console.log("sendAction",'Title',this._document.name );
            this.sendAction('Title',this._document.name) ;
        }
    }

    receiveResponse({elements,causalityAtReceipt}){
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
  }

    /*!
     * \brief search a set of elements in our sequence and return them
     * \param toSearch the array of elements {_e, _c} to search
     * \returns an array of nodes
     */
    getElements(toSearch) {
        let result = [],
            found, node, tempNode, i = this._sequence.length,
            j = 0;
        // (TODO) improve research by exploiting the fact that if a node is
        // missing, all its children are missing too.
        // (TODO) improve the returned representation: either a tree to factorize
        // common parts of the structure or identifiers to get the polylog size
        // (TODO) improve the search by using the fact that toSearch is a sorted
        // array, possibly restructure this argument to be even more efficient

        while (toSearch.length > 0 && i <= this._sequence.length && i > 0) {
            node = this._sequence._get(i);
            tempNode = node;

            while (tempNode.children.length > 0) {
                tempNode = tempNode.children[0];
            };
            j = 0;
            found = false;
            while (j < toSearch.length && !found) {
                if (tempNode.t.s === toSearch[j]._e &&
                    tempNode.t.c === toSearch[j]._c) {

                    found = true;

                    result.push(this.MAEInsertOperation({
                        elem: tempNode.e,
                        id: node,
                        antientropy: true // this to prevent the caret movement in the case of anti-entropy
                    }, tempNode.t.s.split("-")[0]));

                    toSearch.splice(j, 1);
                } else {
                    ++j;
                };
            };
            --i;
        };

        return result.reverse();
    };



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
}