
import VVwE from "version-vector-with-exceptions"
import {TextEvent} from './TextEvent'
var debug = require('debug')('CRATE:Communication:TextManager:AntiEntropyManager')

export class AntiEntropyManager extends TextEvent {
    constructor(opts) {
        const name = opts.name || 'antiEntropy'
        super({name,...opts})
        this._antiEntropyPeriod= opts.AntiEntropyPeriod 
        this._textManager=opts.TextManager
    }

    start(){
        debug('AntiEntropyManager','start','Period',this._antiEntropyPeriod,this)
        this._communicationChannel.broadcast.startAntiEntropy(this._antiEntropyPeriod);
    }

    receive({id, remoteVVwEJSON,localVVwE}) {
        const remoteVVwE = (new VVwE(null)).constructor.fromJSON(remoteVVwEJSON); // cast
       
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
            //this.sendAntiEntropyResponse(id, localVVwE, elements);         
            this._communicationChannel.broadcast.sendAntiEntropyResponse(id, localVVwE, elements);   
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
        event : "Insert_Event",
        pairs: [{pair,
            id}
        ],
        },
     id: {e:id},
     isReady : null
    }
    return packet
};
}