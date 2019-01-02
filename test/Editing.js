var debug = require('debug')('CRATE:test:Editing')
import * as utils from './utils'
/*const debug = function() {
  console.log(...arguments)
}*/
export class Editing {
  constructor(sim) {
    this._sim = sim
  }

  async initSimulator(simulationOptions) {
    this._sim = new simulation()
    await this._sim.init(simulationOptions)
    //await this.timeout(5000)
  }

  async insertRandomChartsByRandomNodes(timeBetweenInsertions, stringSize) {
    debug(
      `Random insertion by random nodes : NBsessions= ${
        this._sim._sessions.length
      }| stringSize = ${stringSize} `
    )

    for (let i = 0; i < stringSize; i++) {
      const randomID = this.pickRandomNodeID()
      const char = await this.insertRandomCharBy(randomID)
      //await this._sim.wait(timeBetweenInsertions)
      this._sim.syncWait(timeBetweenInsertions)
    }
  }

  async insertRemoveRandomChartsByRandomNodes(
    timeBetweenInsertions,
    stringSize
  ) {
    debug(
      `Random insertion by random nodes : NBsessions= ${
        this._sim._sessions.length
      }| stringSize = ${stringSize} `
    )

    let string = ''
    for (let i = 0; i < stringSize; i++) {
      const randomID = this.pickRandomNodeID()
      const char = await this.insertRandomCharBy(randomID)
      string += char
      const probabilityOfRemove = this.random()
      if (probabilityOfRemove <= 0.5) {
        const removedIndex = this.deleteRandomIndex(randomID)
        string = string.slice(0, removedIndex) + string.slice(removedIndex + 1)
      }
      this._sim.syncWait(timeBetweenInsertions)
    }
  }

  pickRandomNodeID() {
    const chosenNode = Math.floor(this.random() * this._sim._sessions.length)
    debug(`Node ${chosenNode} is chosen`)
    return chosenNode
  }

  random() {
    return this._sim.random()
  }

  async insertRandomCharBy(sessionID, position = null) {
    let char = this.peekRandomChar()

    if (!position) {
      position = this._sim.getDocument(sessionID).delta.ops.length
    }

    await this.insert(char, position, sessionID)
    return char
  }

  peekRandomChar() {
    let possible =
      'ABCDEF GHIJKL MNOPQ RSTUV WXYZab cdefgh ijklmn opqrstu vwxyz012 3456789 '
    let char = possible.charAt(Math.floor(this.random() * possible.length))
    return char
  }

  deleteRandomIndex(sessionID) {
    let indexToRemove = this.pickIndexToRemove(sessionID)
    this.delete(indexToRemove, sessionID)
    return indexToRemove
  }

  pickIndexToRemove(sessionID) {
    let maxPosition = this.getDelta(sessionID).ops.length - 1
    const randomIndex = Math.floor(Math.random() * maxPosition)
    return randomIndex
  }

  delete(index, sessionID) {
    this._sim
      .getDocument(sessionID)
      ._communication.textManager._removeManager.remove(index)
    debug(`Session ${sessionID} delete ${index}`)
  }

  async insert(char, position, sessionID) {
    const packet = { content: char, attributes: '' }
    const insertionObj = { packet, position }
    await this._sim
      .getDocument(sessionID)
      ._communication.textManager._insertManager.insert(insertionObj)
    debug(`Session ${sessionID} insert ${packet} at ${position}`)
  }

  areDocumentsTheSame() {
    const deltas = this._sim._sessions.map((session, index) => {
      return this.getDelta(index)
    })

    debug('Deltas', deltas)

    const causalities = this._sim._sessions.map((session, index) => {
      return session.causality
    })

    debug('causalities', causalities)

    const areTheSame = this._sim._sessions.reduce(
      (previous, session, index) => {
        return (
          previous &&
          JSON.stringify(deltas[0]) === JSON.stringify(this.getDelta(index))
        )
      },
      true
    )
    return areTheSame
  }

  getDelta(sessionID) {
    return this._sim.getDocument(sessionID).delta
  }
}
