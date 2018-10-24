import { RequirementsTester } from './Requirements'

var chai = require('chai')
var expect = chai.expect
var assert = chai.assert

const requirementsTester = new RequirementsTester()
var debug = require('debug')('CRATE:test:RequirementsTester')
const addContext = require('mochawesome/addContext')

describe('Testing Requirements ', function() {
  this.timeout(20000)

  it(`Check signaling server`, async function() {
    const signalingServer = 'https://carteserver.herokuapp.com'
    addContext(this, signalingServer)
    const response = await requirementsTester.checkSignalingServer(
      signalingServer
    )
    assert.equal(response, true)
  })

  it(`Get ICES`, async function() {
    const ICEsURL = 'https://carteserver.herokuapp.com/ice'
    const ICEs = await requirementsTester.getICS(ICEsURL)
    debug('Number of ICEs ', ICEs.length)
    addContext(this, `Number of ICEs ${ICEs.length}`)
    assert.isAtLeast(ICEs.length, 1)
  })

  it(`Check TURN STUN Servers`, async () => {
    const ICEsURL = 'https://carteserver.herokuapp.com/ice'
    const ICEs = await requirementsTester.getICS(ICEsURL)
    const numberOfWorkingServers = await requirementsTester.getWorkingICEs(ICEs)
    assert.isAtLeast(numberOfWorkingServers, 1)
    addContext(this, `Number of ICEs ${ICEs.length}`)
    debug(`The number of working servers is ${numberOfWorkingServers}`)
  })
})
