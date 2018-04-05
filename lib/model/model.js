var Core = require('../crate-core/lib/crate-core.js');

var GUID = require('./guid.js');
var Signaling = require('./signaling.js');


function Model(signalingOptions, webRTCOptions, name, importFromJSON) {
    // #1A initialize internal variables
    if (store.get('myId')) {
        this.uid = store.get('myId').id;
    } else {
        this.uid = GUID();
    }


    this.name = name;
    this.date = new Date(); // (TODO) change
    this.webRTCOptions = webRTCOptions;

    this.core = new Core(this.uid, {
        webrtc: webRTCOptions,
        signalingOptions: signalingOptions
    });
    this.signaling = new Signaling(this.core.app.overlay().network, signalingOptions);

    // #1B if it is imported from an existing object, initialize it with these
    if (importFromJSON) {
        this.core.init(importFromJSON);
    };

    // #2 grant fast access

    this.broadcast = this.core.app.overlay()._communication.broadcast
    this.broadcastCaret = this.core.No_antientropy.broadcast
    this.rps = this.core.app.overlay().communication.network.rps
    this.sequence = this.core.sequence;
    this.causality = this.broadcast._causality;
    this.signalingOptions = this.signaling.signalingOptions;

};



Model.prototype.setNewID = function(id) {


    var oldId = this.core.id;
    this.core.id = id;

    var newObject = jQuery.extend(true, {}, this.broadcast.causality.vector.arr[0]);
    newObject.e = id;
    newObject.v = 0;
    newObject.x = [];

    this.broadcast.causality.vector.insert(newObject);
    this.broadcast.causality.local.e = id;

    this.broadcastCaret.causality.local.e = id;

    this.uid = id;
    this.sequence._s = id;
    console.dir(this.markers[id]);


    this.markers[oldId].removeAvatar();
    this.markers[id] = new Marker(id, 5 * 1000, {
        index: 0,
        length: 0
    }, editor.getModule('cursors'), false, true);

    //}
}
module.exports = Model;