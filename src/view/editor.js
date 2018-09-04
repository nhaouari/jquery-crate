import Marker from "../view/marker"
import {
  Comments
} from "../view/comments"
import {
  EventEmitter
} from "events"
import {
  MarkerManager
} from "./maker-manager"
import {
  QuillManager
} from "./QuillManger"

import {TextManager} from "./text-manager"

var debug = require('debug')('crate:view:editor')


Quill.register('modules/cursors', QuillCursors);
Quill.register('modules/comment', QuillComment);

/**
 * EditorController this the link between the core functions and the interface.
 */

export class EditorController extends EventEmitter {
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
     *  ViewEditor the used editor, here it is Quill editor 
     *  @see  https://quilljs.com/
     * @type {Quill}
     */
    //this.viewEditor = {};

    this._editorContainerID = editorContainerID

    this._comments = {}
    this._sessionID = sessionID

    this.loadDocument(sessionID)
    this.startEventListeners()
  }




  /**
   * loadDocument load the document if it exist in the local storage
   * @param {string} sessionID the session ID of the document
   * @return {[type]} [description]
   */
  loadDocument(sessionID) {
    const itIsMe = true
   
    this._comments = new Comments(this)
    this.createViewDocument()

    const defaultOpts= {document:this.model,editor:this}
    this.markerManager = new MarkerManager({period:5000,...defaultOpts})
    this.textManager= new TextManager({AntiEntropyPeriod:5000,...defaultOpts}) 
    this.markerManager.addMarker(this.model.uid, itIsMe)
    

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

    this._comments.init(this).addAuthorInformation().UpdateComments()

  }


  /**
   * Start all the event listeners related to the editor
   */
  startEventListeners() {

    //Menu Bar events
    jQuery(`#${this._editorContainerID} #saveicon`).click(() => {
      this.saveDocument()
    })

    jQuery(`#${this._editorContainerID} #title`).focusout(() => {
      this.changeTitle()
      this.emit('thereAreChanges')
    })


    // Local events 
    this.viewEditor.on('selection-change', (range, oldRange, source) => {
      if (range) {
        this.markerManager.caretMoved(range)
      }
    })

    this.viewEditor.on('text-change', (delta, oldDelta, source) => {
      this.textChange(delta, oldDelta, source)
      this.emit('thereAreChanges')

    })

    // Remote events
    this.textManager._insertManager.on('remoteInsert', (element, indexp) => {
      this.remoteInsert(element, indexp)
      this.emit('thereAreChanges')
    })

    this.textManager._removeManager.on('remoteRemove', (index) => {
      this.remoteRemove(index)
      this.emit('thereAreChanges')
    })

    //At the reception of Title changed operation 
    this.textManager._titleManager.on('changeTitle', (title) => {
      jQuery(`#${this._editorContainerID} #title`).text(title)
      this.emit('thereAreChanges')
    })


  }

  /**
   * createViewDocument  Create quill editor options for the editor that we wan to create
   * @param  {[type]} containerID [description]
   * @return {[type]}             [description]
   */
  createViewDocument() {
    this._quillManager = new QuillManager(this._editorContainerID, this._comments)
    this.viewEditor = this._quillManager.getQuill()
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
          this.insert('formula',value,retain)
        } else

        {
          // this is a video
          if (value.video != undefined) {
              this.insert('video',value,retain)
          } else {
            // It is an image
            if (value.image != undefined) {
              this.insert('image',value,retain)
            } else { // text

              for (var i = retain; i < (retain + text.length); ++i) {
                debug("Local insert : ", text[i - retain], i)

                this.insert('char',text[i - retain],i)
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
          this._comments.UpdateComments()
        }
        if (start == 0) {
          start = retain
        }
        // Delete caracter by caracter

        for (var i = start; i < (start + length); ++i) {
          this.textManager._removeManager.remove(start)
        }
        break
    }
    return retain
  }

  insert(type,content,position) {
    const att = this.viewEditor.getFormat(position, 1)
    const packet = {
      type: type,
      text: content,
      att: att
    }
    this.textManager._insertManager.insert({packet, position})
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
          this._comments.UpdateComments()
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
      this._comments.UpdateComments()
    }
    this.cleanQuill()
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
    
    //TODO: Optimize change only if the text is changed from last state 
    this.textManager._titleManager.sendChangeTitle(jQuery(`#${this._editorContainerID} #title`).text())
  }

}