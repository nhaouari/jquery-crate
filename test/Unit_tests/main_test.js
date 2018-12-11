'use strict'

import { EventEmitter } from 'events'
import Crate from '../../src/main'

let chai = require('chai')
let expect = chai.expect
let assert = chai.assert
let crate
//let a = new unitTestGenerator().generateTemplate(new DocumentBuilder())

class DocumentMock extends EventEmitter {
  constructor(documentId, documentIndex, crate) {
    super()
    this.documentId = documentId
    this.documentIndex = documentIndex
    this.crate = crate
  }
  async initView() {}
  async init() {}
}

class DocumentBuilderMock {
  constructor() {}
  async buildDocument(documentId, sessionIndex) {
    return new DocumentMock(documentId, sessionIndex)
  }
}

describe('Main class', () => {
  beforeEach(() => {
    crate = new Crate({}, DocumentBuilderMock)
  })

  it('createNewDocument && addDocument', async () => {
    await crate.createNewDocument('a')
    assert(crate.getNumberOfDocuments() === 1, '_sessions size is 1')
    assert(crate.getDocument(0).documentId === 'a', 'session a is created')
    await crate.createNewDocument('b')

    assert(crate.getNumberOfDocuments() === 2, '_sessions size is 2')
    assert(crate.getDocument(1).documentId === 'b', 'session b is created')
  })

  it('getDocument ', async () => {
    await crate.createNewDocument('a')
    assert(crate.getDocument(0).documentId === 'a', 'session a is created')
    await crate.createNewDocument('b')

    assert(crate.getDocument(1).documentId === 'b', 'session b is created')

    assert(!crate.getDocument(2), 'session b is created')
  })

  it('removeDocument ', async () => {
    await crate.createNewDocument('a')
    await crate.createNewDocument('b')

    crate.removeDocument(0)

    assert(crate.getDocument(0).documentId === 'b', 'session 0 is b now')
    await crate.createNewDocument('c')
    assert(crate.getDocument(1).documentId === 'c', 'session 1 is c now')
    crate.removeDocument(0)
    assert(crate.getDocument(0).documentId === 'c', 'session 0 is c now')

    await crate.createNewDocument('d')
    await crate.createNewDocument('e')

    crate.removeDocument(1)

    assert(crate.getDocument(0).documentId === 'c', 'session 0 is c now')
    assert(crate.getDocument(1).documentId === 'e', 'session 1 is e now')
  })

  it('getNumberOfDocuments ', async () => {
    await crate.createNewDocument('a')
    assert(crate.getNumberOfDocuments() === 1, 'session size is 1')
    await crate.createNewDocument('b')
    assert(crate.getNumberOfDocuments() === 2, 'session size is 2')
    await crate.createNewDocument('c')
    assert(crate.getNumberOfDocuments() === 3, 'session size is 3')
  })

  it('focusInToDocument ', async () => {
    await crate.createNewDocument('a')
    await crate.createNewDocument('b')
    let a = 0
    let b = 0
    crate.getDocument(0).on('FocusIn', () => {
      a++
    })

    crate.getDocument(1).on('FocusIn', () => {
      b++
    })

    crate.focusInToDocument(0)
    assert(a === 1 && b === 0, 'Focus is sent to a')
    crate.focusInToDocument(1)
    assert(a === 1 && b === 1, 'Focus is sent to b')
    crate.focusInToDocument(0)
    assert(a === 2 && b === 1, 'Focus is sent to a 2')
  })

  it('focusOutToDocument ', async () => {
    await crate.createNewDocument('a')
    await crate.createNewDocument('b')
    let a = 0
    let b = 0
    crate.getDocument(0).on('FocusOut', () => {
      a++
    })

    crate.getDocument(1).on('FocusOut', () => {
      b++
    })

    crate.focusOutToDocument(0)
    assert(a === 1 && b === 0, 'FocusOut is sent to a')
    crate.focusOutToDocument(1)
    assert(a === 1 && b === 1, 'FocusOut is sent to b')
    crate.focusOutToDocument(0)
    assert(a === 2 && b === 1, 'FocusOut is sent to a 2')
  })

  it('getIndexFromDocumentId ', async () => {
    await crate.createNewDocument('a')
    await crate.createNewDocument('b')
    assert(crate.getIndexFromDocumentId('a') === 0, 'index of a is 0')
    assert(crate.getIndexFromDocumentId('b') === 1, 'index of b is 1')
  })

  it('getDocumentIdFromIndex ', async () => {
    await crate.createNewDocument('a')
    await crate.createNewDocument('b')
    assert(crate.getDocumentIdFromIndex(0) === 'a', '0=>a')
    assert(crate.getDocumentIdFromIndex(1) === 'b', '1=>b')
  })

  it('setActualDocument ', async () => {
    await crate.createNewDocument('a')
    await crate.createNewDocument('b')
    await crate.createNewDocument('c')
    let aIn = 0,
      bIn = 0,
      cIn = 0,
      aOut = 0,
      bOut = 0,
      cOut = 0

    crate.getDocument(0).on('FocusIn', () => {
      aIn++
    })

    crate.getDocument(1).on('FocusIn', () => {
      bIn++
    })

    crate.getDocument(2).on('FocusIn', () => {
      cIn++
    })

    crate.getDocument(0).on('FocusOut', () => {
      aOut++
    })

    crate.getDocument(1).on('FocusOut', () => {
      bOut++
    })

    crate.getDocument(2).on('FocusOut', () => {
      cOut++
    })

    crate.setActualDocument('a')
    assert(
      aIn === 1 &&
        bIn === 0 &&
        cIn === 0 &&
        aOut === 0 &&
        bOut === 1 &&
        cOut === 1,
      'setActualDocument  a'
    )
    crate.setActualDocument('b')
    assert(
      aIn === 1 &&
        bIn === 1 &&
        cIn === 0 &&
        aOut === 1 &&
        bOut === 1 &&
        cOut === 2,
      'setActualDocument  b'
    )
    crate.setActualDocument('c')
    assert(
      aIn === 1 &&
        bIn === 1 &&
        cIn === 1 &&
        aOut === 2 &&
        bOut === 2 &&
        cOut === 2,
      'setActualDocument  c'
    )
  })

  it('updateView ', async () => {
    await crate.createNewDocument('a')
    await crate.createNewDocument('b')
    let a = 0
    let b = 0
    crate.getDocument(0).on('UpdateView', () => {
      a++
    })

    crate.getDocument(1).on('UpdateView', () => {
      b++
    })

    crate.updateView()

    assert(a === 1, 'UpdateView is sent to a')
    assert(b === 1, 'UpdateView is sent to b')

    crate.updateView()

    assert(a === 2, 'UpdateView is sent to a')
    assert(b === 2, 'UpdateView is sent to b')

    crate.updateView()
    assert(a === 3, 'UpdateView is sent to a')
    assert(b === 3, 'UpdateView is sent to b')
  })

  it('moveTo ', async () => {
    await crate.createNewDocument('a')
    await crate.createNewDocument('b')
    await crate.createNewDocument('c')
    crate.setActualDocument('a')
    debugger
    assert(
      crate.moveToNext().getActualDocument().documentId === 'b',
      ' NExt session is b but ' + crate.getActualDocument().documentId
    )
    assert(
      crate.moveToNext().getActualDocument().documentId === 'c',
      ' NExt session is c but' + crate.getActualDocument().documentId
    )
    assert(
      crate.moveToNext().getActualDocument().documentId === 'c',
      ' NExt session is c but' + crate.getActualDocument().documentId
    )

    assert(
      crate.moveToPrevious().getActualDocument().documentId === 'b',
      ' Previous session is b but ' + crate.getActualDocument().documentId
    )
    assert(
      crate.moveToPrevious().getActualDocument().documentId === 'a',
      ' Previous session is a but ' + crate.getActualDocument().documentId
    )
    assert(
      crate.moveToPrevious().getActualDocument().documentId === 'a',
      ' Previous session is a but ' + crate.getActualDocument().documentId
    )
  })

  it('exist ', async () => {
    await crate.createNewDocument('a')
    await crate.createNewDocument('b')
    await crate.createNewDocument('c')

    assert(crate.exist(0))
    assert(crate.exist(1))
    assert(crate.exist(2))
  })
})
