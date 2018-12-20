import DocumentBuilder from '../../src/DocumentBuilder'
import wrtc from 'wrtc'
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
    assert(options.user.id.length > 0, 'there is id')
    assert(options.user.pseudo.length > 0, 'there is pseudo')

    done()
  })

  it('prepareOptions', done => {
    assert(true, ' it is just composed of the other methods')
    done()
  })

  it('buildDocument', function(done) {
    this.timeout(10000)
    const configuration = {
      id: 'idtest',
      pseudo: 'test',
      signalingServer: 'https://carteserver.herokuapp.com',
      ICEsURL: 'https://carteserver.herokuapp.com/ice',
      stunTurn: '23.21.150.121'
    }

    const defaultConfig = {
      signalingOptions: {
        address: configuration.signalingServer
      },
      stun: configuration.stunTurn, // default google ones if xirsys not
      ICEsURL: configuration.ICEsURL,
      containerID: 'content-default',
      display: false,
      PingPeriod: 1000000000,
      AntiEntropyPeriod: 1000000000,
      documentActivityTimeout: 60 * 10 * 1000,
      wrtc: wrtc
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
