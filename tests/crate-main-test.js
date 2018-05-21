const session = require('../lib/session.js');
const wrtc = require('wrtc')
session.config = {
  signalingServer: "https://carteserver.herokuapp.com",
  storageServer: "https://storagecrate.herokuapp.com",
  stun: '23.21.150.121', // default google ones if xirsys not
  containerID: 'content-default',
  display: false
}



class simulation {
  constructor(SimulationOptions) {
    this.setSimulationOptions(SimulationOptions)
    this._indexsOfSessions = new Array(this._nbSessions).fill(0)
    this._allsessionIDs = Array.apply(null, {
      length: this._nbSessions
    }).map(Number.call, Number)
    this.init()
  }

  init() {
    console.log("initializing sessions")
    this._sessions = []
    for (var i = 0; i < this._nbSessions; i++) {
      this._sessions.push(new session({
        editingSession: 'test',
        wrtc: wrtc
      }))
    }

    setTimeout(() => {
    //  this.connect().then(() => {
    //    console.log("All sessions are connected")
        this.Simulation()
    //  })

    }, 10*1000)

  }

  setSimulationOptions(SimulationOptions) {
    this._nbSessions = SimulationOptions.nbSessions
    this._maxRandomTime = SimulationOptions.maxRandomTime
    this._nbRounds = SimulationOptions.nbRounds
  }

  connect() {
    return Promise.all(this._sessions.map(session => {
      return (session._documents['0']._foglet.connection());
    }))
  }



  Simulation() {
    console.log("Simulation Starts")
    this.simulateEditing().then(() => {
      this.AreSequencesTheSame()
    })
  }

  simulateEditing() {
    return Promise.all(this._allsessionIDs.map(sessionID => {
      return this.sendRandomCharAtRandomTime(sessionID)
    }))
  }

  sendRandomCharAtRandomTime(sessionID) {
    return new Promise((resolve, reject) => {
      let time = this.getRandomTime()
      setTimeout(() => {
        let char = this.insertRandomCharBy(sessionID)
        console.log('session ' + sessionID + 'send random text => ' + char + ' after waiting ==> ' + time)
        resolve()
      }, time)
    })
  }

  getRandomTime() {
    return Math.random() * this._maxRandomTime
  }

  insertRandomCharBy(sessionID) {
    let char = this.peekRandomChar();
    this.insert(char, this._indexsOfSessions[sessionID], sessionID)
    this._indexsOfSessions[sessionID] = this._indexsOfSessions[sessionID] + 1
    return char
  }

  insert(char, index, sessionID) {
    debugger
    this._sessions[sessionID]._documents['0'].core.insert(char, index)
  }

  AreSequencesTheSame() {
    let success = true
    let sequence = this.getSequence(0)
    for (var i = 1; i < this._nbSessions; i++) {
      let sequence2 = this.getSequence(i)
      if (sequence2 != sequence) {
        success = false
        console.log('sequence of session ' + i + ' is different')
      }
    }
    return success
  }

  getSequence(i) {
    console.log('Session '+i)
    console.log(this._sessions[i]._documents['0'].core.sequence.root)
    return JSON.stringify(this._sessions[i]._documents['0'].core.sequence.root)
  }

  peekRandomChar() {
    let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    let char = possible.charAt(Math.floor(Math.random() * possible.length))
    return char
  }


}

let simulationOptions = {
  nbSessions: 5,
  maxRandomTime: 5 * 1000,
  nbRounds: 10
}

let sim = new simulation(simulationOptions)