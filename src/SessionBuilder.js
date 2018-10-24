import Session from './Session'

export class SessionBuilder {
  constructor(defaultConfiguration) {
    this.config = { ...defaultConfiguration }
  }

  buildSession(sessionId) {
    const opts = this.prepareSessionOpts(sessionId)
    const session = new Session(opts)
    return session
  }

  prepareSessionOpts(sessionId) {
    const opts = Object.assign(
      {
        ...this.config
      },
      {
        signalingOptions: {
          session: sessionId
        }
      }
    )
    return opts
  }
}
