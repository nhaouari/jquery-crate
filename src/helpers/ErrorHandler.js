export class ErrorHandler {
  SESSION_NOT_FOUND(index, ...args) {
    const name = 'SESSION_NOT_FOUND'
    const message = `Session ID ${index} Not found in CRATE`
    return this.getError(name, message, ...args)
  }

  getError(name, message, ...args) {
    class MyError extends Error {
      constructor(name, message, ...args) {
        super(message, ...args)
        this.name = name
        this.message = message
        if (typeof Error.captureStackTrace === 'function') {
          Error.captureStackTrace(this, this.constructor)
        } else {
          this.stack = new Error(message).stack
        }
      }
    }

    return new MyError(name, message, ...args)
  }
}
