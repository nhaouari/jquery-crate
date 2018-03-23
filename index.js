var Model = require('./lib/model/model.js');
var GUID = require('./lib/model/guid.js');
var wrtc = require('wrtc')

var request = require("request");

var sesssionID= process.argv[2]
console.log("CRATE started: SessionID = "+ sesssionID);

var connectionOptions = "";

request({
    method: "POST",
    url: "https://service.xirsys.com/ice",
    form: {
        ident: "chatwane",
        secret: "8105d907-564a-4213-8c91-21b0a2f7344b",
        domain: "crate.com",
        application: "crate",
        room: "default",
        secure: 1
    }
},  function (error, response, body) {
   addresses =JSON.parse(body); 
   var connectionOptions = (addresses && addresses.d) ||
            {iceServers: [ {
                url: 'stun:23.21.150.121', // default google ones if xirsys not
                urls: 'stun:23.21.150.121' } ] }; // responding
        initialize(connectionOptions,sesssionID);
});




// #2 get stun servers
/*request({
    method: "POST",
    url: "https://service.xirsys.com/ice",
    data: {
        ident: "chatwane",
        secret: "8105d907-564a-4213-8c91-21b0a2f7344b",
        domain: "crate.com",
        application: "crate",
        room: "default",
        secure: 1
    }, function (error, response, body) {
       console.log("this is body");
    /*
       var connectionOptions = (addresses && addresses.d) ||
            {iceServers: [ {
                url: 'stun:23.21.150.121', // default google ones if xirsys not
                urls: 'stun:23.21.150.121' } ] }; // responding
        initialize(connectionOptions);
    },
    async: true
   
});


 */




function initialize(connOptions,session){
    connectionOptions = connOptions;
    justDoIt({server:  'https://ancient-shelf-9067.herokuapp.com',
                          session: session,
                          connect: true});
      
    };


function justDoIt (signalingOptions, name, importFromJSON){
    // #0 analyse the arguments
    // (TODO) fix the uglyness of this code
    var options = {webRTCOptions: connectionOptions };
    
    options.webRTCOptions.trickle = true;
    options.signalingOptions = signalingOptions; 
    if (name) { options.name = name; };
   
    this.model =cratify(options);
/*
    this.socket = model.signaling.startSharing();
        
    this.socket.on("connect", function(){       
            console.log("connect and waitJoiners");
        });

    this.socket.on("disconnect", function(){
          console.log("disconnect");
           });
      
      if (this.model.signaling.startedSocket){
            // #B add the new argument
            console.log("session is: "+ model.signalingOptions.session) 
        };   */    
   
}

function cratify (options){
    // #0 examine the arguments
    
    var webRTCOptions = (options && options.webRTCOptions) ||
        (options && options.importFromJSON &&
         options.importFromJSON.webRTCOptions) ||
        {};
    signalingOptions= options.signalingOptions;

    webRTCOptions.wrtc=wrtc;
    var DocumentID = GUID(); 
    var name = options.name;

        // #1 initialize the model
        var m = new Model(signalingOptions, webRTCOptions, name,
                          options.importFromJSON);
    
        this.model = m;
      
        if (signalingOptions.connect){
          this.model.startJoining(signalingOptions);
        };

return  this.model ;
};
