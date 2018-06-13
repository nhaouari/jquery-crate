import Marker from "../view/marker";
import Comments from "../view/comments";
import {EventEmitter} from "events"

var debug = require('debug')('crate:view:editor')




Quill.register('modules/cursors', QuillCursors);
Quill.register('modules/comment', QuillComment);

/**
 * EditorController this the link between the core functions and the interface.
 */

export default class EditorController extends EventEmitter {


  /**
   * [constructor description]
   * @param  {[doc]} model  this is the object that contains all proprieties of a document.    
   * @param  {[string]} sessionID [description]
   */
  constructor(model, sessionID, editorContainerID) {
    super()
    /**
     * this is the object that contains all proprieties of a document.
     * @type {[doc]}
     */
    this.model = model

    /**
     * markers contains all marks of the users: carets, avatars...
     * @type {Marker[]}
     */
    this.markers = {}
    /**
     * startimer A timer used for sending pings
     * @type {Timer}
     */
    this.startTimer = {}
    /**
     *  ViewEditor the used editor, here it is Quill editor 
     *  @see  https://quilljs.com/
     * @type {Quill}
     */
    this.viewEditor = {};

    this._editorContainerID = editorContainerID

    this._comments = new Comments(this._editorContainerID)
    this._sessionID = sessionID

    this.loadDocument(sessionID)


    this.startPing(5000)

    jQuery(`#${this._editorContainerID} #saveicon`).click(() => {
      this.saveDocument()
    })

    jQuery(`#${this._editorContainerID} #title`).focusout(() => {
      this.changeTitle()
      this.emit('thereAreChanges')
    })


    // EDITOR listeners 
    this.viewEditor.on('selection-change', (range, oldRange, source) => {
      if (range) {
        this.model.core.caretMoved(range)
      }
    })

    this.viewEditor.on('text-change', (delta, oldDelta, source) => {
      this.textChange(delta, oldDelta, source)
      this.emit('thereAreChanges')

    })


    // Core listeners 
    this.model.core.on('remoteInsert', (element, indexp) => {
      this.remoteInsert(element, indexp)
      this.emit('thereAreChanges')
    })

    this.model.core.on('remoteRemove', (index) => {
      this.remoteRemove(index)
      this.emit('thereAreChanges')
    })

    this.model.core.on('remoteCaretMoved', (range, origin) => {
      this.remoteCaretMoved(range, origin)
    })

    this.model.core.on('remoteCaretMoved', (range, origin) => {
      this.remoteCaretMoved(range, origin)
    })

    //At the reception of Title changed operation 
    this.model.on('changeTitle', (title) => {
      jQuery(`#${this._editorContainerID} #title`).text(title)
      this.emit('thereAreChanges')
    })

    this.model.core.on('ping', (origin, pseudo) => {
      this.atPing(origin, pseudo)
    })
  }



  /**
   * loadDocument load the document if it exist in the local storage
   * @param {string} sessionID the session ID of the document
   * @return {[type]} [description]
   */
  loadDocument(sessionID) {
    this.createViewDocument()
    //jQuery(`#${this._editorContainerID} #editor`).attr('id', 'crate-' + id)
    // Initilise the the editor content 
    //this.editor.setText('')

    if (store.get("CRATE2-" + sessionID)) {
      var doc = store.get("CRATE2-" + sessionID)
      this.viewEditor.setContents(doc.delta, "user")
      jQuery(`#${this._editorContainerID} #title`).text(doc.title)
      session.default.openIn(); // this is to convert the links to inside links
    }

    // make title editable
    jQuery(`#${this._editorContainerID} #title`).click(() => {
      jQuery(`#${this._editorContainerID} #title`).attr('contenteditable', 'true')
    })


    /* if (store.get("CRATE2-" + this.model.signalingOptions.session)) {
       this.markers = store.get("CRATE2-" + this.model.signalingOptions.session).markers

       // convert the json objects to Marker object with functions 
       for (var property in this.markers) {
         if (this.markers.hasOwnProperty(property)) {
           this.markers[property] = Object.assign(new Marker(property), this.markers[property])
           this.markers[property].cursor = false
         }
       }

     } else {*/
    this.markers = {}
    // }


    this.model.markers = this.markers

    //if (!this.markers[id]) { 
    //     console.log("Add mythis")
    //this.markers.push(id)
    let id = this.model.uid

    let options = {
      lifeTime: 5 * 1000,
      range: {
        index: 0,
        length: 0
      },
      cursor: false,
      isItME: true
    }



    this.markers[id] = new Marker(id, options, this)

    if (store.get('myId')) {
      this.markers[id].setPseudo(store.get('myId').pseudo)
    } else {
      store.set('myId', {
        id: id,
        pseudo: this.markers[id].pseudoName
      })
    }
    this.UpdateComments()

    //comment module initialization
    let commentOpt = this.viewEditor.options.modules.comment
    commentOpt.commentAddOn = this.markers[id].animal
    commentOpt.commentAuthorId = this.model.uid
    commentOpt.color = this.markers[id].colorRGB
  }

  /**
   * createViewDocument  Create quill editor options for the editor that we wan to create
   * @param  {[type]} containerID [description]
   * @return {[type]}             [description]
   */
  createViewDocument() {

    const toolbarOptions = [
      [{
        'header': [1, 2, 3, 4, 5, 6, false]
      }],
      [{
        'font': []
      }],
      ['bold', 'italic', 'underline', 'strike'], // toggled buttons
      // custom button values
      [{
        'align': []
      }],
      [{
        'list': 'ordered'
      }, {
        'list': 'bullet'
      }],
      //  [{ 'script': 'sub'}, { 'script': 'super' }],      // superscript/subscript
      // [{ 'indent': '-1'}, { 'indent': '+1' }],          // outdent/indent
      /* [{
         'direction': 'rtl'
       }], // text direction

       [{
         'size': ['small', false, 'large', 'huge']
       }], // custom dropdown*/

      [{
        'color': []
      }, {
        'background': []
      }], // dropdown with defaults from theme
      ['clean'], // remove formatting button
      /*['blockquote', 'code-block'],*/
      ['formula', 'image', 'link'],
      ['subdocument'],
      ['comments-toggle'], // comment color on/off
      ['comments-add'] // comment add

    ];

    //todo include the container ID
    //
    let quill = new Quill(`#${this._editorContainerID} #editor`, {
      modules: {
        formula: true,
        toolbar: {
          container: toolbarOptions,
          handlers: {
            subdocument: function(value) {
              let range = this.quill.getSelection();
              // let preview = this.quill.getText(range);
              let preview = window.location.href.split('?')[0] + '?' + session.default.GUID();
              let tooltip = this.quill.theme.tooltip;
              tooltip.edit('link', preview);
            },
            undo: function(value) {
              this.quill.history.undo();
            },
            redo: function(value) {
              this.quill.history.redo();
            }
          }
        },
        cursors: {
          autoRegisterListener: true, // default: true
          hideDelay: 500, // default: 3000
          hideSpeed: 0
          // default: 400
        },
        history: {
          delay: 500,
          maxStack: 1000
        },
        comment: {
          enabled: true,
          commentAuthorId: 123,
          commentAddOn: 'Author Name', // any additional info needed
          color: 'yellow', // comment background color in the text
          commentAddClick: this._comments.commentAddClick, // get called when `ADD COMMENT` btn on options bar is clicked
          commentsClick: this._comments.commentsClick, // get called when you click `COMMENTS` btn on options bar for you to do additional things beside color on/off. Color on/off is already done before the callback is called.
          commentTimestamp: this._comments.commentServerTimestamp,
          containerID: this._editorContainerID
        }
      },

      theme: 'snow'
    });

    $(".ql-subdocument .ql-comments-toggle .ql-comments-add").attr('data-toggle', 'tooltip');
    $(".ql-comments-toggle,.ql-comments-add").css({
      "position": "relative",
      "top": "-5px"
    });

    $(".ql-subdocument").html('<strong>SUB</strong>');
    $(".ql-subdocument").attr('title', 'Add subdocument');

    $('.ql-comments-toggle').html('<i class="fa fa-comments"></i>');
    $(".ql-comments-toggle").attr('title', 'Show/hide comments');


    $('.ql-comments-add').html('<i class="fa fa-comment"></i>');
    $(".ql-comments-add").attr('title', 'Add comment');


    // hook changing the editor when click on save link ==> open in the document
    quill.theme.tooltip.save2 = quill.theme.tooltip.save

    quill.theme.tooltip.save = function() {
      quill.theme.tooltip.save2()
      session.default.openIn()
    }


    this._comments.viewEditor = quill
    this.viewEditor = quill
  }


  /**
   * saveDocument save the document in local storage
   * @return {[type]} [description]
   */
  saveDocument() {
    var timeNow = new Date().getTime()
    var title = jQuery(`#${this._editorContainerID} #title`).text()
    var document = {
      date: timeNow,
      title: title,
      delta: this.viewEditor.editor.delta,
      sequence: this.model.sequence,
      causality: this.model.causality,
      name: this.model.name,
      webRTCOptions: this.model.webRTCOptions,
      markers: {},
      signalingOptions: this.model.signalingOptions
    }
    store.set("CRATE2-" + this.model.signalingOptions.session, document)
    alert("Document is saved successfully")
  }



  /**
   * textChange description
   * @param  {[type]} delta    [description]
   * @param  {[type]} oldDelta [description]
   * @param  {[type]} source   [description]
   * @listens editor content changes
   * @return {[type]}          [description]
   */
  textChange(delta, oldDelta, source) {

    this.cleanQuill()

    this.applyChanges(delta, 0)
  }


  /**
   * applyChanges Send delta object with attributes character by character starting from  the position "iniRetain"  ]
   * @param  {[type]} delta     [description]
   * @param  {[type]} iniRetain [description]
   * @return {[type]}           [description]
   */
  applyChanges(delta, iniRetain) {

    let changes = JSON.parse(JSON.stringify(delta, null, 2))

    let retain = iniRetain

    let text = ""

    changes.ops.forEach((op) => {
      var operation = Object.keys(op)
      var oper = ""
      var att = ""
      var value = ""

      // extract attributes from the operation in the case of there existance
      for (var i = operation.length - 1; i >= 0; i--) {
        var v = op[operation[i]]
        if (operation[i] === "attributes") {
          att = v
        } else {
          oper = operation[i]
          value = v

        }
      }

      // Change the style = remove the word and insert again with attribues,  

      // In the case of changing the style, delta will contain "retain" (the start postion) with attributes 

      var isItInsertWithAtt = false // to know if we have to update comments or not, if its delete because of changing style, no update comments is needed

      retain = this.sendIt(text, att, 0, value, oper, retain, isItInsertWithAtt)
    })
  }

  /**
   * sendIt Send the changes character by character 
   * @param  {[type]}  text              [description]
   * @param  {[type]}  att               [description]
   * @param  {[type]}  start             [description]
   * @param  {[type]}  value             [description]
   * @param  {[type]}  oper              [description]
   * @param  {[type]}  retain            [description]
   * @param  {Boolean} isItInsertWithAtt [description]
   * @return {[type]}                    [description]
   */
  sendIt(text, att, start, value, oper, retain, isItInsertWithAtt) {
    switch (oper) {
      case "retain":
        if (att != "") {
          let isItInsertWithAtt = true

          // the value in this case is the end of format 

          // insert the changed text with the new attributes

          // 1 delete the changed text  from retain to value
          this.sendIt("", "", retain, value, "delete", retain, isItInsertWithAtt)

          // 2 insert with attributes
          var Deltat = this.viewEditor.editor.delta.slice(retain, retain + value)

          this.applyChanges(Deltat, retain)

        } else {
          retain += value

        }

        // If there is attributes than delete and then insert   
        break

      case "insert":
        text = value
        // Insert character by character or by object for the other formats

        // this is a formula
        if (value.formula != undefined) {

          att = this.viewEditor.getFormat(retain, 1)
          this.model.core.insert({
            type: 'formula',
            text: value,
            att: att
          }, retain)
        } else

        {

          // this is a video
          if (value.video != undefined) {

            att = this.viewEditor.getFormat(retain, 1)
            this.model.core.insert({
              type: 'video',
              text: value,
              att: att
            }, retain)


          } else {
            // It is an image
            if (value.image != undefined) {

              att = this.viewEditor.getFormat(retain, 1)

              this.model.core.insert({
                type: 'image',
                text: value,
                att: att
              }, retain)

            } else { // text

              for (var i = retain; i < (retain + text.length); ++i) {
                att = this.viewEditor.getFormat(i, 1)
               debug("Local insert : ", text[i - retain], i)
                this.model.core.insert({
                  type: 'char',
                  text: text[i - retain],
                  att: att
                }, i)
              }
              retain = retain + text.length
            }
          }
        }
        break

      case "delete":
        var length = value

        //to ensure that the editor contains just \n without any attributes 
        if (!isItInsertWithAtt) {
          this.UpdateComments()
        }
        if (start == 0) {
          start = retain
        }
        // Delete caracter by caracter

        for (var i = start; i < (start + length); ++i) {
          this.model.core.remove(start)

        }
        break
    }
    return retain
  }

  /**
   * remoteInsert At the reception of insert operation
   * @param  {[type]} element [description]
   * @param  {[type]} indexp  [description]
   * @return {[type]}         [description]
   */
  remoteInsert(element, indexp) {
    var index = indexp - 1

    debug("Remote Insert : ", element, index)

    if (index !== -1) {
      switch (element.type) {
        case "formula":
          this.viewEditor.insertEmbed(index, 'formula', element.text.formula, 'silent')

          break
        case "image":
          this.viewEditor.insertEmbed(index, 'image', element.text.image, 'silent')

          break
        case "video":
          this.viewEditor.insertEmbed(index, 'video', element.text.video, 'silent')

          break
        case "char":
          this.viewEditor.insertText(index, element.text, element.att, 'silent')

          if (element.text != "\n") {
            this.viewEditor.removeFormat(index, 1, 'silent')
          }
          break
      }
      if (element.att) {
        if (element.text != "\n") {
          this.viewEditor.formatLine(index, element.att, 'silent')
          this.viewEditor.formatText(index, 1, element.att, 'silent')
        }

        if (element.att.commentAuthor) {
          this.UpdateComments()
        }

        if (element.att.link) {
          session.default.openIn()
        }



      }


    }
    session.default.openIn()
    this.cleanQuill()
  }

  /**
   * remoteRemove At the reception of remove operation
   * @param  {[type]} index [description]
   * @return {[type]}       [description]
   */
  remoteRemove(index) {

    debug("Remote remove : ", index)
    let removedIndex = index - 1
    if (removedIndex !== -1) {
      this.viewEditor.deleteText(removedIndex, 1, 'silent')
      this.UpdateComments()
    }
    this.cleanQuill()
  }


  /**
   * remoteCaretMoved At the reception of CARET position
   * @param  {[type]} range  [description]
   * @param  {[type]} origin [description]
   * @return {[type]}        [description]
   */
  remoteCaretMoved(range, origin) {
    if (!origin) return

    if (this.markers[origin]) {
      this.markers[origin].update(range, true) // to keep avatar

    } else {
      let options = {
        lifeTime: 5 * 1000,
        range,
        cursor: false,
        isItME: false
      }
      this.markers[origin] = new Marker(origin, options, this)
    }
  }

  /**
   * cleanQuill description
   * @return {[type]} [description]
   */
  cleanQuill() {

    /*
           delta = quill.editor.delta
           console.log('before clean')
           console.dir(delta)
           
           lastOperation=delta.ops.length-1
           if (delta.ops[lastOperation].insert=='\n' && lastOperation != 0) {

            attributes= delta.ops[lastOperation].attributes
            delete delta.ops[lastOperation]  

            //delta.ops.splice(length-1,1)

           if(lastOperation-1 != 0 && delta.ops[lastOperation-1]) {
              delta.ops[lastOperation-1].attributes=attributes
            }

            }

           /*if (delta.ops[0].insert=='\n' &&  quill.getLength() <=2) {
            delta.ops[0].attributes={}
            }

           console.log('after clean')
           console.dir(delta)
             
          //quill.setContents(delta,'silent')*/
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
    this.model.name = jQuery(`#${this._editorContainerID} #title`).text()
    //TODO: Optimize change only if the text is changed from last state 
    this.model.core.sendChangeTitle(jQuery(`#${this._editorContainerID} #title`).text())
  }


  /**
   * startPing send periodically ping
   * @param  {[type]} interval [description]
   * @return {[type]}          [description]
   * @todo TODO: Make interval as global parameter
   */
  startPing(interval) {
    this.startTimer = setInterval(() => {
      let pseudo = "Anonymous"
      if (store.get('myId').pseudo) {
        pseudo = store.get('myId').pseudo;
      }
      this.model.core.sendPing(pseudo)
    }, interval)
  }

  /**
   * stopPing stopPing
   * @todo  implement this function
   * @return {[type]} [description]
   */
  stopPing() {
    clearInterval(this.startTimer);
  }

  /**
   * atPing at the reception of ping
   * @param  {[type]} origin [description]
   * @param  {[type]} pseudo [description]
   * @return {[type]}        [description]
   */
  atPing(origin, pseudo) {
    if (this.markers[origin]) {
      this.markers[origin].update(null, false) // to keep avatar
      this.markers[origin].setPseudo(pseudo)

    } else { // to create the avatar
      //this.markers.push(origin)
      //

      let options = {
        lifeTime: 5 * 1000,
        range: {
          index: 0,
          length: 0
        },
        cursor: false,
        isItME: false
      }
      this.markers[origin] = new Marker(origin, options, this)
      this.markers[origin].setPseudo(pseudo)
    }
  }

  /**
   * UpdateComments This function to extract the comments form the editor and show them in #comments
   */
  UpdateComments() {
    // clear comments 
    jQuery(`#${this._editorContainerID} #comments`).empty()
    // for each insert check att if it contains the author then insert comment 
    this.viewEditor.editor.delta.ops.forEach((op) => {
      if (op.insert) {
        if (op.attributes) {
          if (op.attributes.commentAuthor) {
            var id = op.attributes.commentAuthor
            //
            let m = {}
            if (this.markers[id]) {
              m = this.markers[id]
            } else {
              m = {
                animal: Marker.getPseudoname(id, null),
                pseudoName: Marker.getPseudoname(id),
                colorRGB: Marker.getColor(id, 'rgb')
              }
            }

            let animal = m.animal
            let pseudoName = m.pseudoName
            let colorRGB = m.colorRGB

            this._comments.addCommentToList(op.attributes.comment, id, animal, pseudoName, colorRGB, op.attributes.commentTimestamp)
          }

        }

      }



    })

  }

  saveComment() {
    this._comments.saveComment();
  }


}
