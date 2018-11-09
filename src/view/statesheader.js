import tippy from 'tippy.js'
//require('$-qrcode')
/**
 * Marker is class for managing the marker of one user,it includes the caret, avatar, and pseudo Names.
 */

export class StatesHeader {
  /**
   * StatesHeader is class that is for showing the state of the network, share option of the document.
   * @param  {[type]} model     [description]
   * @param  {[type]} linkView  [description]
   * @param  {[type]} shareView [description]
   * @return {[type]}           [description]
   */
  constructor(model, linkView, shareView, editorContainerID) {
    this.model = model
    this.startSharingText = '<i class="fa fa-link fa-2x ficon2"></i>'
    this.startSharingTooltip = 'start sharing'
    this.stopSharingText = '<i class="fa fa-unlink fa-2x ficon2"></i>'
    this.stopSharingTooltip = 'stop sharing'

    this.red = '#cd2626'
    this.yellow = '#eead0e'
    this.green = '#228b22'
    this.blue = '#00BFFF'
    this._editorContainerID = editorContainerID
    this.networkState = $(`#${this._editorContainerID} #state`)

    tippy(`#${this._editorContainerID} #state`, {
      content: 'Network state',
      theme: 'light rounded',
      delay: 100,
      arrow: true
    })

    tippy(`#${this._editorContainerID} #saveicon`, {
      content: 'Save document',
      theme: 'light rounded',
      delay: 100,
      arrow: true
    })

    tippy(`#${this._editorContainerID} #remotesave`, {
      content: 'Remote save',
      theme: 'light rounded',
      delay: 100,
      arrow: true
    })

    const sharingContainer = $(`#${this._editorContainerID} #sharingContainer`)

    const shareIcon = $(`#${this._editorContainerID} #shareicon`)

    let link = window.location.href.split('/')
    link.splice(-1, 1)
    link = link.join('/') + '/' + this.model.documentId

    const getTitle = () => {
      const title = $(`#${this._editorContainerID} #title`)
        .text()
        .replace(/(\r\n\t|\n|\r\t)/gm, '')
      return title
    }

    sharingContainer.jsSocials({
      url: link,
      text: getTitle(),
      showLabel: false,
      showCount: false,
      shares: ['twitter', 'facebook', 'linkedin', 'whatsapp']
    })

    sharingContainer.append(`<div id="link" style="display: none;">${link}</i>`)
    sharingContainer.prepend(`<h5>Share!</h5>`)

    $(`#${this._editorContainerID} #sharingContainer .jssocials-shares`).append(
      `<div class="jssocials-share"><i id="copy" class="fa fa-copy jssocials-share-logo"></i></div>`
    )

    $(`#${this._editorContainerID} #sharingContainer #copy`).click(() => {
      this.copyToClipboard(link)
    })

    tippy(`#${this._editorContainerID} #shareicon`, {
      theme: 'light rounded',
      arrow: true,
      interactive: true,
      content: document.querySelector('#sharingContainer')
    })

    this.setNetworkState('connected')
    model.rps.on('open', () => {
      this.setNetworkState('connected')
    })

    model.rps.on('close', id => {
      setTimeout(() => {
        if (model._foglet.getNeighbours(Infinity).length <= 0)
          this.setNetworkState('disconnected')
      }, 5000)
    })
  }

  /**
   * copyLink copy the link of the document
   * @return {[type]} [description]
   */
  copyToClipboard(text) {
    var dummy = document.createElement('input')
    document.body.appendChild(dummy)
    dummy.setAttribute('value', text)
    dummy.select()
    document.execCommand('copy')
    document.body.removeChild(dummy)
  }
  /**
   * Set the state of the network on the browser
   * @param {[type]} state set three different states according Spray protocol states:'connected', 'partiallyconnected', and 'disconnected'
   */
  setNetworkState(state) {
    switch (state) {
      case 'connected':
        var connectedString = `<span class='alert-success'>Congratulations!</span>
                     You are connected to people, and people are 
                     connected to you. <span class='alert-info'>You can start editing " 
                     together</span>.`
        this.networkState.css('color', this.green)
        this.networkState.attr('data-content', connectedString)
        break
      case 'partiallyConnected':
        var partiallyConnectedString = `<span class='alert-warning'>Partially connected</span>: 
                     either you are connected to people, or people are connected to you. 
                     This is not great, but you <span class='alert-info'> still can edit.</span>`

        this.networkState.css('color', this.yellow)
        this.networkState.attr('data-content', partiallyConnectedString)
        break
      case 'disconnected':
        var disconnectedString = `<span class='alert-danger'>Disconnected</span>:
                     you are currently editing <span class='alert-info'>on
                    your own</span>.`
        this.networkState.css('color', this.red)
        this.networkState.attr('data-content', disconnectedString)
        break
    }
  }
}
