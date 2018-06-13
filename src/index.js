import Document from "./document.js"
import {Foglet} from "foglet-core"
import shortid from "shortid"
import merge from "lodash.merge"
import store from "store"
import {EventEmitter} from "events"
import Marker from "./view/marker"
 

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

export default class session extends EventEmitter {
  constructor(options) {
    /**
     *  signalingServer: "https://carteserver.herokuapp.com/",
            storageServer: "https://storagecrate.herokuapp.com",
            stun: '23.21.150.121' // default google ones if xirsys not
            editingSession: from URL
            containerID:
            you have to generate ID at this point
     */
    super();
    this._defaultOptions= {...options}
    this._options = {...options}
    if (!options.foglet) {
      this.init();
    } else {
      this.justDoIt();
    }
  }

  /**
   * initialize connection to signaling server to get ICEs
   * @return {[type]} [description]
   */
  init() {
    console.log(this._options)
    const url = this._options.signalingServer + "/ice"
    fetch(url)
    .then((resp) => resp.json()) // Transform the data into json
    .then((addresses)=> {
      this._options.webRTCOptions = merge({
        config:{
          iceServers: [
            {
              url: this._options.stun,
              urls: this._options.stun
            }
          ]
        },
        
      }, {
        config: {
          iceServers: addresses.ice
        },
        trickle: true
      })
      this._options.webRTCOptions.config.iceServers.forEach(ice => {
        ice.urls = ice.url
      })
      console.log(this._options.webRTCOptions);
      this.justDoIt();

    })
  }

  justDoIt() {
    if (this._options.editingSession) {
      this._options.signalingOptions = {
        server: this._options.signalingServer,
        session: this._options.editingSession
      };

      if (store.get("CRATE2-" + this._options.editingSession)) {
        this._options.signalingOptions = {};
        this._options.importFromJSON = store.get(
          "CRATE2-" + this._options.editingSession
        );
        this._options.signalingOptions.connect = true; // (TODO) may change this val
      }
    }

    // #1 add a cell into the list of editors

    let uid = this.GUID();
    this._options.user = { id: uid, pseudo: "Anonymous" };
    if (this._options.display && store.get("myId")) {
      this._options.user = store.get("myId");
    }

    // Crate a session ID
    // Crate with foglet object and Documents array
    // Create a default index document and add it to documents array
    // Options configuration

    this._previous = null;
    this._next = null;

    let session = this.constructor;
    if (!session.actualSession || session.actualSession == null) {
      session.actualSession = this;
      session.lastSession = this;
      session.headSession = this;
    } else {
      session.lastSession._next = this;
      this._previous = session.lastSession;
      session.lastSession = this;
      session.actualSession = this;
    }

    // WEBRTC
    var webRTCOptions = this._options.webRTCOptions
     /* (this._options && ) ||
      (this._options &&
        this._options.importFromJSON &&
        this._options.importFromJSON.webRTCOptions) ||
      {};
*/
    if (this._options.wrtc) {
      webRTCOptions.wrtc = this._options.wrtc;
    }

    // Storage Server
    const storageServer = (this._options && this._options.storageServer) || "";

    // Session ID
    const sessionId = this.constructor.GUID();

    // Signling Server
    const signalingOptions = merge(
      {
        address: this._options.signalingServer,
        session: sessionId
      },
      this._options &&
        this._options.importFromJSON && 
        this._options.importFromJSON.signalingOptions,
      (this._options && this._options.signalingOptions) || {}
    );

    signalingOptions.room = signalingOptions.session; // todo:toremove

    //Foglet
    //

    this._editingSessionID =
      this._options.user.id + "-" + this.constructor.GUID();

    let fogletOptions = {
      id: this._editingSessionID,
      verbose: true, // want some logs ? switch to false otherwise
      rps: {
        type: "spray-wrtc",
        options: {
          protocol: signalingOptions.sessionId, // foglet running on the protocol foglet-example, defined for spray-wrtc
          webrtc: webRTCOptions,
          timeout: 30 * 1000, // spray-wrtc timeout before definitively close a WebRTC connection.
          pendingTimeout: 30 * 1000,
          delta: 30 * 1000, // spray-wrtc shuffle interval
          signaling: signalingOptions // signaling options
        }
      }
    };

    this._options.name =
      (this._options && this._options.name) ||
      (this._options &&
        this._options.importFromJSON &&
        this._options.importFromJSON.title) ||
      "Untitled document";

    this._options = merge(this._options, {
      webRTCOptions,
      storageServer,
      signalingOptions,
      fogletOptions
    });

    this._options.editingSessionID = this._editingSessionID;

    if (!this._options.foglet) {
      this._options.webRTCOptions.trickle = true;
    }

    this._foglet = new Foglet(fogletOptions);

    this._documents = [];
    let doc = new Document(this._options, this._foglet);
    this._documents.push(doc);

    doc.init().then(()=>{
      this.emit("new_document", doc);
      
    })
  }

  GUID() {
    return shortid.generate();
  }

  getNext() {
    return _next;
  }

  getId() {
    return this._options.signalingOptions.session;
  }
  getPrevious() {
    return _previous;
  }

  moveToNext() {
    if (this._next != null) {
      this.constructor.actualSession = this._next;
      this.goTo(this.constructor.actualSession.getId());
    }
  }

  moveToPrevious() {
    if (this._previous != null) {
      this.constructor.actualSession = this._previous;
      this.goTo(this.constructor.actualSession.getId());
    }
  }

  goTo(sessionId) {
    let s = this.constructor.getCrateSession(sessionId);
    if (s._previous) {
      sessionId = s._previous.getId();
    }

    this.constructor.focusOnSession(sessionId, s.getId());
  }

  close() {
    this._foglet.unshare();
    this._foglet._networkManager._rps.network._rps.disconnect();

    this._documents[0]._view._editor.stopPing();
    clearInterval(this._documents[0]._view._timerStorageServer);
    for (var marker in this._documents[0]._view._editor.markers) {
      clearInterval(marker.timer);
    }

    //this._foglet = null
    //this._documents[0] = null

    setTimeout(() => {
      this._foglet._networkManager._rps.network._rps.disconnect();
      this._document = null;
      this._foglet = null;
    }, 2000);
  }

  static getCrateSession(id) {
    let found = false;
    var search = this.headSession;
    while (!found && search !== null) {
      let sessionId = search.getId();
      if (id === sessionId) {
        return search;
      }
      search = search._next;
    }
    return false;
  }

  static GUID() {
    return shortid.generate();
  }

  /**
   * [focusOnSession description]
   * @param  {[type]} moveToSession  move to this session it will be on the left of the screen
   * @param  {[type]} FocusedSession THis is will be focused to write in it
   * @return {[type]}                [description]
   */
  static focusOnSession(moveToSession, FocusedSession, editor = null) {
    jQuery('*[id^="container"]').removeClass("activeEditor");
    jQuery(`#container-${FocusedSession}`).addClass("activeEditor");
    let s;
    if (editor) {
      editor.viewEditor.focus();
    } else {
      s = session.getCrateSession(FocusedSession);

      if (s._documents[0]._view) {
        s._documents[0]._view._editor.viewEditor.focus();
      } else {
        console.warn("There is no view for the following session" + s);
      }
    }

    jQuery("html, body").animate(
      {
        scrollLeft: jQuery(`#container-${moveToSession}`).offset().left - 40
      },
      "slow"
    );
  }

  static openIn() {
    // get all links
    // change the links function calls
    let links = $("#content-default a");

    for (var link of links) {
      if (link.href.includes(window.location.href.split("?")[0])) {
        link.onclick = function() {
          let editingSession = this.href.split("?")[1];
          const s = session.getCrateSession(editingSession);
          if (s._previous) {
            editingSession = s._previous.getId();
          }
          if (jQuery(`#container-${editingSession}`).length) {
            session.focusOnSession(editingSession, this.href.split("?")[1]);
          } else {

            const opts= Object.assign({...session.actualSession._defaultOptions},{editingSession})
            var sess = new session(opts);
          }
        };
      }
    }
  }
}

session.Marker = Marker

