import {LinkView} from "./view/link.js"
import {StatesHeader} from "./view/statesheader.js"
import {EditorController} from "./view/editor"


export class View {
  constructor(options, document, editorsContainerID) {
    this._options = options
    this._editorsHolderID = editorsContainerID
    this._editorContainerID = `container-${this._options.signalingOptions.session}`
    this.createCRATE()

    this._document = document
   
    if (session.config.storageServer) {
      this._storageServerState = {}
      this.findremote(true) // join if it is in the sleeping mode to download the last version of the document
      this._timerStorageServer = setInterval(() => this.findremote(), 5000);  
    }

    let sessionID = this._options.signalingOptions.session

    session.default.getCrateSession(sessionID).goTo(sessionID)   
    
    
    //TODO:this.viewEditor.focus()
    
    this._editor = new EditorController(this._document, this._options.signalingOptions.session, this._editorContainerID)
   
  }

  init(){
     session.default.updateViews()
    this._editor.initDocument()
        /**
       * if there are any changes local or remote then we have to wake up the storageServer
       * @param  {[type]} "thereAreChanges" [description]
       * @param  {[type]} (                 [description]
       * @return {[type]}                   [description]
       */
      this._editor.on("thereAreChanges", () => {
        if (this._storageServerState === 2) {
          this.join()
        }
      })
     
        // make title editable
    jQuery(`#${this._editorContainerID} #title`).click(() => {
      jQuery(`#${this._editorContainerID} #title`).attr('contenteditable', 'true')
    })  

    jQuery(`#${this._editorContainerID} #closeDocument`).click(() => {
      this.closeDocument()
     
    })

     //Menu Bar events
    jQuery(`#${this._editorContainerID} #saveicon`).click(() => {
      this.saveDocument()
    })

    jQuery(`#${this._editorContainerID} #title`).focusout(() => {
      this.changeTitle()
     //TODO: this.emit('thereAreChanges')
    })

  
    const sharingLinkContainer = new LinkView(jQuery(`#${this._editorContainerID} #sharinglink`))

    const shareButton = jQuery(`#${this._editorContainerID} #shareicon`)

    this._statesHeader = new StatesHeader(this._document, sharingLinkContainer, shareButton, this._editorContainerID)

    }

  closeDocument() {
     // Get object of the list for this session
     let crateSession = session.default.getCrateSession(this._options.signalingOptions.session)

     if (session.default.headSession !== crateSession) {

       session.default.removeSession( this._options.signalingOptions.session)

       // remove it from the browser   
       jQuery(`#${this._editorContainerID}`).remove()

       //  disconnect and remove the model

       crateSession.moveToPrevious()
       crateSession.close()
     } else {
       console.log('You cannot remove the first document')
     }
  }
  createCRATE() {
    let width = 98

    if(session.default.number>1) 
    {
      width = 45
    } 

    const html = ` 
<div class="col-md-10 editorContainer" id="${this._editorContainerID}" style="'width:${width}vw !important'" >
 <!-- Head -->
   <div id="head">
      <div id="firstrow" class="row">
         <div id="connectionState">
         </div>
         <div id="title">
            ${this._options.name}
         </div>
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
            <div id="closeDocument" style="
              float: right;
             position: relative;
                ">
            <i class="fa fa-window-close" style="
        " aria-hidden="true" ></i>
            </div>
         </div>
      </div>
      <div id="sharinglink" class="row">
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
   </div>


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
        </div>
    `
    jQuery(`#${this._editorsHolderID}`).append(html);


    jQuery(`#${this._editorContainerID} #saveComment`).click(() => {
      this.saveComment()
    })

    jQuery(`#${this._editorContainerID} #remotesave`).click(() => {

      if (jQuery(`#${this._editorContainerID} #remotesave`).hasClass('PIN')) {
        this.kill();
      } else {
        this.join();
      }
    });


  }

  static addMoveShortcuts() {
    // custom prev next page event 


    let codes = {
      37: "prev",
      39: "next"
    }

    document.addEventListener && // Modern browsers only
      document.addEventListener("keydown", function(e) {
        const code = codes[e.keyCode];
        if ((e.ctrlKey || e.metaKey) && code) {
          const evt = document.createEvent("Event")
          evt.initEvent(code, true, false);
          e.target.dispatchEvent(evt); // dispatch on current target. Event will bubble up to window
          e.preventDefault(); // opera defaut fix
        }
      }, false);



    // or using jQuery

    $(document).on('next', () => {
       console.log('next')
      session.default.actualSession.moveToNext()
    })

    $(document).on('prev', () => {
      console.log('prev')
      session.default.actualSession.moveToPrevious()
    })  

  }

  saveComment() {
    this._editor._comments.saveComment()
  }


  // Remote session 
  findremote(firsttime) {
    let sessionID = this._options.signalingOptions.session
    let remotesave = jQuery(`#${this._editorContainerID} #remotesave`)
    // There is a configured server
    if (session.config.storageServer) {
      
      const url =session.config.storageServer + "/exist/" + sessionID
      fetch(url)
      .then((resp) => resp.json()) // Transform the data into json
      .then((data)=> {
          this._storageServerState = data.results
          if (data.results == 0) {
            this.unpin(remotesave);
          } else if (data.results == 1) { // the session is active on the server
            this.pin(remotesave, "active");
          } else {
            if (firsttime) {
              this.join()
            } else {
              this.pin(remotesave, "sleep");
            }
          }



        })
        .catch((thrownError)=> {
          console.log(thrownError);
          clearInterval(this._timerStorageServer);
          this.unpin(remotesave);
        })

  }
  }

  pin(remotesave, type) {
    if (type === "active") {
      remotesave.css('color', 'green');
    } else {
      remotesave.css('color', 'gray');
    }
    remotesave.removeClass('UNPIN');
    remotesave.addClass('PIN');
  }

  unpin(remotesave) {
    remotesave.css('color', 'red');
    remotesave.removeClass('PIN');
    remotesave.addClass('UNPIN');
  }

  join() {
    let sessionID = this._options.signalingOptions.session
    $.ajax({
      type: "GET",
      url: session.config.storageServer + "/join/" + sessionID,
      success: (data, status) => {
        this.findremote();
      },
      error: () => {
        this.findremote();
      },
      async: true
    });
  }

  kill() {
    let sessionID = this._options.signalingOptions.session
    var r = confirm("Do you want remove document from remote server!");
    if (r == true) {
      $.ajax({
        type: "GET",
        url: session.config.storageServer + "/kill/" + sessionID,
        success: (data, status) => {
          this.findremote(sessionID);
        },
        async: false
      });

    }
  }

  
  /**
   * saveDocument save the document in local storage
   * @return {[type]} [description]
   */
  saveDocument() {
    if (this._document.saveDocument())
    alert("Document is saved successfully")
    else 
    alert("There is a problem is saving the document")
  }
/**
   * changeTitle For any change in title, broadcast the new title
   * @return {[type]} [description]
   */
  changeTitle() {
    jQuery(`#${this._editorContainerID} #title`).attr('contenteditable', 'false')
    if (jQuery(`#${this._editorContainerID} #title`).text() == "") {
      jQuery(`#${this._editorContainerID} #title`).text('Untitled document')
    }
    
    //TODO: Optimize change only if the text is changed from last state 
    this._document._communication.textManager._titleManager.sendChangeTitle(jQuery(`#${this._editorContainerID} #title`).text())
  }


  fullScreen(){
    jQuery(`#${this._editorContainerID}`).css("cssText",'width:98vw !important')
  }

  splitedScreen(){
    jQuery(`#${this._editorContainerID}`).css("cssText",'width:calc(50vw - 17.5px) !important')
  }
}

View.addMoveShortcuts() 