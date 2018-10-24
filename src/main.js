import Marker from './view/marker'
import { SessionBuilder } from './SessionBuilder'
import { ErrorHandler } from './helpers/ErrorHandler'

export class Crate {
  constructor(options = null, sessionBuilder = null) {
    if (!sessionBuilder) {
      sessionBuilder = SessionBuilder
    }
    this.sessionBuilder = new sessionBuilder(options)
    // key=index,value=session
    this._sessions = new Map()
    // key=sessionId,value=sessionIndex
    this._sessionIds = new Map()
    this.actualSessionIndex = -1
  }

  getSessionIndexs() {
    let keys = Array.from(this._sessions.keys())
    return keys
  }

  getSession(index) {
    return this._sessions.get(index)
  }

  removeSession(sessionIndex) {
    this._sessionIds.delete(this.getSessionIdFromIndex(sessionIndex))
    this._sessions.delete(sessionIndex)
  }

  getNumberOfSessions() {
    return this._sessions.size
  }

  createNewSession(sessionId) {
    const session = this.sessionBuilder.buildSession(sessionId)
    this._sessionIds.set(sessionId, this.getNumberOfSessions())
    this.addSession(session)
    return this
  }

  addSession(session) {
    this._sessions.set(this.getNumberOfSessions(), session)
  }

  focusInToSession(sessionIndex) {
    if (this.getSession(sessionIndex)) {
      this.getSession(sessionIndex).emit('FocusIn')
    } else {
      throw new ErrorHandler().SESSION_NOT_FOUND(sessionIndex)
    }
  }

  focusOutToSession(sessionIndex) {
    if (this.getSession(sessionIndex)) {
      this.getSession(sessionIndex).emit('FocusOut')
    } else {
      throw ErrorHandler().SESSION_NOT_FOUND(sessionIndex)
    }
  }

  getIndexFromSessionId(sessionId) {
    return this._sessionIds.get(sessionId)
  }

  getSessionIdFromIndex(sessionIndex) {
    return this.getSession(sessionIndex).sessionId
  }

  //TODO:add it to session class
  convertLocalLinks() {
    const linksToCrate = this.getAllLinksToCrate()
    linksToCrate.forEach(link => {
      link.onclick = () => {
        let sessionId = this.href.split('?')[1]
        this.openSession(sessionId)
      }
    })
  }
  //TODO:Move to session
  getAllLinksToCrate() {
    const linksToCrate = []
    const links = $('#content-default a')
    for (var link of links) {
      if (link.href.includes(window.location.href.split('?')[0])) {
        linksToCrate.push(link)
      }
    }
    return linksToCrate
  }

  setActualSession(sessionId) {
    const sessionIndex = this.getIndexFromSessionId(sessionId)
    if (sessionIndex !== undefined && this.actualSessionIndex != sessionIndex) {
      this.actualSessionIndex = sessionIndex
      this.focusInToSession(sessionIndex)
      this.getSessionIndexs()
        .filter(index => index != sessionIndex)
        .forEach(sessionIndex => this.focusOutToSession(sessionIndex))
    } else {
      throw Error('Session ' + sessionId + ' dose not exist')
    }
  }

  getActualSession() {
    return this.getSession(this.actualSessionIndex)
  }

  addNewSession(sessionId) {
    let sessionIndex = this.getIndexFromSessionId(sessionId)
    if (!sessionIndex && sessionIndex != 0) {
      this.createNewSession(sessionId)
      sessionIndex = this.getIndexFromSessionId(sessionId)
    }
    return this
  }

  updateView(sessionIndex) {
    this.getSession(sessionIndex).emit('UpdateView', this.getNumberOfSessions())
  }

  /**
   * focus on the next session of it is possible
   */
  moveToNext() {
    return this.moveTo(this.actualSessionIndex + 1)
  }

  /**
   * focus on the previous session
   */
  moveToPrevious() {
    return this.moveTo(this.actualSessionIndex - 1)
  }

  moveTo(sessionIndex) {
    if (this.exist(sessionIndex)) {
      this.setActualSession(this.getSessionIdFromIndex(sessionIndex))
    }
    return this
  }

  exist(sessionIndex) {
    return this.getSession(sessionIndex) !== undefined
  }
}

Crate.Marker = Marker
