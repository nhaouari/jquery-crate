const Document = require('./document.js');
const Foglet = require('foglet-core').Foglet
const shortid = require('shortid')
const store = require('store')
const extend = require('extend')


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

    // Signling Server
    const signalingOptions = extend({
        address: 'https://carteserver.herokuapp.com/',
        session: sessionId
      },
      (options && options.importFromJSON &&
        options.importFromJSON.signalingOptions),
      (options && options.signalingOptions) || {})

    signalingOptions.room = signalingOptions.session // todo:toremove


    //Foglet
    //

    this._editingSessionID = options.user.id + "-" + this.constructor.GUID();
    const fogletOptions = {
      pendingTimeout: 60000,
      id: this._editingSessionID,
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

    this.options.name = (options && options.importFromJSON &&
        options.importFromJSON.title) ||
      "Untitled document";

    console.log('the title is session',  this.options.name )


    if (options && options.importFromJSON) {
      this.options.importFromJSON = options.importFromJSON
    }


    this.options = extend(this.options, {
      webRTCOptions,
      storageServer,
      signalingOptions,
      fogletOptions
    });

    this.options.editingSessionID = this._editingSessionID
    this._foglet = new Foglet(fogletOptions)
    this._documents = []

    let nodejs = true
    let doc = new Document(this.options, this._foglet, nodejs)

    doc.on('close', () => {
      this.close()
    })


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

    let s = this.constructor.getCrateSession(sessionId)
    if (s._previous) {
      sessionId = s._previous.options.signalingOptions.session
    }

    this.constructor.focusOnSession(sessionId, s.options.signalingOptions.session)
  }

  close() {

    if (this._foglet) {
      this._foglet.unshare();
      this._foglet._networkManager._rps.network._rps.disconnect()
    }

    /**
     * this is to consider the case of nodejs version where there is no _view
     * @param  {[type]} this._documents[0]._view [description]
     * @return {[type]}                          [description]
     */
    if (this._documents[0]._view) {
      this._documents[0]._view._editor.stopPing()

      for (var marker in this._documents[0]._view._editor.markers) {
        clearInterval(marker.timer);
      }
    }
    //this._foglet = null
    //this._documents[0] = null

    setTimeout(() => {
       if (this._foglet) {
      this._foglet._networkManager._rps.network._rps.disconnect()
      this._foglet = null
      }
       this._document = null
    }, 2000);
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

  /**
   * [focusOnSession description]
   * @param  {[type]} moveToSession  move to this session it will be on the left of the screen
   * @param  {[type]} FocusedSession THis is will be focused to write in it
   * @return {[type]}                [description]
   */
  static focusOnSession(moveToSession, FocusedSession, editor = null) {
    jQuery('*[id^="container"]').removeClass('activeEditor')
    jQuery(`#container-${FocusedSession}`).addClass('activeEditor')
    let s
    if (editor) {
      editor.viewEditor.focus()
    } else {

      s = this.getCrateSession(FocusedSession)

      if (s._documents[0]._view) {
        s._documents[0]._view._editor.viewEditor.focus()
      } else {
        console.warn("There is no view for the following session" + s)
      }
    }

    jQuery('html, body').animate({
      scrollLeft: jQuery(`#container-${moveToSession}`).offset().left - 40
    }, 'slow');
  }

}

module.exports = session;