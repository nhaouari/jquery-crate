import shortid from "shortid"
import {Foglet,communication} from "foglet-core"
import Core from "./crate-core/crate-core.js"
import {EventEmitter} from "events"


export default class doc extends EventEmitter {
  constructor(options, foglet) {
    super();
    this._foglet = foglet
    this._options=options

    this.name = options.name;
    this.date = new Date(); // (TODO) change

    //User ID
    this.user = options.user;
    this.uid = this.user.id;

    /**
     * connect to the session of the document
     */

  }
  async init() {
    let options = this._options


    let promise = undefined
    if (options.foglet) {
      promise = await this._foglet.connection(options.foglet);
    } else {
      this._foglet.share();
      promise = await this._foglet.connection();
    }
      console.log("application connected!");
      this._data_comm = new communication(
        this._foglet.overlay().network,
        "anti-entropy"
      );
      this._behaviours_comm = new communication(
        this._foglet.overlay().network,
        "No-anti-entropy"
      );

      this.core = new Core(
        this.uid,
        {
          webrtc: options.webRTCOptions,
          signalingOptions: options.signalingOptions,
          editingSessionID: options.editingSessionID
        },
        this._data_comm,
        this._behaviours_comm
      );

      // send actual title after anti-antropy
      this.core.on("sendChangeTitle", () => {
        this.core.sendChangeTitle(this.name);
      });

      this.core.on("changeTitle", title => {
        this.title = title;
        this.name = title;
        this.emit("changeTitle", title);
      });

      // #1B if it is imported from an existing object, initialize it with these
      if (options.importFromJSON) {
        this.core.init(options.importFromJSON);
      }

      // #2 grant fast access

      this.broadcast = this._data_comm.broadcast;
      this.broadcastCaret = this._behaviours_comm.broadcast;
      this.rps = this._data_comm.network.rps;
      this.sequence = this.core.sequence;
      this.causality = this.broadcast._causality;
      this.signalingOptions = options.signalingOptions;
      
      if (options.display) {
        const {View} = await import(/* webpackMode: "eager", webpackChunkName: "Crate-View" */ "./View.js")
        this._view = new View(options, this, options.containerID);
      }
      
      this._foglet.emit("connected");
      this.emit("connected");

}
}

