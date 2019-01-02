/**
 * Test connectivity
 * After Joining the network
 * After Shuffling
 */

import * as utils from './utils'
const Foglet = require('foglet-core').Foglet
const FogletUtils = require('./foglet-test-tools/utils.js')
var debug = require('debug')('CRATE:test:spray_test')
process.on('unhandledRejection', error => {
  // Prints "unhandledRejection woops!"
  debug('unhandledRejection ', error)
})

process.on('uncaughtException', error => {
  // Prints "unhandledRejection woops!"
  debug('uncaughtException', error)
})

var chai = require('chai')
var expect = chai.expect
var assert = chai.assert
const addContext = require('mochawesome/addContext')
process.setMaxListeners(0)
describe('Connectivity ', function() {
  const testingValues = [[50, 1, 5000], [100, 1, 5000]]
  //const testingValues = [[10, 1, 5000]]

  const prototype = { nbSessions: 0, nbTimes: 0, timeOut: 0 }
  const tests = utils.Simulation.structureArray(testingValues, prototype)

  tests.forEach(test => {
    it(`Test Join sessions ${test.nbSessions} (${
      test.nbTimes
    } times, timeout==${test.timeOut})`, async function() {
      this.timeout(20000)
      debug(
        `Test Join sessions ${test.nbSessions} (${
          test.nbTimes
        } times, timeout==${test.timeOut})`
      )
      let NbofConnectedNetworks = 0

      for (let i = 0; i < test.nbTimes; i++) {
        let sim = new utils.Simulation()
        const foglets = FogletUtils.buildFog(Foglet, test.nbSessions)
        await FogletUtils.pathConnect(foglets, 2000)
        debug(`{nbSessions:${test.nbSessions}}`)
        await sim.init({
          nbSessions: test.nbSessions,
          crateOptions: { foglets }
        })
        await utils.wait(test.timeOut)
        const isConnected = sim.isGraphConnected()
        sim.clear()
        if (isConnected) {
          NbofConnectedNetworks++
        }
      }

      addContext(
        this,
        `Connected Graphs ${NbofConnectedNetworks}/${test.nbTimes}`
      )
      debug(`Connected Graphs ${NbofConnectedNetworks}/${test.nbTimes}`)
      assert.isTrue(NbofConnectedNetworks === test.nbTimes)
    })
  })
})
