'use strict'

import { EventEmitter } from 'events'
import { Crate } from '../../src/main'
import { SessionBuilder } from '../../src/SessionBuilder'

let chai = require('chai')
let expect = chai.expect
let assert = chai.assert

class SessionMock extends EventEmitter {
  constructor(sessionId) {
    super()
    this.sessionId = sessionId
  }
}

class SessionBuilderMock extends SessionBuilder {
  constructor(config) {
    super(config)
  }

  buildSession(sessionId) {
    return new SessionMock(sessionId)
  }
}

describe('Main class', () => {
  it('createNewSession && addSession', done => {
    const crate = new Crate({}, SessionBuilderMock)
    crate.createNewSession('a')
    assert(crate._sessions.size === 1, '_sessions size is 1')
    assert(crate._sessions.get(0).sessionId === 'a', 'session a is created')
    crate.createNewSession('b')
    assert(crate._sessions.size === 2, '_sessions size is 2')
    assert(crate._sessions.get(1).sessionId === 'b', 'session b is created')
    done()
  })

  it('getSession ', done => {
    const crate = new Crate({}, SessionBuilderMock)
    crate.createNewSession('a')
    assert(crate.getSession(0).sessionId === 'a', 'session a is created')
    crate.createNewSession('b')
    assert(crate.getSession(1).sessionId === 'b', 'session b is created')

    assert(!crate.getSession(2), 'session b is created')

    done()
  })

  it('removeSession ', done => {
    const crate = new Crate({}, SessionBuilderMock)
    crate.createNewSession('a')
    crate.createNewSession('b')

    crate.removeSession(0)

    assert(!crate.getSession(0), 'session 0 does not exist')
    assert(!crate._sessionIds.get('a'), 'a removed from _sessionIds')

    assert(crate.getSession(1).sessionId === 'b', 'session b is there')

    done()
  })

  it('getNumberOfSessions ', done => {
    const crate = new Crate({}, SessionBuilderMock)
    crate.createNewSession('a')
    assert(crate.getNumberOfSessions() === 1, 'session size is 1')
    crate.createNewSession('b')
    assert(crate.getNumberOfSessions() === 2, 'session size is 2')
    crate.createNewSession('c')
    assert(crate.getNumberOfSessions() === 3, 'session size is 3')

    done()
  })

  it('focusInToSession ', done => {
    const crate = new Crate({}, SessionBuilderMock)
    crate.createNewSession('a')
    crate.createNewSession('b')
    let a = 0
    let b = 0
    crate.getSession(0).on('FocusIn', () => {
      a++
    })

    crate.getSession(1).on('FocusIn', () => {
      b++
    })

    crate.focusInToSession(0)
    assert(a === 1 && b === 0, 'Focus is sent to a')
    crate.focusInToSession(1)
    assert(a === 1 && b === 1, 'Focus is sent to b')
    crate.focusInToSession(0)
    assert(a === 2 && b === 1, 'Focus is sent to a 2')
    done()
  })

  it('focusOutToSession ', done => {
    const crate = new Crate({}, SessionBuilderMock)
    crate.createNewSession('a')
    crate.createNewSession('b')
    let a = 0
    let b = 0
    crate.getSession(0).on('FocusOut', () => {
      a++
    })

    crate.getSession(1).on('FocusOut', () => {
      b++
    })

    crate.focusOutToSession(0)
    assert(a === 1 && b === 0, 'FocusOut is sent to a')
    crate.focusOutToSession(1)
    assert(a === 1 && b === 1, 'FocusOut is sent to b')
    crate.focusOutToSession(0)
    assert(a === 2 && b === 1, 'FocusOut is sent to a 2')
    done()
  })

  it('getIndexFromSessionId ', done => {
    const crate = new Crate({}, SessionBuilderMock)
    crate.createNewSession('a')
    crate.createNewSession('b')
    assert(crate.getIndexFromSessionId('a') === 0, 'index of a is 0')
    assert(crate.getIndexFromSessionId('b') === 1, 'index of b is 1')
    done()
  })

  it('getSessionIdFromIndex ', done => {
    const crate = new Crate({}, SessionBuilderMock)
    crate.createNewSession('a')
    crate.createNewSession('b')
    assert(crate.getSessionIdFromIndex(0) === 'a', '0=>a')
    assert(crate.getSessionIdFromIndex(1) === 'b', '1=>b')
    done()
  })

  it('setActualSession ', done => {
    const crate = new Crate({}, SessionBuilderMock)
    crate.createNewSession('a')
    crate.createNewSession('b')
    crate.createNewSession('c')
    let aIn = 0,
      bIn = 0,
      cIn = 0,
      aOut = 0,
      bOut = 0,
      cOut = 0

    crate.getSession(0).on('FocusIn', () => {
      aIn++
    })

    crate.getSession(1).on('FocusIn', () => {
      bIn++
    })

    crate.getSession(2).on('FocusIn', () => {
      cIn++
    })

    crate.getSession(0).on('FocusOut', () => {
      aOut++
    })

    crate.getSession(1).on('FocusOut', () => {
      bOut++
    })

    crate.getSession(2).on('FocusOut', () => {
      cOut++
    })

    crate.setActualSession('a')
    assert(
      aIn === 1 &&
        bIn === 0 &&
        cIn === 0 &&
        aOut === 0 &&
        bOut === 1 &&
        cOut === 1,
      'setActualSession  a'
    )
    crate.setActualSession('b')
    assert(
      aIn === 1 &&
        bIn === 1 &&
        cIn === 0 &&
        aOut === 1 &&
        bOut === 1 &&
        cOut === 2,
      'setActualSession  b'
    )
    crate.setActualSession('c')
    assert(
      aIn === 1 &&
        bIn === 1 &&
        cIn === 1 &&
        aOut === 2 &&
        bOut === 2 &&
        cOut === 2,
      'setActualSession  c'
    )

    done()
  })

  it('addNewSession ', done => {
    const crate = new Crate({}, SessionBuilderMock)
    crate.addNewSession('a')
    assert(
      crate.getNumberOfSessions() === 1,
      '1/number of sessions 1 =' + crate.getNumberOfSessions()
    )
    crate.addNewSession('a')
    assert(
      crate.getNumberOfSessions() === 1,
      '2/number of sessions 1 =' + crate.getNumberOfSessions()
    )
    crate.addNewSession('a')
    assert(
      crate.getNumberOfSessions() === 1,
      '3/number of sessions 1 =' + crate.getNumberOfSessions()
    )

    crate.removeSession(0)
    assert(
      crate.getNumberOfSessions() === 0,
      '01/ number of sessions 0 =' + crate.getNumberOfSessions()
    )
    crate.addNewSession('a')
    crate.addNewSession('a')
    crate.addNewSession('a')
    crate.addNewSession('b')

    assert(
      crate.getNumberOfSessions() === 2,
      'number of sessions 2 =' + crate.getNumberOfSessions()
    )

    done()
  })

  it('updateView ', done => {
    const crate = new Crate({}, SessionBuilderMock)
    crate.createNewSession('a')
    crate.createNewSession('b')
    let a = 0
    let b = 0
    crate.getSession(0).on('UpdateView', () => {
      a++
    })

    crate.getSession(1).on('UpdateView', () => {
      b++
    })

    crate.updateView(0)
    assert(a === 1 && b === 0, 'UpdateView is sent to a')
    crate.updateView(1)
    assert(a === 1 && b === 1, 'UpdateView is sent to b')
    crate.updateView(0)
    assert(a === 2 && b === 1, 'UpdateView is sent to a 2')
    done()
  })

  it('moveTo ', done => {
    const crate = new Crate({}, SessionBuilderMock)
    crate.createNewSession('a').setActualSession('a')
    crate.createNewSession('b')
    crate.createNewSession('c')

    assert(
      crate.moveToNext().getActualSession().sessionId === 'b',
      ' NExt session is b but ' + crate.getActualSession().sessionId
    )
    assert(
      crate.moveToNext().getActualSession().sessionId === 'c',
      ' NExt session is c but' + crate.getActualSession().sessionId
    )
    assert(
      crate.moveToNext().getActualSession().sessionId === 'c',
      ' NExt session is c but' + crate.getActualSession().sessionId
    )

    assert(
      crate.moveToPrevious().getActualSession().sessionId === 'b',
      ' Previous session is b but ' + crate.getActualSession().sessionId
    )
    assert(
      crate.moveToPrevious().getActualSession().sessionId === 'a',
      ' Previous session is a but ' + crate.getActualSession().sessionId
    )
    assert(
      crate.moveToPrevious().getActualSession().sessionId === 'a',
      ' Previous session is a but ' + crate.getActualSession().sessionId
    )

    done()
  })

  it('exist ', done => {
    const crate = new Crate({}, SessionBuilderMock)
    crate.createNewSession('a')
    crate.createNewSession('b')
    crate.createNewSession('c')

    assert(crate.exist(0))
    assert(crate.exist(1))
    assert(crate.exist(2))
    done()
  })
})
