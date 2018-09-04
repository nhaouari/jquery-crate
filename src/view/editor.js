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
   * @param  {[doc]} document  this is the object that contains all proprieties of a document.    
   * @param  {[string]} sessionID [description]
   */
  constructor(document, sessionID, editorContainerID) {
    super()
    /**
     * this is the object that contains all proprieties of a document.
     * @type {[doc]}
     */
    this._document = document
    /**
     *  ViewEditor the used editor, here it is Quill editor 
     *  @see  https://quilljs.com/
     * @type {Quill}
     */
  
    this._editorContainerID = editorContainerID

    this._comments = {}
    this._sessionID = sessionID

    this.loadDocument()
    this.initDocument()
  }

  /**
   * loadDocument load the document if it exist in the local storage
   * @param {string} sessionID the session ID of the document
   * @return {[type]} [description]
   */
  loadDocument() {   
    this._comments = new Comments(this)
    this._quillManager = new QuillManager(this._editorContainerID, this._comments)
    this.viewEditor = this._quillManager.getQuill()

    const defaultOpts= {document:this._document,editor:this,PingPeriod:5000,AntiEntropyPeriod:5000}
    
    this.markerManager = new MarkerManager(defaultOpts)
    this.textManager= new TextManager(defaultOpts) 
  }


  initDocument(){

    this.markerManager.addMarker(this._document.uid, true)
    
    this.loadLocalContent(this._sessionID)

    this.makeTitleEditable()
    
    this._comments.init(this).addAuthorInformation().UpdateComments()

    this.startEventListeners()
  }


  /**
   * load content from localStorage if it exist
   * @param {*} sessionID 
   */
  loadLocalContent(){
    if (store.get("CRATE2-" +  this._sessionID)) {
    const doc = store.get("CRATE2-" +  this._sessionID)
    this.viewEditor.setContents(doc.delta, "user")
    jQuery(`#${this._editorContainerID} #title`).text(doc.title)
    session.default.openIn(); // this is to convert the links to inside links
  }
  }

  makeTitleEditable() {
     // make title editable
     jQuery(`#${this._editorContainerID} #title`).click(() => {
      jQuery(`#${this._editorContainerID} #title`).attr('contenteditable', 'true')
    })

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
      sequence: this._document.sequence,
      causality: this._document.causality,
      name: this._document.name,
      webRTCOptions: this._document.webRTCOptions,
      markers: {},
      signalingOptions: this._document.signalingOptions
    }
    store.set("CRATE2-" + this._document.signalingOptions.session, document)
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

    let start = iniRetain

    let Operations = this.getOperations(delta)

    Operations.map(operation=>{
      start= this.sendIt(operation, start, false)
    })
  
  }



  getOperations(changesDelta) {
   
    const operations = changesDelta.ops.map(op=>this.extractOperationInformation(op) )
  
    return operations
  }

  extractOperationInformation(op){
    const operation = Object.keys(op)
    let Name = ""
    let Attributes = ""
    let Value = ""

    // extract attributes from the operation in the case of there existance
    for (let i = operation.length - 1; i >= 0; i--) {
      const v = op[operation[i]]
      if (operation[i] === "attributes") {
        Attributes = v
      } else {
        Name = operation[i]
        Value = v
      }
    }
    const Type= this.getTypeOfContent(Value)
    console.log('extractOperationInformation',{Name,Value,Attributes,Type})
    return {Name,Value,Attributes,Type}
  }

  getTypeOfContent(value){
 
      if (value.formula != undefined)
          return 'formula'
      
      if (value.video != undefined)
          return 'video'
     
      if (value.image != undefined)
          return 'image'
      
      return 'text'
    }


  /**
   * sendIt Send the changes character by character 
   * @param  {[type]}  text              [description]
   * @param  {[type]}  operation.Attributes               [description]
   * @param  {[type]}  start             [description]
   * @param  {[type]}  operation.Value             [description]
   * @param  {[type]}  operation.Name              [description]
   * @param  {[type]}  start            [description]
   * @param  {Boolean} isItInsertWithAtt [description]
   * @return {[type]}                    [description]
   */
  sendIt(operation, start, isItInsertWithAtt) {
    switch (operation.Name) {
      case "retain":
        if (operation.Attributes != "") {
          let isItInsertWithAtt = true

          // the value in this case is the end of format 

          // insert the changed text with the new attributes

          // 1 delete the changed text  from retain to value

          this.sendDelete(start,operation.Value,isItInsertWithAtt)
      
          // 2 Get delta of the insert text with attributes
          const delta = this.getDelta(start, start + operation.Value)
          this.applyChanges(delta, start)

        } else {
          start += operation.Value

        }

        // If there is attributes than delete and then insert   
        break

      case "insert":
        start= this.sendInsert(start,operation)
        break

      case "delete":
        this.sendDelete(start,operation.Value,isItInsertWithAtt)
      break
    }
    return start
  }

  sendInsert(index,Operation){
    if (Operation.Type==="text") {
      this.sendCharByChar(Operation.Value,index)
      return  index + Operation.Value.length
    } else {
      this.insert(Operation.Type,Operation.Value,index)
      return index+1
    }
  
  }
  sendCharByChar(text,index){
    for (let i = index; i < (index + text.length); ++i) {
      debug('send [%]',text[i - index])
      this.insert('char',text[i - index],i)
    }
  }
  sendDelete(index,length,isItInsertWithAtt){

    console.log('Send delete',index,length,isItInsertWithAtt );
    //to ensure that the editor contains just \n without any attributes 
    if (!isItInsertWithAtt) {
      this._comments.UpdateComments()
    }
    
    // Delete caracter by caracter

    for (var i = index; i < (index + length); ++i) {
      this.textManager._removeManager.remove(index)
    }
  }

  getDelta(index1,index2) {
    return this.viewEditor.editor.delta.slice(index1, index2)
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