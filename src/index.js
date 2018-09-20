import Document from "./document.js"
import {
  Foglet
} from "foglet-core"
import shortid from "shortid"
import merge from "lodash.merge"
import store from "store"
import {
  EventEmitter
} from "events"
import Marker from "./communication/MarkerManager/marker"
import fetch from 'node-fetch'


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
 
 
 /**
  * 
  * @param {*} options the different options of the document.
  * @example 
  const options = {
  signalingOptions:{
    session:editingSession,
    address:configuration.signalingServer
  },
  storageServer: configuration.storageServer,
  stun: configuration.stun, // default google ones if xirsys not
  containerID: "content-default",
  display: true
}
  */
  constructor(options) {
    /**
     *      signalingServer: "https://carteserver.herokuapp.com/",
            storageServer: "https://storagecrate.herokuapp.com",
            stun: '23.21.150.121' // default google ones if xirsys not
            editingSession: from URL
            containerID:
            you have to generate ID at this point
     */
    super();

    console.log(options)
    // use defaultOptions to use them when we open other sessions
    //@todo: make these options global
    this._defaultOptions = { ...options}
    this._options = { ...options}
    this.openDocument();
  }
/**
 * open the document based on the given parameters
 */
async openDocument() {
   
    await this.setOptions() 

    this.putSessionInTheList() 

    this.buildDocument()
  }

/**
 * set the different options for the created document
 */
async setOptions() {
  this.setSignalingOptions()
    
  await this.setWebRTCOptions()
  
  this.setUser()
  
  this.setDocumentTitle()
  // This is id to ensure that we can open the same session in different tabs with (id of document + random text)
  this.setTemporarySessionID()

  this.setFogletOptions ()
}

/**
* build the document and add it to the list of the documents
@description here we considered that one session contains one document.  when we created another document in the same page is in another session, if it is not action's opened it will received the changes. 
@todo add the possibility of adding other document in the same session, so all the changes will taken into consideration even if the open document is different. 
 this is will be an optional choice for the users because it could create a high overhead in the network, 
 for example in the case of a large number of linked document any change in any document will be broadcasted to all the users. 
*/

  buildDocument(){
    this._documents = [];
    const doc = new Document(this._options, this._foglet);
    this._documents.push(doc);

    doc.init().then(() => {
      this.emit("new_document", doc);
    })
  }

  /** 
   * set Temporary Session ID to be able to open the document in different tabs for the same user.
   * @description foglet is based on the id of the user, it will not work in the case of having two users with same id, this why we have add to the user id 
   * a random part to consider each tab as separate user in foglet but it will be considerd the same user in CRATE. 
   */

  setTemporarySessionID() {
    this._editingSessionID =
    this._options.user.id + "-" + this.constructor.GUID();
    this._options.editingSessionID = this._editingSessionID;
  }

/**
 * set Document Title
 */
  setDocumentTitle()
  {
    this._options.name =
    (this._options && this._options.name) ||
    (this._options &&
      this._options.importFromJSON &&
      this._options.importFromJSON.title) ||
    "Untitled document";
  }

  /**
   * set the user information
   * @description the default user is random if it is not stored in local storage of the browser.
   */
  setUser(){

    let uid = this.GUID();
    this._options.user = {
      id: uid,
      pseudo: "Anonymous"
    };

    if (this._options.display && store.get("myId")) {
      this._options.user = store.get("myId");
    }
  }

  /**
   * set WebRTCOptions
   * @description  set the default options of ice Servers and replace them by the ice server if it is possible. if it run in node js use wrtc.
  */
  async setWebRTCOptions() {
    if (!this._options.foglet) {
    const addresses = await this.getICEs()

    this._options.webRTCOptions = merge(this._options.webRTCOptions ,{
      config: {
        iceServers: [{
          url: this._options.stun,
          urls: this._options.stun
        }]
      },

    }, {
      config: {
        iceServers: addresses.ice
      },
      trickle: true,
    })

    this._options.webRTCOptions.config.iceServers.forEach(ice => {
      ice.urls = ice.url
    })
  }
 
  
 if (this._options.wrtc) {
   this._options.webRTCOptions.wrtc = this._options.wrtc
    }
  
  }


  /**
   * Get ICES from signaling server
   * @description here twillo is used to get list of ICEs servers, the script that generates the list of the servers is in the configuration "https://carteserver.herokuapp.com/ice" 
   */
  async getICEs() {
    return new Promise((resolve, reject) =>{
    const url = this._options.ICEsURL
    fetch(url)
      .then((resp) => resp.json()) // Transform the data into json
      .then((addresses) => {
        resolve(addresses)
      })
    })
    }

  /**
   * Put the session the list of the different sessions, which is a static variable in the class.
   * @param {*} session 
   */
  putSessionInTheList(){
    let session = this
    session._previous = null;
    session._next = null;

    let sessionClass = this.constructor;

    sessionClass.updateLength({insert:1})


    if (!sessionClass.actualSession || sessionClass.actualSession == null) {
      sessionClass.actualSession = session;
      sessionClass.lastSession = session;
      sessionClass.headSession = session;
    } else {
      sessionClass.lastSession._next = session;
      session._previous = sessionClass.lastSession;
      sessionClass.lastSession = session;
      sessionClass.actualSession = session;
    }
  }


/**
 * set Signaling Options this includes the session ID and the signaling server
 * 
 */
  setSignalingOptions() {
    
    const sessionID = this._options.signalingOptions.session
    if (store.get("CRATE2-" + sessionID)) {
        
      this._options.importFromJSON = store.get(
          "CRATE2-" + sessionID
        );

        this._options.signalingOptions =  this._options.importFromJSON.signalingOptions;
      }
       // Storage Server
      
      this._options.storageServer  = (this._options && this._options.storageServer) || "";
  
    }

  /**
   *  set Foglet options
   */
  setFogletOptions() {

    const fogletOptions = {
      id: this._options.editingSessionID,
      verbose: true, // want some logs ? switch to false otherwise
      rps: {
        type: "spray-wrtc",
        options: {
          a:1,
          b:5,
          protocol:this._options.signalingOptions.session, // foglet running on the protocol foglet-example, defined for spray-wrtc
          webrtc:  this._options.webRTCOptions,
          timeout: 1200 * 1000, // spray-wrtc timeout before definitively close a WebRTC connection.
          pendingTimeout: 1200 * 1000,
          delta: 1200 * 1000, // spray-wrtc shuffle interval
          signaling:{...this._options.signalingOptions,room:this._options.signalingOptions.session} // signaling options
        }
      }
    };

    this._options = merge(this._options, {
      fogletOptions
    });


    this._foglet = new Foglet(this._options.fogletOptions);
  }

 /**
  * Function that generates random ID.
  */
  GUID() {
    return shortid.generate();
  }

  /**
   *  get the id of the session
   */
  getId() {
  return this._options.signalingOptions.session;
  }

  /*
   *  get the next session (in the same webpage)
   */
  getNext() {
    return _next;
  }

  /*
   *  get the previous session (in the same webpage)
   */
  getPrevious() {
    return _previous;
  }

  /**
   * focus on the next session
   */
  moveToNext() {
    if (this._next != null) {
      this.constructor.actualSession = this._next;
      this.goTo(this.constructor.actualSession.getId());
    }
  }

  /**
   * focus on the previous session
   */
  moveToPrevious() {
    if (this._previous != null) {
      this.constructor.actualSession = this._previous;
      this.goTo(this.constructor.actualSession.getId());
    }
  }
/**
 * focus to a session based on sessionID
 * @param {*} sessionId 
 */
  goTo(sessionId) {
    const s = this.constructor.getCrateSession(sessionId);
    if (s._previous) {
      sessionId = s._previous.getId();
    }

    this.constructor.focusOnSession(sessionId, s.getId());
  }

  /**
   * close the session and stop the different timers
   */
  close() {
    this._documents[0].close()
    }
  
  static getCrateSession(id) {
    let found = false;
    var search = this.headSession
    while (!found && search !== null) {
      let sessionId = search.getId();
      if (id === sessionId) {
        found = true
        return search
      }
      search = search._next
    }
    return -1;
  }

  static updateLength({insert,remove}){

    if(this.number) {
      if(insert) this.number+=insert;
      if(remove) {
        this.number-=remove
     
      }
      this.updateViews()
    } else {
      this.number = insert
    } 
  }
  
  
  static updateViews(){
    let number= this.number

    let sessions=this.getSessions()

    console.log(sessions);
    sessions.forEach((session)=>{
      if(number===1) {
        session._documents[0]._view.fullScreen()
      } else {
        session._documents[0]._view.splitedScreen()
      }
      

    })

  }
  
  static getSessions(){

    let start = this.headSession
    let sessions=[]
    while (start !== null) {
      sessions.push(start)
      start = start._next
    }

    return sessions
  }

  static GUID() {
    return shortid.generate()
  }

  /**
   * [focusOnSession description]
   * @param  {[type]} moveToSession  move to this session it will be on the left of the screen
   * @param  {[type]} FocusedSession THis is will be focused to write in it
   * @return {[type]}                [description]
   */
  static focusOnSession(moveToSession, FocusedSession, editor = null) {
    jQuery('*[id^="container"]').removeClass("activeEditor")
    jQuery(`#container-${FocusedSession}`).addClass("activeEditor")
    let s
    if (editor) {
      editor.viewEditor.focus()
    } else {
      s = session.getCrateSession(FocusedSession)

      if (s._documents[0]._view) {
        s._documents[0]._view._editor.viewEditor.focus()
      } else {
        console.warn("There is no view for the following session" + s)
      }
    }
    jQuery("html, body").animate({
        scrollLeft: jQuery(`#container-${moveToSession}`).offset().left - 40
      },
      "slow"
    )
  }

  static openIn() {
    // get all links
    // change the links function calls
    const links = $("#content-default a");

    for (var link of links) {
      if (link.href.includes(window.location.href.split("?")[0])) {
        link.onclick = function () {
          let editingSession = this.href.split("?")[1];
          const s = session.getCrateSession(editingSession);
          if (s._previous) {
            editingSession = s._previous.getId();
          }
          if (jQuery(`#container-${editingSession}`).length) {
            session.focusOnSession(editingSession, this.href.split("?")[1]);
          } else {
            const opts = Object.assign({ ...session.actualSession._defaultOptions
            }, {
              signalingOptions: {
                session:editingSession
            }
          })

            console.log("options =",opts);
            var sess = new session(opts);
          }
        };
      }
    }
  }

  static removeSession(sessionID){
    let crateSession = this.getCrateSession(sessionID)

   
     if (this.headSession !== crateSession) {

       // remove the crateSession for the list 
       if (crateSession._previous) {
         crateSession._previous._next = crateSession._next
       }

       if (crateSession._next) {
         crateSession._next._previous = crateSession._previous
       } else {
         this.lastSession = crateSession._previous
       }

  }
  this.updateLength({remove:1})
}
}

session.Marker = Marker