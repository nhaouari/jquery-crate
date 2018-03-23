var Model = require('./model/model.js');
var GUID = require('./model/guid.js');



/*!
 * \brief transform the selected division into a distributed and decentralized 
 * collaborative editor.
 * \param options {
 *   signalingOptions: configure the signaling service to join or share the
 *     document. {address: http://example.of.signaling.service.address,
 *                session: the-session-unique-identifier,
 *                connect: true|false}
 *   webRTCOptions: configure the STUN/TURN server to establish WebRTC
 *     connections.
 *   styleOptions: change the default styling options of the editor.
 *   name: the name of the document
 *   importFromJSON: the json object containing the aformentionned options plus
 *     the saved sequence. If any of the other above options are specified, the
 *     option in the json object are erased by them.
 * }
 */
 function cratify (options){
    // #0 examine the arguments
    
    var webRTCOptions = (options && options.webRTCOptions) ||
        (options && options.importFromJSON &&
         options.importFromJSON.webRTCOptions) ||
        {};
    


    var DocumentID = GUID();

    var signalingOptions=
        $.extend(
            $.extend({//server: "http://127.0.0.1:5000",
                      server: "https://ancient-shelf-9067.herokuapp.com",
                      session: DocumentID,
                      connect: false},
                     (options && options.importFromJSON &&
                      options.importFromJSON.signalingOptions) ||
                     {}),
            (options && options.signalingOptions) || {});

    var name = (options && options.name) ||
        (options && options.importFromJSON &&
         options.importFromJSON.title) || 
        "default";

        // #1 initialize the model
        var m = new Model(signalingOptions, webRTCOptions, name,
                          options.importFromJSON);
    
        this.model = m;
      
        if (signalingOptions.connect){
          this.model.startJoining(signalingOptions);
        };

return  this.model ;
};


