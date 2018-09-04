import {
    Event
} from './Event';

import VVwE from "version-vector-with-exceptions"

var debug = require('debug')('crate:text-manager')


export class TextEvent extends Event {
    constructor(opts) {
        super(opts)

        this._communicationChannel = this._document._data_comm
        this._sequence = this._document.sequence
        
        
    }
  
}


export class TextManager extends TextEvent {
    constructor(opts) {
        const name = opts.name || 'TextManager'
        super({name,...opts})

        this._insertManager = new InsertManager({TextManager:this,...opts})
        this._removeManager = new RemoveManager({TextManager:this,...opts})
        this._titleManager = new TitleManager({TextManager:this,...opts})
        this._antiEntropyManager = new AntiEntropyManager({TextManager:this,...opts}) 
        this._antiEntropyManager.start()
        
        this.on('sendChangeTitle',()=> {
            this._titleManager.sendChangeTitle()
            
        })

        this.on('setLastChangesTime',()=> {
            this._titleManager.sendChangeTitle()
            
        })


    }

   
}


export class InsertManager extends TextEvent {
    constructor(opts) {
        
        const name = opts.name || 'Insert'
        super({name,...opts})
        this._lastSentId = null
        this._textManager=opts.TextManager
        this.action=this.insert        
    }


    /*!
     * \brief local insertion of a character inside the sequence structure. It
     * broadcasts the operation to the rest of the network.
     * \param character the character to insert in the sequence
     * \param index the index in the sequence to insert
     * \return the identifier freshly allocated
     */
    insert({packet, position}) {
        var pair = this._sequence.insert(packet, position)
        debug('local Insert', packet, ' Index ', position, 'pair',pair)
        
        if (this.isItConvertibleToJSON(pair)) {
            this._lastSentId = this.broadcast({
                id: this._document.uid,
                pair
            }, this._lastSentId)
            this.setLastChangesTime()
        }
        return pair;
    };

    /*!
     * \brief insertion of an element from a remote site. It emits 'remoteInsert' 
     * with the index of the element to insert, -1 if already existing.
     * \param ei the result of the remote insert operation
     * \param origin the origin id of the insert operation
     */
    receive( {id,pair} ) {
        const index = this._sequence.applyInsert(pair, false);
        debug('remoteInsert','pair', pair, ' sequence Index ', index)
       
        if (index >= 0) {
            this.emit('remoteInsert', pair.elem, index);
            this.setLastChangesTime()
            const range = {
                index: index,
                length: 0
            }
            const msg = {
                range,
                id
            }
            this.Event('Caret', msg)
        };
    }

    /**
     * Validate that the message is convertable to JSON
     * @param {*} msg 
     */
    isItConvertibleToJSON(msg) {
        try {
            const test = JSON.parse(JSON.stringify(msg))
            return true
        } catch (e) {
            console.error('The object cannot be convert to json ', e, insertMsg)
            return false
        }
    }

}

export class RemoveManager extends TextEvent {
    constructor(opts) {

        const name = opts.name || 'Remove'
        super({name,...opts})
        this._lastSentId = null
        this._textManager=opts.TextManager
        this.action= this.remove
    }

    /*!
     * \brief local deletion of a character from the sequence structure. It 
     * broadcasts the operation to the rest of the network.
     * \param index the index of the element to remove
     * \return the identifier freshly removed
     */
    remove(index) {
        var reference = this._sequence.remove(index);
        this._sequence._c += 1;
        this._lastSentId = this.broadcast({
            id: this._document.uid,
            reference
        }, this._lastSentId)
      
      //TODO:  this.setLastChangesTime()
      
        return reference;
    };


    /*!
     * \brief removal of an element from a remote site.  It emits 'remoteRemove'
     * with the index of the element to remove, -1 if does not exist
     * \param id the result of the remote insert operation
     * \param origin the origin id of the removal
     */
    receive({id,reference}) {
    
        const index = this._sequence.applyRemove(reference);
        this.emit('remoteRemove', index);

        if (index >= 0) {
            const range = {
                index: index - 1,
                length: 0
            }
            const msg = {
                range,
                id
            }
            this.Event('Caret', msg)
        };

        this.setLastChangesTime()
    };



}

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

    receive({id, remoteVVwEJSON, localVVwE}) {
        debug('AntiEntropyManager','Antientrpu received','Period',this._antiEntropyPeriod, id, remoteVVwEJSON, localVVwE)
       
        const remoteVVwE = (new VVwE(null)).constructor.fromJSON(remoteVVwEJSON); // cast
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
            this._communicationChannel.broadcast.sendAntiEntropyResponse(id, localVVwE, elements);         
           
           console.log("sendAction",'Title',this._document.name );
            this.sendAction('Title',this._document.name) ;
        }
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

export class TitleManager extends TextEvent {
    constructor(opts) {
        const name = opts.name || 'Title'
        super({name,...opts})
        this._textManager=opts.TextManager
        this.action = this.sendChangeTitle
    }
    /**
     * [sendChangeTitle Broadcast the new title]
     * @param  {[type]} title [description]
     * @return {[type]}       [description]
     */
    sendChangeTitle(title) {   
        console.log('Title sent ');
        this._document.name = title
        this.broadcast({
            id:this._document.uid,
            title: title
        })
    };

    /**
     * [changeTitle At the reception of MTitleChanged ]
     * @param  {[type]} title [description]
     * @return {[type]}       [description]
     */

    receive(msg) {
        this.emit('changeTitle', msg.title);
    };

}