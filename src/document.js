import { EventEmitter } from 'events'

import LSEQTree from 'lseqtree'
import { Communication } from './communication/Communication'
import Marker from './view/marker'
var debug = require('debug')('CRATE:Document')

export default class Document extends EventEmitter {
  constructor(options, documentIndex, crate) {
    super()
    this._options = options
    this.documentIndex = documentIndex
    this.crate = crate
    this.documentId = this._options.signalingOptions.session
    this._lastChanges = new Date().getTime()
    this.documentActiveWatcher
    this.state = 'active'
    this.name = options.name
    //User ID
    this.user = options.user
    this.uid = this.user.id
    this.lastSentMsgId = null
    this.sleepingMonitor = false
  }

  async initView() {
    if (this._options.display) {
      const {
        View
      } = await import(/* webpackMode: "eager", webpackChunkName: "Crate-View" */ './View.js')
      this._view = new View(this._options, this, this._options.containerID)
    }
  }

  /**
   * connect to the session of the document
   */
  async init() {
    let options = this._options
    this._communication = new Communication({
      document: this,
      ...this._options
    })

    await this._communication.initConnection()

    this.sequence = new LSEQTree(
      this._communication._data_comm.broadcast._causality.local.e
    )

    this.delta = { ops: [] }

    /* TODO:Think about the creation of modules without view */
    await this._communication.initModules()

    // #1B if it is imported from an existing object, initialize it with these

    // #2 grant fast access
    this._foglet = this._communication._foglet
    this.broadcast = this._communication._data_comm.broadcast
    this.broadcastCaret = this._communication._behaviors_comm.broadcast
    this.rps = this._communication._data_comm.network.rps

    this.signalingOptions = options.signalingOptions

    if (options.importFromJSON) {
      await this.loadFromJSON(options.importFromJSON)
    }
    this.causality = this.broadcast._causality
    if (options.display) {
      this._view.init()
    }

    this.emit('connected')
  }

  setMessageState(msg) {
    if (this._options.display) {
      this._view.setMessageState(msg)
    }
  }
  /**
   * setLastChangesTime set the last time of changes
   */
  setLastChangesTime() {
    this._lastChanges = new Date().getTime()
    this.refreshDocument(this.sequence)
    this.emit('changed')
    this.activityDetected()
  }

  activityDetected() {
    if (this.sleepingMonitor) {
      if (this.state === 'sleep') {
        //TODO:wake up the server if it exists
      }
      this.state = 'active'
      this.resetSleepTimer()
    }
  }
  startSleepMonitor() {
    this.sleepingMonitor = true
    this.state = 'active'
    this.resetSleepTimer()
  }

  stopSleepMonitor() {
    clearTimeout(this.documentActivityWatcher)
    this.state = 'active'
    this.sleepingMonitor = false
  }

  /**
   * Reset the sleep timer
   */
  resetSleepTimer() {
    clearTimeout(this.documentActivityWatcher)
    this.documentActivityWatcher = setTimeout(() => {
      this.state = 'sleep'
      this.emit('sleep')
    }, this._options.documentActivityTimeout)
  }
  /*!
   * \brief create the core from an existing object
   * \param object the object to initialize the core model of crate containing a 
   * sequence and causality tracking metadata
   */
  async loadFromJSON(object) {
    this.broadcast._causality = this.broadcast._causality.constructor.fromJSON(
      object.causality
    )
    const local = this.broadcast._causality.local

    this._communication._behaviors_comm.broadcast._causality.local.e = local.e

    this.sequence.fromJSON(object.sequence)
    this.sequence._s = local.e
    this.sequence._c = local.v
    this.getDeltaFromSequence()
      .then(delta => {
        this.delta = delta
      })
      .catch(err => {
        console.error(err)
      })

    debugger
  }

  /**
   * saveDocument save the document in local storage
   * @return {[type]} [description]
   */
  saveDocument() {
    try {
      const timeNow = new Date().getTime()
      const document = {
        date: timeNow,
        title: this.name,
        delta: this._view._editor.viewEditor.editor.delta,
        sequence: this.sequence,
        causality: this.causality,
        name: this.name,
        webRTCOptions: this.webRTCOptions,
        markers: {},
        signalingOptions: this.signalingOptions
      }
      store.set('CRATE2-' + this.signalingOptions.session, document)

      debug('Document saved => ', document)
      return true
    } catch (error) {
      console.error(error)
      return false
    }
  }

  refreshDocument(sequence, WhoWriteIt = false) {
    if (this._options.display) {
      clearTimeout(this.refreshDocumentTimeout)
      this.refreshDocumentTimeout = setTimeout(() => {
        let range = this._view._editor.viewEditor.getSelection()
        this._view._editor.viewEditor.setContents(this.getDelta(), 'silent')
        this._view._editor.viewEditor.setSelection(range, 'silent')
        this._view._editor.updateCommentsLinks()
        this.getDeltaFromSequence().then(delta => {
          this.delta = delta
          let range = this._view._editor.viewEditor.getSelection()
          this._view._editor.viewEditor.setContents(this.getDelta(), 'silent')
          this._view._editor.viewEditor.setSelection(range, 'silent')
          this._view._editor.updateCommentsLinks()
        })
      }, 10)
    }
  }

  getDelta(delta = this.delta) {
    let ops = delta.ops.slice(0)
    ops.push({ insert: '\n' })
    return { ops }
  }

  getDeltaFromSequence(WhoWriteIt = false) {
    return new Promise((resolve, reject) => {
      let LSEQNodes = this.getLSEQNodes()
      let ops = []

      LSEQNodes.forEach(node => {
        let op = { insert: node.e.content, attributes: node.e.attributes }
        if (WhoWriteIt) {
          const id = node.t.s
          op.attributes.color = Marker.getColor(id)
        }
        ops.push(op)
      })

      const delta = { ops }
      resolve(delta)
    })
  }

  getLSEQNodes() {
    let LSEQNodeArray = []
    const root = this.sequence.root

    let preorder = node => {
      if (node.e && node.e != '') {
        LSEQNodeArray.push(node)
      }
      const children = node.children
      children.forEach(child => {
        preorder(child)
      })
    }

    preorder(root)
    return LSEQNodeArray
  }

  reload() {
    this._communication.close()

    if (this._view) {
      this._view.close()
    }

    this.init()
  }
  close() {
    this._communication.close()
    clearTimeout(this.documentActivityWatcher)
    clearTimeout(this.refreshDocumentTimeout)
    if (this._view) {
      this._view.close()
    }

    this.crate.removeDocument(this.documentIndex)
  }

  /**
   *  get the id of the session
   */
  getId(options) {
    return options.signalingOptions.session
  }

  /**
   * focus on the next session
   */

  moveToNext() {
    this.crate.moveToNext(this.documentId)
  }

  /**
   * focus on the previous session
   */

  moveToPrevious() {
    this.crate.moveToPrevious(this.documentId)
  }

  createNewDocument(documentId) {
    this.crate.createNewDocument(documentId)
  }
}
