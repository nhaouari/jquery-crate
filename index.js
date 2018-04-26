process.on('unhandledRejection', error => {
    // Prints "unhandledRejection woops!"
   console.log('unhandledRejection ',error);
  // console.log('----------------------------------------------------------')
  //  console.log(session.headSession._foglet.getNeighbours(Infinity))
    /**
     * this is to remove the document from the server index
     * @type {[type]}
     */
   /* process.send({
        type: "error",
        id: process.argv[2]
    })
*/

});


process.on('uncaughtException', (error) => {
    // Prints "unhandledRejection woops!"
    console.log('uncaughtException', error);

    /**
     * this is to remove the document from the server index
     * @type {[type]}
     */
    process.send({
        type: "error",
        id: process.argv[2]
    })

});



var session = require('./lib/session.js');
var fs = require('fs');
const jsonfile = require('jsonfile')
var wrtc = require('wrtc')
var Marker = require('./lib/view/marker.js');
var request = require("request");
var sesssionID = process.argv[2]
const store = require('store')

if (!store.get("config")) {
    var config = {
        signalingServer: "https://signaling.herokuapp.com/",
        storageServer: "https://storagecrate.herokuapp.com",
        stun: '23.21.150.121' // default google ones if xirsys not
    };
} else {
    var config = store.get("config");
}

console.log("Document opened: SessionID = " + sesssionID);


var connectionOptions = "";

request({
    method: "get",
    url: "https://carteserver.herokuapp.com/ice"

}, function(error, response, body) {

    addresses = JSON.parse(body);
    var connectionOptions = (addresses && addresses.d) || {
        iceServers: [{
            url: 'stun:23.21.150.121', // default google ones if xirsys not
            urls: 'stun:23.21.150.121'
        }]
    };
    initialize(connectionOptions, sesssionID);
});



function initialize(connOptions, session) {
    console.log("initialize")
    connectionOptions = connOptions;
    justDoIt({
        server: config.signalingServe,
        session: session
    });
};


function justDoIt(signalingOptions, name, importFromJSON) {

    let options = {
        webRTCOptions: connectionOptions
    };

    options.webRTCOptions.trickle = true;
    options.webRTCOptions.wrtc = wrtc;
    if (signalingOptions) {
        options.signalingOptions = signalingOptions;
        // check if exist 
        // read the file
        var file = `./tmp/crate-${signalingOptions.session}.json`

        if (fs.existsSync(file)) {
            console.log(`Document ${signalingOptions.session} wakes up`)

            jsonfile.readFile(file, (err, obj) => {


                options.signalingOptions = {
                    signalingOptions
                };

                options.importFromJSON = obj;
                //var editorContainer = $("#editor");
                if (!store.get('myId')) {
                    generateID()
                }

                options.user = store.get('myId')

                options.changesTimeOut = 10 * 1000

                let newSession = new session(options);

            })
        } else {

                if (!store.get('myId')) {
                    generateID()
                }

                options.user = store.get('myId')

                options.changesTimeOut = 10 * 1000
                
                let newSession = new session(options);

        }


    };

};


function generateID() {
    id = session.GUID();
    m = new Marker(id);
    pseudo = m.animal
    store.set('myId', {
        id: id,
        pseudo: pseudo
    });
}