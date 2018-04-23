let VLink = require('./view/link.js')
let CStatesHeader = require('./view/statesheader.js')
let CEditor = require('./view/editor.js')

class view {
  constructor(options, model, editorsContainerID) {


    this._options = options
    this._editorsHolderID = editorsContainerID
    this._editorContainerID = `container-${this._options.signalingOptions.room}`
    this.createCRATE()

    this._model = model;
    this._editor = new CEditor(model, options.signalingOptions.room, this._editorContainerID)


    let sessionID = this._options.signalingOptions.session
    let s = session.getCrateSession(sessionID)
    if (s._previous) {
      sessionID = s._previous.options.signalingOptions.session
    }

    session.focusOnSession(sessionID, this._options.signalingOptions.session, this._editor)


    const sharingLinkContainer = new VLink(jQuery(`#${this._editorContainerID} #sharinglink`))

    const shareButton = jQuery(`#${this._editorContainerID} #shareicon`)

    this._statesHeader = new CStatesHeader(model, sharingLinkContainer, shareButton, this._editorContainerID)


    jQuery(`#${this._editorContainerID} #closeDocument`).click(() => {
      // Get object of the list for this session
      let crateSession = session.getCrateSession(this._options.signalingOptions.room)

      if (session.headSession !== crateSession) {

        // remove the crateSession for the list 
        if (crateSession._previous) {
          crateSession._previous._next = crateSession._next
        }

        if (crateSession._next) {
          crateSession._next._previous = crateSession._previous
        } else {
          session.lastSession = crateSession._previous
        }

        // remove it from the browser   
        jQuery(`#${this._editorContainerID}`).remove()

        //  disconnect and remove the model

        crateSession.moveToPrevious()

        crateSession.close()


      } else {
        console.log('You cannot remove the first document')
      }

    })



  }

  createCRATE() {
    const html = ` 
<div class="col-md-10 editorContainer" id="${this._editorContainerID}">
   
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
            <div id="remotesave" style=" width: 20px;">
               <i class="fa fa-cloud fa-2x ficon2"></i>
            </div>
            <div id="closeDocument" style="
              float: right;
             position: relative;
                ">
            <i class="fa fa-window-close" aria-hidden="true" ></i>
            </div>
         </div>
      </div>
      <div id="sharinglink" class="row">
      </div>
   </div>
   
 <!-- Content -->
   <div id="content" class="content">
      <div id="users" class="row">
         <div id="state" style="margin-left: -50px;" ">
            <i class="fa fa-globe fa-3x ficon "></i>
         </div>
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

    jQuery(`#${this._editorsHolderID} #saveComment`).click(() => {
      this.saveComment()
    })

    jQuery(`#${this._editorsHolderID} #remotesave`).click(() => {

      if (jQuery(`#${this._editorsHolderID} #remotesave`).hasClass('PIN')) {
        this.kill();
      } else {
        this.join();
      }
    });


  }

  saveComment() {
    this._editor.saveComment()
  }


  // Remote session 
  findremote() {
    let sessionID = this._options.signalingOptions.room
    let remotesave = jQuery(`#${this._editorsHolderID} #remotesave`)
    // There is a configured server
    if(config.storageServer) {
      $.ajax({
        type: "GET",
        url: config.storageServer + "/exist/" + sessionID,
        success: (data, status) => {
          data = JSON.parse(data);
          if (data.results == 0) {
            this.unpin(remotesave);
          } else {
            this.pin(remotesave);
            return false;
          }
        },
        async: false
      });
    }

  }

  pin(remotesave) {
    remotesave.css('color', 'green');
    remotesave.removeClass('UNPIN');
    remotesave.addClass('PIN');
    console.log("PIN");
  }

  unpin(remotesave) {
    remotesave.css('color', 'red');
    remotesave.removeClass('PIN');
    remotesave.addClass('UNPIN');
    console.log("UNPIN");
  }


  join() {
    let sessionID = this._options.signalingOptions.room
    $.ajax({
      type: "GET",
      url: config.storageServer + "/join/" + sessionID,
      success: (data, status)=>{


        console.log("This is success");
        //TODO: chANGE IT LATER
        /*setTimeout(function() {
            crate_model.csh.startJoining(crate_model.signalingOptions);
            crate_model.rps.updateState();
          },
          3000);
        */
        this.findremote();
      },
      async: true
    });
  }

  kill() {
    let sessionID = this._options.signalingOptions.room
    var r = confirm("Do you want remove document from remote server!");
    if (r == true) {
      $.ajax({
        type: "GET",
        url: config.storageServer + "/kill/" + sessionID,
        success: (data, status) => {
          this.findremote(sessionID);
        },
        async: false
      });

    } else {
      txt = "You have Cancel the remove!";
    }


  }

}

module.exports = view