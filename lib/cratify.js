const Document = require('./document.js');
var GUID = require('./model/guid.js');
const Foglet = require('foglet-core').Foglet

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


class cratify {
  constructor(options) {
    // Crate a session ID
    // Crate with foglet object and Documents array  
    // Creat a default index document and add it to documents array 
    // Options configuration 

    // WEBRTC
    this.options = options

    const webRTCOptions = (options && options.webRTCOptions) ||
      (options && options.importFromJSON &&
        options.importFromJSON.webRTCOptions) || {}

    this.options.webRTCOptions = webRTCOptions

    // Storage Server
    const storageServer = (options && options.storageServer) || ""

    this.options.storageServer = storageServer
    // Session ID
    const sessionId = GUID();
    window.DocumentID = sessionId;

    // Signling Server
    const signalingOptions = $.extend({
        address: 'http://172.16.9.214:3000/',
        room: sessionId
      },
      (options && options.importFromJSON &&
        options.importFromJSON.signalingOptions),
      (options && options.signalingOptions) || {})

    this.options.signalingOptions = signalingOptions

    //Foglet
    const fogletOptions = {
      sessionId,
      verbose: true, // want some logs ? switch to false otherwise
      rps: {
        options: {
          protocol: sessionId, // foglet running on the protocol foglet-example, defined for spray-wrtc
          webrtc: webRTCOptions,
          timeout: 2 * 60 * 1000, // spray-wrtc timeout before definitively close a WebRTC connection.
          delta: 10 * 1000, // spray-wrtc shuffle interval
          signaling: signalingOptions // signaling options
        }
      }
    }

    this.options.name = (options && options.name) ||
      (options && options.importFromJSON &&
        options.importFromJSON.title) ||
      "default";

    if (options && options.importFromJSON) {
      this.options.importFromJSON = options.importFromJSON
    }

    this.options.fogletOptions = fogletOptions

    this._foglet = new Foglet(fogletOptions)

    this._documents = []

    
    let doc = new Document(this.options, this._foglet)

    this._documents.push(doc)
    

  }
}

module.exports = cratify;