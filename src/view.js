import { LinkView } from './view/link.js'
import { StatesHeader } from './view/statesheader.js'
import { EditorController } from './view/editor'
import { CrateDecorator } from './view/CrateDecorator'
var debug = require('debug')('CRATE:View')
export class View {
  constructor(options, document, editorsContainerID) {
    this._options = options
    this._document = document
    this.crate = this._document.crate

    this._editorsHolderID = editorsContainerID
    this._editorContainerID = `container-${
      this._options.signalingOptions.session
    }`

    this._document.on('FocusIn', () => {
      this.focusIn()
    })

    this._document.on('FocusOut', () => {
      this.focusOut()
    })

    this._document.on('UpdateView', NumberOfDocuments => {
      debug('UpdateView')
      this.updateView(NumberOfDocuments)
    })
    this.createCRATE()

    if (this._options.storageServer) {
      this._storageServerState = {}
      this.findremote(true) // join if it is in the sleeping mode to download the last version of the document
      this._timerStorageServer = setInterval(() => this.findremote(), 5000)
    }

    let sessionID = this._options.signalingOptions.session

    /*TODO:
    session.default.getCrateSession(sessionID).goTo(sessionID)
    */
    //TODO:this.viewEditor.focus()

    this._editor = new EditorController(
      this._document,
      this._options.signalingOptions.session,
      this._editorContainerID
    )

    CrateDecorator.addMoveShortcuts(this.crate)
    CrateDecorator.addResize(this.crate)
  }

  init() {
    //TODO: session.default.updateViews()
    this._editor.initDocument()

    /**
     * if there are any changes local or remote then we have to wake up the storageServer
     * @param  {[type]} "thereAreChanges" [description]
     * @param  {[type]} (                 [description]
     * @return {[type]}                   [description]
     */
    this._editor.on('thereAreChanges', () => {
      if (this._storageServerState === 2) {
        this.join()
      }
    })

    $(window).resize(function() {
      $('#comments').height($('#editor').height())
    })

    // make title editable
    $(`#${this._editorContainerID} #title`).click(() => {
      $(`#${this._editorContainerID} #title`).attr('contenteditable', 'true')
      $(document).on('scroll touchmove mousewheel', function(e) {
        e.preventDefault()
        e.stopPropagation()
        return false
      })
    })

    $(`#${this._editorContainerID} #closeDocument`).click(() => {
      this.closeDocument()
    })

    //Menu Bar events
    $(`#${this._editorContainerID} #saveicon`).click(() => {
      this.saveDocument()
    })

    $(`#${this._editorContainerID} #title`).focusout(() => {
      this.changeTitle()
      //TODO: this.emit('thereAreChanges')
    })

    const sharingLinkContainer = new LinkView(
      $(`#${this._editorContainerID} #sharinglink`)
    )

    const shareButton = $(`#${this._editorContainerID} #shareicon`)

    this._statesHeader = new StatesHeader(
      this._document,
      sharingLinkContainer,
      shareButton,
      this._editorContainerID
    )

    this.documentLoaded()
  }

  setMessageState(msg) {
    $(`#${this._editorContainerID} #loading h1`).text(msg)
  }

  documentLoaded() {
    $(`#${this._editorContainerID} #loading`).hide()
    $(`#${this._editorContainerID} .editorContent`).show()
  }

  closeDocument() {
    this._document.close()
  }

  createCRATE() {
    const html = ` 
    <div autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" class="col-md-10 editorContainer" id="${
      this._editorContainerID
    }" style="width:${this.getWidth()} !important" >
  <!-- editorContent -->
    <div id="loading" style="
      width: 50%;
      margin: auto;
      text-align: center;
      opacity: 0.5;
      filter: alpha(opacity=50);
    ">
      <img class="imageuser" src="/icons/loading.gif"> 
          
        <h1 style="
        
            font-size: xx-large;
            /* text-align: center; */
            color: gray;
          "></h1>
    </div>
      <div class="editorContent" style="display: none;">
          <!-- Head -->
          <div id="head">
          
          </div><!-- Head -->
  
          <div id="firstrow" class="row">
  
              <div id="title">
              ${this._options.name}
                  </div>
  
                  <div id='menurow'>
                  <div id="features">
                  <div id="shareicon">
                  <i class="fa fa-link fa-2x ficon2"></i>
                  </div>
                  <div id="saveicon"><i class="fa fa-floppy-o fa-2x ficon2"></i></div>
                  <div id="remotesave">
                  <i class="fa fa-cloud fa-2x ficon2"></i>
                  </div>
                  <div id="state">
                  <i class="fa fa-globe fa-2x ficon2 "></i>
              </div>
              
                  <div id="closeDocument">
                  <i class="fa fa-times-circle fa-2x ficon2" style="
              " aria-hidden="true" ></i>
                  </div>
              </div>
              </div>
              <div id='sharingContainer'> 
              </div>
          </div>
          
          <!-- Content -->
          <div id="content" class="content">
              <div id="users" class="row">
              </div>
              <div id="editorSection">
              <div id="editor" class="editor">
              </div>
              <div id="comments">
              </div>
              </div>
          </div><!-- Content -->
  
          <!-- inputCommentModal -->
          <div id="inputCommentModal" class="modal fade" role="dialog" style="display: none;">
              <div class="modal-dialog">
          
                  <!-- Modal content-->
                  <div class="modal-content">
                      <div class="modal-body">
                      <button type="button" class="close" data-dismiss="modal">×</button>
                      <h4>Comment</h4>
                      <p><textarea name="commentInput" id="commentInput" style="width: 100%;" rows="5"></textarea></p>
                      </div>
                      <div class="modal-footer">
                      <button type="button" class="btn btn-default" id="saveComment"data-dismiss="modal">Save</button>
                      </div>
                  </div>
              
              </div>
          </div><!-- inputCommentModal -->
      </div><!-- editorContent -->
  </div>
    `

    const editorContainer = $(`#${this._editorsHolderID}`)
    editorContainer.append(html)

    $(`#${this._editorContainerID} #saveComment`).click(() => {
      this.saveComment()
    })

    $(`#${this._editorContainerID} #remotesave`).click(() => {
      if ($(`#${this._editorContainerID} #remotesave`).hasClass('PIN')) {
        this.kill()
      } else {
        this.join()
      }
    })
  }

  getWidth() {
    let width = 100
    let scrollWidth = 0
    const NumberOfDocuments = this._document.crate.getNumberOfDocuments()

    if (NumberOfDocuments > 1) {
      width = 50
      scrollWidth = scrollWidth / 2
    }
    return `calc(${width}vw - ${scrollWidth}px)`
  }

  saveComment() {
    this._editor._comments.saveComment()
  }

  /**
   * saveDocument save the document in local storage
   * @return {[type]} [description]
   */
  saveDocument() {
    if (this._document.saveDocument()) alert('Document is saved successfully')
    else alert('There is a problem is saving the document')
  }
  /**
   * changeTitle For any change in title, broadcast the new title
   * @return {[type]} [description]
   */
  changeTitle() {
    $(document).unbind('scroll touchmove mousewheel')
    $(`#${this._editorContainerID} #title`).attr('contenteditable', 'false')
    if ($(`#${this._editorContainerID} #title`).text() == '') {
      $(`#${this._editorContainerID} #title`).text('Untitled document')
    }

    //TODO: Optimize change only if the text is changed from last state
    this._document._communication.textManager._titleManager.sendChangeTitle(
      $(`#${this._editorContainerID} #title`).text()
    )
  }

  focusOut() {
    $(`#container-${this._document.documentId}`).removeClass('activeEditor')
    debug('FocusOuT', this._document.documentId)
  }

  focusIn() {
    $(`#container-${this._document.documentId}`).addClass('activeEditor')

    let moveToIndex = this._document.documentIndex
    if (moveToIndex >= 1) {
      moveToIndex--
    }

    const moveToDocumentId = this._document.crate.getDocumentIdFromIndex(
      moveToIndex
    )
    if (this._document.crate.getNumberOfDocuments() > 1) {
      $('html, body').animate(
        {
          scrollLeft: $(`#container-${moveToDocumentId}`).offset().left
        },
        'slow'
      )
    }
    if (this._editor.viewEditor) {
      this._editor.viewEditor.focus()
    }
  }

  updateView(numberOfDocuments) {
    debug('uodateView', this._document.documentId)
    $(`#${this._editorContainerID}`).css(
      'cssText',
      `width:${this.getWidth()} !important`
    )

    if (numberOfDocuments > 1) {
      jQuery(`#content-default`).css(
        'cssText',
        `width:calc(${this.getWidth()} * ${numberOfDocuments}) !important`
      )
    }
  }

  close() {
    clearInterval(this._timerStorageServer)
    for (let marker in this._editor.markers) {
      clearInterval(marker.timer)
    }
    // remove it from the browser
    $(`#${this._editorContainerID}`).remove()
  }

  //TODO:Create a special class for remote session
  findremote(firsttime) {
    let sessionID = this._options.signalingOptions.session
    let remotesave = $(`#${this._editorContainerID} #remotesave`)
    // There is a configured server
    if (this._options.storageServer) {
      const url = this._options.storageServer + '/exist/' + sessionID
      fetch(url)
        .then(resp => resp.json()) // Transform the data into json
        .then(data => {
          this._storageServerState = data.results
          if (data.results == 0) {
            this.unpin(remotesave)
          } else if (data.results == 1) {
            // the session is active on the server
            this.pin(remotesave, 'active')
          } else {
            if (firsttime) {
              this.join()
            } else {
              this.pin(remotesave, 'sleep')
            }
          }
        })
        .catch(thrownError => {
          debug(thrownError)
          clearInterval(this._timerStorageServer)
          this.unpin(remotesave)
        })
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

  join() {
    let sessionID = this._options.signalingOptions.session
    $.ajax({
      type: 'GET',
      url: this._options.storageServer + '/join/' + sessionID,
      success: (data, status) => {
        this.findremote()
      },
      error: () => {
        this.findremote()
      },
      async: true
    })
  }

  kill() {
    let sessionID = this._options.signalingOptions.session
    var r = confirm('Do you want remove document from remote server!')
    if (r == true) {
      $.ajax({
        type: 'GET',
        url: this._options.storageServer + '/kill/' + sessionID,
        success: (data, status) => {
          this.findremote(sessionID)
        },
        async: false
      })
    }
  }
}
