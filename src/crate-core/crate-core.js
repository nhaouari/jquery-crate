import {EventEmitter} from "events"
import VVwE from "version-vector-with-exceptions"
import LSEQTree from "LSEQTree"
import {Foglet,communication} from "foglet-core"
import {MInsertOperation,MAEInsertOperation,MRemoveOperation, MCaretMovedOperation } from "./messages";
import {MAntiEntropyRequest,MAntiEntropyResponse,MBroadcast} from "./messages";

var debug = require('debug')('crate:crate-core')
/*!
 * \brief link together all components of the model of the CRATE editor
 * \param id the unique site identifier
 * \param options the webrtc specific options 
 */


export default class CrateCore extends EventEmitter {

    constructor(id, options, data_comm, behaviours_comm) {
        super()
        // EventEmitter.call(this);

        this.options = options

        /**
         * this variables are used to manage the sleeping mode in nodejs, to detect if the user is no longer editing for a period of changesTimeOut. 
         */
        this.setLastChangesTime()
        this._timer = setInterval(() => this.checkIfOutdated(), 1000);
        this._changesTimeOut = options.changesTimeOut || 10 * 1000; //default timeout is 10m

        this._communication = data_comm

        this.No_antientropy = behaviours_comm

        this.broadcast = this._communication.broadcast
        // Default channel for antientropy operations : insert, remove, changeTitle

        // No-anti-entropy channel for the operations that dose not need antientropy : ping, cartet position

        // listen for incoming broadcast

        this.No_antientropy.onBroadcast((id, message) => {
            switch (message.type) {
                case 'MCaretMovedOperation':
                    this.remoteCaretMoved(message.range, message.origin);
                    break;
                case 'Mping':
                    this.ping(message.origin, message.pseudo);
                    break;
            };

        })

        this._lastSentId=null
        this._communication.onBroadcast((id, message) => {
                switch (message.type) {
                    case 'MRemoveOperation':
                        this.remoteRemove(message.remove, message.origin);
                        break;
                    case 'MInsertOperation':
                        this.remoteInsert(message.insert, message.origin);
                        break;
                    case 'MTitleChanged':
                        this.changeTitle(message.title);
                        break;

                };
          
        })

        this._communication.broadcast.startAntiEntropy(2000);
        
        this._communication.broadcast.on('antiEntropy', (id, remoteVVwE, localVVwE) => {
            var remoteVVwE = (new VVwE(null)).constructor.fromJSON(remoteVVwE); // cast
            var toSearch = [];

            // #1 for each entry of our VVwE, look if the remote VVwE knows less
            for (var i = 0; i < localVVwE.vector.arr.length; ++i) {
                var localEntry = localVVwE.vector.arr[i];
                var index = remoteVVwE.vector.indexOf(localVVwE.vector.arr[i]);
                var start = 1;
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
            var elements = this.getElements(toSearch);

            // #2 send back the found elements

            if (elements.length != 0) {
                 debug('Receive AntiEntropy And there are differences', id, remoteVVwE, localVVwE,elements)
                this._communication.broadcast.sendAntiEntropyResponse(id, localVVwE, elements);

                this.emit('sendChangeTitle');

            }
        })

        this.id = id
        this.sequence = new LSEQTree(this.options.editingSessionID);
    }

    /**
     * checkIfOutdated check if the user is outdated and if it is the case remove its caret and avatar 
     */
    checkIfOutdated() {
        var timeNow = new Date().getTime();
        var dff = (timeNow - this._lastChanges);
        // if  cursor  is outdated 
        if ((timeNow - this._lastChanges) >= this._changesTimeOut) {
            clearInterval(this._timer);
            this.emit('outdated')
            return true
        } else {
            // jQuery(`#${this._editorContainerID} #${this.origin}`).css('opacity', (1 - ((timeNow - this.time) / this.lifeTime)));
            return false
        }

    }

    /*!
     * \brief create the core from an existing object
     * \param object the object to initialize the core model of crate containing a 
     * sequence and causality tracking metadata
     */
    init(object) {
        // import the sequence and version vector, yet it keeps the identifier of
        // this instance of the core.

        // this.broadcast = Object.assign(new VVwE(this.id),object.causality);

        // var local = this.broadcast.causality.local;
        this.broadcast._causality = this.broadcast._causality.constructor.fromJSON(object.causality);


        // this.broadcast.causality.local = local;
        var local = this.broadcast._causality.local;
        // this.broadcast.causality.vector.insert(this.broadcast.causality.local);

        this.No_antientropy.broadcast._causality.local.e = local.e;

        this.sequence.fromJSON(object.sequence);
        this.sequence._s = local.e;
        this.sequence._c = local.v;
    };

    /*!
     * \brief local insertion of a character inside the sequence structure. It
     * broadcasts the operation to the rest of the network.
     * \param character the character to insert in the sequence
     * \param index the index in the sequence to insert
     * \return the identifier freshly allocated
     */
    insert(character, index) {
        var pair = this.sequence.insert(character, index)

        const insertMsg = new MInsertOperation(pair, this.id)

        try {
            const test = JSON.parse(JSON.stringify(insertMsg))
        } catch (e) {
            console.error('The object cannot be convert to json ', e, insertMsg)
        }

        this._lastSentId=this._communication.sendBroadcast(new MInsertOperation(pair, this.id),null,this._lastSentId)

        this.setLastChangesTime()
        return pair;    
    };

    /*!
     * \brief local deletion of a character from the sequence structure. It 
     * broadcasts the operation to the rest of the network.
     * \param index the index of the element to remove
     * \return the identifier freshly removed
     */
    remove(index) {
        var i = this.sequence.remove(index);
        this.sequence._c += 1;
        this._communication.sendBroadcast(new MRemoveOperation(i, this.id))

        this.setLastChangesTime()


        return i;
    };


    /*!
     * \brief insertion of an element from a remote site. It emits 'remoteInsert' 
     * with the index of the element to insert, -1 if already existing.
     * \param ei the result of the remote insert operation
     * \param origin the origin id of the insert operation
     */
    remoteInsert(pair, origin) {
        var index = this.sequence.applyInsert(pair,false);
        debug('remoteInsert', pair, ' sequence Index ', index)
        if (index >= 0 && origin) {
            this.emit('remoteInsert', pair.elem, index);
            this.setLastChangesTime()
            if (!pair.antientropy) {
                this.emit('remoteCaretMoved', {
                    index: index,
                    length: 0
                }, origin);
            };
        }

    };

    /*!
     * \brief removal of an element from a remote site.  It emits 'remoteRemove'
     * with the index of the element to remove, -1 if does not exist
     * \param id the result of the remote insert operation
     * \param origin the origin id of the removal
     */
    remoteRemove(id, origin) {
        var index = this.sequence.applyRemove(id);
        this.emit('remoteRemove', index);
        if (index >= 0 && origin) {
            this.emit('remoteCaretMoved', {
                index: index - 1,
                length: 0
            }, origin);
        };
        this.setLastChangesTime()

    };

    /**
     * setLastChangesTime set the last time of changes
     */
    setLastChangesTime() {
        const d = new Date();
        const n = d.getTime();
        this._lastChanges = n
    }
    /**
     * [remoteCaretMoved]
     * @param  {[type]} range  [description]
     * @param  {[type]} origin [description]
     * @return {[type]}        [description]
     */
    remoteCaretMoved(range, origin) {
        this.emit('remoteCaretMoved', range, origin);
    };



    /**
     * [caretMoved description]
     * @param  {[type]} range [description]
     * @return {[type]}       [description]
     */
    caretMoved(range) {
        this.No_antientropy.sendBroadcast(new MCaretMovedOperation(range, this.id));
        return range;
    };



    /**
     * [ping At ping recepion send ping event to be traited]
     * @param  {[type]} origin [description]
     * @param  {[type]} pseudo [description]
     * @return {[type]}        [description]
     */
    ping(origin, pseudo) {
        this.emit('ping', origin, pseudo);
    };


    /**
     * [sendPing description]
     * @return {[type]} [description]
     */
    sendPing(pseudo) {
        var pseudo = "Anonymous";
        this.No_antientropy.sendBroadcast({
            type: 'Mping',
            origin: this.id,
            pseudo: pseudo
        });
        return origin;
    };



    /**
     * [changeTitle At the reception of MTitleChanged ]
     * @param  {[type]} title [description]
     * @return {[type]}       [description]
     */

    changeTitle(title) {
        this.emit('changeTitle', title);
    };


    /**
     * [sendChangeTitle Broadcast the new title]
     * @param  {[type]} title [description]
     * @return {[type]}       [description]
     */
    sendChangeTitle(title) {
        console.log("sendChangeTitle core title ", title)
        this._communication.sendBroadcast({
            type: 'MTitleChanged',
            title: title
        })
    };


    /*!
     * \brief search a set of elements in our sequence and return them
     * \param toSearch the array of elements {_e, _c} to search
     * \returns an array of nodes
     */
    getElements(toSearch) {
        var result = [],
            found, node, tempNode, i = this.sequence.length,
            j = 0;
        // (TODO) improve research by exploiting the fact that if a node is
        // missing, all its children are missing too.
        // (TODO) improve the returned representation: either a tree to factorize
        // common parts of the structure or identifiers to get the polylog size
        // (TODO) improve the search by using the fact that toSearch is a sorted
        // array, possibly restructure this argument to be even more efficient

        while (toSearch.length > 0 && i <= this.sequence.length && i > 0) {
            node = this.sequence._get(i);
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
                    result.push(new MAEInsertOperation({
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
}
