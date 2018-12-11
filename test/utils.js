import session from './../src/main'
import { Tarjan } from './tarjan'
import wrtc from 'wrtc'
var debug = require('debug')('CRATE:test:utils')
export class Simulation {
  constructor() {}

  async init(options, startSessionId = 0) {
    this.setSimulationOptions(options)

    this._unuglifySessionIDs = {}
    // const s = new session(this._crateOptions)
    this._sessions = []

    let waitingSessions = []
    for (let i = 0; i < this._nbSessions; i++) {
      waitingSessions.push(
        this.startSession(i).then(session => {
          debug(`session ${i}`)
          session.id = i
          this._sessions.push(session)
          this._unuglifySessionIDs[session._options.editingSessionID] = i
        })
      )
    }

    const LoadSessions = await Promise.all(waitingSessions)
  }

  async startSession(id) {
    let s = new session({ ...this._options.crateOptions })
    await this.documentLoaded(s)
    debug('Foglet %f connected.', id)
    return s
  }

  documentLoaded(session) {
    return new Promise((resolve, reject) => {
      session.on('new_document', doc => {
        resolve()
      })
    })
  }

  setSimulationOptions(options) {
    this._options = Object.assign(this.constructor.defaultOptions, options)
    this._nbSessions = this._options.nbSessions
    this._maxRandomTime = this._options.maxRandomTime
    this._nbRounds = this._options.nbRounds
    this._URL = this._options.URL
    this._preSimulationTime = this._options.preSimulationTime
    this._seed = this._options.seed
    this._useSignalingServer = this._options.useSignalingServer
    this._crateOptions = this._options.crateOptions
  }

  getSession(i) {
    return this._sessions[i]
  }

  getDocument(i) {
    return this._sessions[i]._documents[0]
  }
  getRandomTime() {
    return this.random() * this._maxRandomTime
  }

  foglet(i) {
    return this._sessions[i]._foglet
  }
  spray(i) {
    return this.foglet(i).overlay().network.rps
  }
  exchange(i) {
    this.spray(i)._exchange()
  }

  getAllNeighbors() {
    /*let allNeighbors = this._sessions.reduce((acc,curr)=>{
          acc.push(this.getNeighborsOf(curr))
        })*/
    let allNeighbors = []
    this._sessions.forEach(session => {
      const neighbors = this.getNeighborsOf(session)
      allNeighbors.push(neighbors)
    })
    return allNeighbors
  }

  getNeighborsOf(session) {
    let Neighbors = session._foglet.getNeighbours().map(uglyID => {
      return this.unuglifyID(uglyID)
    })

    //  debug("CRATE " + session.id + " : " + Neighbors.length, Neighbors,session._foglet.getNeighbours(), this._unuglifySessionIDs);
    return Neighbors
  }

  getText(i) {
    debug('CRATE ' + i)
    let text = this._sessions[
      i
    ]._documents[0]._view._editor.viewEditor.getText()
    debug(text)
    return text
  }

  getSequence(i) {
    let children = this._sessions[i]._documents[0].sequence.root.children
    return children
  }

  peekRandomChar() {
    let possible =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let char = possible.charAt(Math.floor(this.random() * possible.length))
    return char
  }

  pickRandomNodeID() {
    const chosenNode = Math.floor(this.random() * this._nbSessions)
    debug(`Node ${chosenNode} is chosen`)
    return chosenNode
  }
  random() {
    if (this._seed == -1) {
      return Math.random()
    } else {
      var x = Math.sin(this._seed++) * 10000
      return x - Math.floor(x)
    }
  }

  unuglifyID(id) {
    // remove the last two chars (.i.e -I or IO)
    let dirtyId = id.substring(0, id.length - 2)

    return this._unuglifySessionIDs[dirtyId]
  }

  clear() {
    this._sessions.forEach(session => {
      session.close()
    })

    this._seed = this._options.seed
  }

  isGraphConnected() {
    const tarjan = new Tarjan()

    const allNeighbors = this.getAllNeighbors()

    if (allNeighbors.length > 0) {
      return tarjan.test(allNeighbors, true)
    } else {
      console.warn(
        'The number of neighbours equals to 0, the sessions are not connected'
      )
      return false
    }
  }

  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Convert array of arrays to array of objects using a specific prototype
   * @param {*} array  array of arrays [[1,2,3],[4,5,6]...]
   * @param {*} prototype the protototype of each element in the array {ele1:0,ele2:0,ele3:0}
   * @returns [{ele1:1,ele2:2,ele3:3},{ele1:4,ele2:5,ele3:6}...]
   */
  static structureArray(array, prototype) {
    let structuredArray = []
    const keys = Object.keys(prototype)
    array.forEach(ele => {
      let structuedElement = {}
      ele.forEach((value, index) => {
        structuedElement[keys[index]] = value
      })
      structuredArray.push(structuedElement)
    })
    return structuredArray
  }
}

export function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

var configuration = {
  //    signalingServer: "https://172.16.9.236:3000",
  signalingServer: 'https://carteserver.herokuapp.com',
  ICEsURL: 'https://carteserver.herokuapp.com/ice',
  storageServer: 'https://storagecrate.herokuapp.com',
  stun: '23.21.150.121' // default google ones if xirsys not
}

/*var configuration = {
    //    signalingServer: "https://172.16.9.236:3000",
    signalingServer: "http://172.16.9.214:3000",
    ICEsURL: "http://172.16.9.214:3000/ice",
    storageServer: "https://storagecrate.herokuapp.com",
    stun: "23.21.150.121" // default google ones if xirsys not
  };
*/
// default options
let simulationOptions = {
  seed: 3,
  nbSessions: 5,
  maxRandomTime: 3 * 1000,
  nbRounds: 5,
  URL: 'http://127.0.0.1:8000/document.html?test',
  nbOfEdits: 5,
  preSimulationTime: 2 * 1000,
  useSignalingServer: true,
  crateOptions: {
    signalingOptions: {
      session: 'test',
      address: configuration.signalingServer
    },
    storageServer: configuration.storageServer,
    stun: configuration.stun, // default google ones if xirsys not
    ICEsURL: configuration.ICEsURL,
    containerID: 'content-default',
    display: false,
    PingPeriod: 100000,
    AntiEntropyPeriod: 100000,
    wrtc: wrtc
  }
}

session.config = simulationOptions.crateOptions
Simulation.defaultOptions = simulationOptions
