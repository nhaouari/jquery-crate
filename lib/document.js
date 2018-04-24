//const View = require('./view.js')
//
const jsonfile = require('jsonfile')
const shortid = require('shortid')
const Foglet = require('foglet-core').Foglet
const Communication = require('foglet-core').communication
const Core = require('./crate-core/lib/crate-core.js');
const store = require('store')
const EventEmitter = require('events').EventEmitter;
var $
require("jsdom/lib/old-api").env("", (err, window) => {
  if (err) {
    console.error(err);
    return;
  }

  $ = require("jquery")(window);
});


class doc extends EventEmitter {
  constructor(options, foglet, nodejs = false) {
    super()
    this._foglet = foglet
    this._foglet.share()

    this.name = options.name;
    this.date = new Date(); // (TODO) change

    //User ID
    if (store.get('myId')) {
      this.uid = store.get('myId').id;
    } else {
      this.uid = GUID();
    }


    /**
     * connect to the session of the document
     */
    this._foglet.connection()
      .then(() => {
        console.log('application connected!')
        this._data_comm = new Communication(this._foglet.overlay().network, "anti-entropy")
        this._behaviours_comm = new Communication(this._foglet.overlay().network, "No-anti-entropy")

        this.core = new Core(this.uid, {
          webrtc: options.webRTCOptions,
          signalingOptions: options.signalingOptions,
          editingSessionID: options.editingSessionID,
          changesTimeOut: options.changesTimeOut
        }, this._data_comm, this._behaviours_comm);

        // send actual title after anti-antropy 
        this.core.on('sendChangeTitle', () => {
          this.core.sendChangeTitle(this.name);
        })

        this.core.on('changeTitle', (title) => {
          this.name = title

          if (!nodejs && this._view) {
            this.emit('changeTitle', title);
          }
        })

        // the users are no longer editing, so do the necessary actions
        this.core.on('outdated', () => {
          if (nodejs) {
            this.saveDocument()
            console.log('Document ' + options.signalingOptions.session + ' is in sleeping mode')
            this.emit('close')
            /**
             * this is to remove the document from the server index
             * @type {[type]}
             */
            process.send({
              type: "kill",
              id: options.signalingOptions.session
            })


          }
        })

        // #1B if it is imported from an existing object, initialize it with these
        if (options.importFromJSON) {
          this.core.init(options.importFromJSON);
        };

        // #2 grant fast access

        this.broadcast = this._data_comm.broadcast
        this.broadcastCaret = this._behaviours_comm.broadcast
        this.rps = this._data_comm.network.rps
        this.sequence = this.core.sequence
        this.causality = this.broadcast._causality
        this.signalingOptions = options.signalingOptions

        // Add options for the view 
        // todo: add the required options
        this.options = $.extend(options, {
          view: {}
        })

        let containerID = "content-default"
        if (!nodejs) {
          this._view = new View(options, this, containerID)
        }
        this._foglet.emit('connected')

      })
  }



  GUID() {
    return shortid.generate();
  };

  /**
   * saveDocument save the document in local storage
   * @return {[type]} [description]
   */
  saveDocument() {
    var timeNow = new Date().getTime()
    var document = {
      date: timeNow,
      title: this.name,
      delta: {},
      sequence: this.sequence,
      causality: this.causality,
      name: this.name,
      webRTCOptions: this.webRTCOptions,
      markers: {},
      signalingOptions: this.signalingOptions
    }

    var file = `./tmp/crate-${this.signalingOptions.session}.json`

    jsonfile.writeFile(file, document, function(err) {
      console.error(err)
    })

  }


}

module.exports = doc