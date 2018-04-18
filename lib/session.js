const Document = require('./document.js');
const Foglet = require('foglet-core').Foglet
const shortid = require('shortid')


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




class session {

  constructor(options) {
    // Crate a session ID
    // Crate with foglet object and Documents array  
    // Create a default index document and add it to documents array 
    // Options configuration 


    this.options = options

    this._previous = null
    this._next = null

    let session = this.constructor
    if (!session.actualSession || session.actualSession == null) {
      session.actualSession = this
      session.lastSession = session.actualSession
      session.headSession = session.actualSession
    } else {
      session.lastSession._next = this
      session.lastSession._next._previous = session.lastSession
      session.lastSession = session.lastSession._next
      session.actualSession = session.lastSession
    }



    // WEBRTC
    const webRTCOptions = (options && options.webRTCOptions) ||
      (options && options.importFromJSON &&
        options.importFromJSON.webRTCOptions) || {}

    // Storage Server
    const storageServer = (options && options.storageServer) || ""

    // Session ID
    const sessionId = this.constructor.GUID();
    window.DocumentID = sessionId;

    // Signling Server
    const signalingOptions = $.extend({
        address: 'http://172.16.9.214:8000/',
        session: sessionId
      },
      (options && options.importFromJSON &&
        options.importFromJSON.signalingOptions),
      (options && options.signalingOptions) || {})

    signalingOptions.room = signalingOptions.session // todo:toremove

    //Foglet
    const fogletOptions = {
      id: options.user.id,
      verbose: true, // want some logs ? switch to false otherwise
      rps: {
        options: {
          protocol: signalingOptions.sessionId, // foglet running on the protocol foglet-example, defined for spray-wrtc
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
      "Untitled document";

    if (options && options.importFromJSON) {
      this.options.importFromJSON = options.importFromJSON
    }


    this.options = $.extend(this.options, {
      webRTCOptions,
      storageServer,
      signalingOptions,
      fogletOptions
    });

    this._foglet = new Foglet(fogletOptions)

    this._documents = []


    let doc = new Document(this.options, this._foglet)

    this._documents.push(doc)



  }

  getNext() {
    return _next
  }

  getPrevious() {
    return _previous
  }

  moveToNext() {
    if (this._next != null) {
      this.constructor.actualSession = this._next
      this.goTo(this.constructor.actualSession.options.signalingOptions.session)
    }

  }

  moveToPrevious() {
    if (this._previous != null) {
      this.constructor.actualSession = this._previous
      this.goTo(this.constructor.actualSession.options.signalingOptions.session)
    }
  }

  goTo(sessionId) {
    jQuery('html, body').animate({
      scrollLeft: jQuery(`#container-${sessionId}`).offset().left - 40
    }, 'slow');
  }

  close() {
    this._foglet.overlay().network.rps.disconnect()
    delete this
  }
  
  static getCrateSession(id) {
    let found = false
    var search = this.headSession
    while (!found && search !== null) {
      let sessionId = search.options.signalingOptions.session
      if (id === sessionId) {
        return search
      }
      search = search._next
    }
    return false
  }

  static GUID() {
    return shortid.generate();
  };


}

module.exports = session;