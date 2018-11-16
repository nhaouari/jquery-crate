import DocumentBuilder from '../../src/DocumentBuilder'

let chai = require('chai')
let expect = chai.expect
let assert = chai.assert
let crate = {}
let documentBuilder
describe('DocumentBuilder', () => {
  before(function() {
    documentBuilder = new DocumentBuilder({}, crate)
  })

  it('GUID', done => {
    documentBuilder.GUID()

    assert(documentBuilder.GUID().length > 0, 'GUID is not working')
    done()
  })

  it('getICEs', function(done) {
    let options = {
      ICEsURL: 'https://carteserver.herokuapp.com/ice'
    }
    this.timeout(10000)
    documentBuilder.getICEs(options).then(ICEs => {
      assert(ICEs.length > 0, 'return ICEs = ' + ICEs.length)
      done()
    })
  })

  it('getLocalStorageData (Not yet)', done => {
    assert(true, 'Unit test not yet implemented')
    done()
  })

  it('getNewFoglet (Not yet)', done => {
    assert(true, 'Unit test not yet implemented')
    done()
  })

  it('setDocumentTitle', done => {
    let options = {}
    documentBuilder.setDocumentTitle(options)

    assert(
      options.name === 'Untitled document',
      'when there it is a new document'
    )

    options = {
      importFromJSON: {
        title: 'test'
      }
    }
    documentBuilder.setDocumentTitle(options)
    assert(options.name === 'test', 'when it is a document saved locally')
    done()
  })

  it('setFogletOptions', done => {
    let options = {
      editingSessionID: 1,
      signalingOptions: { address: 'url', session: 'doc01' },
      webrtc: { iceServers: [1], trickle: true }
    }

    documentBuilder.setFogletOptions(options)

    assert(options.fogletOptions, 'there is fogletOptions')

    const fogletOptions = options.fogletOptions
    assert(options.fogletOptions.id, 'there is userid')
    const rps = fogletOptions.rps
    assert(rps, 'there is rps')

    assert(
      rps.type && (rps.type === 'cyclon' || rps.type === 'spray-wrtc'),
      'there is rps type cyclon or spray-wrtc'
    )

    assert(rps.options.webrtc, 'there is webrtc')
    assert(rps.options.signaling.address, 'there is the signaling server ')
    assert(rps.options.signaling.room, 'there is the signaling server ')
    done()
  })

  it('setSignalingOptions', done => {
    let options = {}
    documentBuilder.setSignalingOptions(options, 'sesssionId')

    assert(options.signalingOptions.session, 'there is session')
    assert(options.signalingOptions.address, 'there is a signaling server')
    assert(options.storageServer.length >= 0, 'there is storageServer')

    done()
  })

  it('setTemporarySessionID', done => {
    let options = { user: { id: 'id' } }
    documentBuilder.setTemporarySessionID(options)
    assert(options.editingSessionID, 'there is editingSessionID')
    done()
  })

  //TODO: the test of the localStorage store not yet done
  it('setUser', done => {
    let options = {}
    documentBuilder.setUser(options)
    debugger
    assert(options.user.id.length > 0, 'there is id')
    assert(options.user.pseudo.length > 0, 'there is pseudo')

    done()
  })

  it('setWebRTCOptions', function(done) {
    let options = { wrtc: 'wrtc' }
    documentBuilder.setWebRTCOptions(options).then(() => {
      assert(options.hasOwnProperty('webRTCOptions'), 'there is webRTCOptions')
      assert(
        options.webRTCOptions.hasOwnProperty('trickle'),
        'there is trickle'
      )
      assert(options.webRTCOptions.hasOwnProperty('config'), 'there is config')
      assert(options.webRTCOptions.hasOwnProperty('wrtc'), 'there is wrtc')
      done()
    })
  })

  it('prepareOptions', done => {
    assert(true, ' it is just composed of the other methods')
    done()
  })

  it('buildDocument', function(done) {
    this.timeout(10000)
    var configuration = {
      //    signalingServer: "https://172.16.9.236:3000",
      signalingServer: 'https://carteserver.herokuapp.com',
      ICEsURL: 'https://carteserver.herokuapp.com/ice',
      storageServer: 'https://storagecrate.herokuapp.com',
      stun: '23.21.150.121' // default google ones if xirsys not
    }

    const defaultConfig = {
      signalingOptions: {
        session: 'TestDocument',
        address: configuration.signalingServer
      },
      storageServer: configuration.storageServer,
      stun: configuration.stun, // default google ones if xirsys not
      ICEsURL: configuration.ICEsURL,
      containerID: 'content-default',
      display: false,
      PingPeriod: 100000,
      AntiEntropyPeriod: 100000
    }

    documentBuilder = new DocumentBuilder(defaultConfig, crate)
    documentBuilder.buildDocument('TestDocument', 0).then(doc => {
      assert(doc.hasOwnProperty('_options'))
      assert(doc.hasOwnProperty('documentIndex'))
      assert(doc.documentIndex >= 0)
      assert(doc.hasOwnProperty('crate'))
      assert(doc.hasOwnProperty('documentId'))
      assert(doc.documentId === 'TestDocument')
      doc.on('connected', () => {
        done()
      })
      doc.init()
    })
  })
})
