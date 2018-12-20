/**
 * Test connectivity
 * After Joining the network
 * After Shuffling
 */

import * as utils from './utils'

import { Editing } from './Editing'
const Foglet = require('foglet-core').Foglet
const FogletUtils = require('./foglet-test-tools/utils.js')
//var debug = require('debug')('CRATE:test:spray_test')

const debug = function() {
  console.log(...arguments)
}
process.on('unhandledRejection', error => {
  // Prints "unhandledRejection woops!"
  // debug('unhandledRejection ', error)
})

process.on('uncaughtException', error => {
  // Prints "unhandledRejection woops!"
  // debug('uncaughtException', error)
})

var chai = require('chai')
var expect = chai.expect
var assert = chai.assert
const addContext = require('mochawesome/addContext')

describe('Editing Test ', function() {
  this.timeout(20000)

  const testingValues = [[10, 50, 10, 1]]
  const prototype = {
    nbSessions: 0,
    timeBetweenInsertions: 0,
    stringSize: 0,
    times: 0
  }
  const tests = utils.Simulation.structureArray(testingValues, prototype)

  tests.forEach(async test => {
    for (let i = 0; i < test.times; i++) {
      it(`Testing insertion Nbsessions ${
        test.nbSessions
      }, timeBetweenInsertions ${test.timeBetweenInsertions},stringSize ${
        test.stringSize
      }`, async function() {
        const areThereTheSame = await insertRandomChartsByRandomNodes(test)
        assert.isTrue(areThereTheSame)
      })

      it(`Testing insertion&&remove Nbsessions ${
        test.nbSessions
      }, timeBetweenInsertions ${test.timeBetweenInsertions},stringSize ${
        test.stringSize
      }`, async function() {
        const areThereTheSame = await insertRemoveRandomChartsByRandomNodes(
          test
        )
        assert.isTrue(areThereTheSame)
      })
    }
  })
})

async function insertRandomChartsByRandomNodes({
  nbSessions,
  timeBetweenInsertions,
  stringSize
}) {
  debug(
    `Testing editing Nbsessions ${nbSessions}, timeBetweenInsertions ${timeBetweenInsertions},stringSize ${stringSize}`
  )
  const sim = new utils.Simulation()
  const foglets = FogletUtils.buildFog(Foglet, nbSessions)
  await FogletUtils.pathConnect(foglets, 2000)
  debug(`{nbSessions:${nbSessions}}`)
  await sim.init({
    nbSessions: nbSessions,
    crateOptions: { foglets }
  })
  const editing = new Editing(sim)
  await editing.insertRandomChartsByRandomNodes(
    timeBetweenInsertions,
    stringSize
  )
  sim.clear()
  await FogletUtils.clearFoglets(foglets)
  await utils.wait(1000)
  const areTheSame = editing.areDocumentsTheSame()
  return areTheSame
}

async function insertRemoveRandomChartsByRandomNodes({
  nbSessions,
  timeBetweenInsertions,
  stringSize
}) {
  debug(
    `Testing editing Nbsessions ${nbSessions}, timeBetweenInsertions ${timeBetweenInsertions},stringSize ${stringSize}`
  )
  const sim = new utils.Simulation()
  const foglets = FogletUtils.buildFog(Foglet, nbSessions)
  await FogletUtils.pathConnect(foglets, 2000)
  debug(`{nbSessions:${nbSessions}}`)
  await sim.init({
    nbSessions: nbSessions,
    crateOptions: { foglets }
  })
  //await utils.wait(500)
  const editing = new Editing(sim)
  await editing.insertRemoveRandomChartsByRandomNodes(
    timeBetweenInsertions,
    stringSize
  )
  sim.clear()
  await FogletUtils.clearFoglets(foglets)
  await utils.wait(1000)
  const areTheSame = editing.areDocumentsTheSame()
  return areTheSame
}
