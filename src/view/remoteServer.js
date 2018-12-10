import io from 'socket.io-client'
export class remoteServer {
  constructor(options) {
    this._documentId = options.documentId
    this._editorContainerID = options.editorContainerID
    this._storageServer = options.storageServer
    this._wakeUpTimeout = options.wakeUpTimeout
    this._serverState = -1
    this._storageServerState = null
    this.lastWakeUpTime = null
    this.socket = io('http://localhost:5000/')
    this.socket.on('response', data => {
      console.log('response', data)
      this.setState(data.results)
    })
    this.socket.on('connect_failed', () => {
      this.setState(0)
    })

    this.socket.on('disconnect', () => {
      this.setState(0)
    })
    this.socket.on('connect_error', () => {
      this.setState(0)
    })
    this.socket.emit('init', {
      userId: options.userId,
      documentId: this._documentId
    })

    $(`#${this._editorContainerID} #remotesave`).click(async () => {
      if (this._serverState === 1) {
        await this.sleep()
      } else {
        this.socket.emit('init', {
          userId: options.userId,
          documentId: this._documentId
        })

        await this.join()
      }
    })
  }

  async wakeUp() {
    const timeNow = new Date().getTime()
    if (
      !this.lastWakeUpTime ||
      timeNow - this.lastWakeUpTime >= this._wakeUpTimeout
    ) {
      this.remoteOperation('wakeup')
      this.lastWakeUpTime = timeNow
    }
  }

  async join() {
    await this.remoteOperation('join')
  }

  async sleep() {
    var r = confirm(
      'Do you want to make the document offline in the remote server!'
    )
    if (r == true) {
      await this.remoteOperation('sleep')
    }
  }

  remoteOperation(operation) {
    this.socket.emit('request', {
      action: operation,
      documentId: this._documentId
    })
  }

  setState(result) {
    let remotesave = $(`#${this._editorContainerID} #remotesave`)
    this._serverState = result
    if (result == 0) {
      this.unpin(remotesave)
    } else if (result == 1) {
      // the session is active on the server
      this.pin(remotesave, 'active')
    } else {
      this.pin(remotesave, 'sleep')
    }
  }

  pin(remotesave, type) {
    if (type === 'active') {
      remotesave.css('color', 'green')
    } else {
      remotesave.css('color', 'gray')
    }
    remotesave.removeClass('UNPIN')
    remotesave.addClass('PIN')
  }

  unpin(remotesave) {
    remotesave.css('color', 'red')
    remotesave.removeClass('PIN')
    remotesave.addClass('UNPIN')
  }
}
