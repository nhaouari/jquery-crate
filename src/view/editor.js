import { Comments } from '../view/comments'
import { EventEmitter } from 'events'

import { QuillManager } from './QuillManger'

import { MarkerViewManager } from './MarkerViewManager'

var debug = require('debug')('crate:view:editor')

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
  }

  /**
   * loadDocument load the document if it exist in the local storage
   * @param {string} sessionID the session ID of the document
   * @return {[type]} [description]
   */
  loadDocument() {
    this._comments = new Comments(this)
    this._quillManager = new QuillManager(
      this._editorContainerID,
      this._comments,
      this
    )
    this.viewEditor = this._quillManager.getQuill()
  }

  initDocument() {
    this.loadDocument()
    this.initCommunicationModules()

    this.loadLocalContent(this._sessionID)

    this._comments
      .init(this)
      .addAuthorInformation()
      .UpdateComments()

    this.startEventListeners()
  }

  initCommunicationModules() {
    this.markerManager = this._document._communication.markerManager
    this.textManager = this._document._communication.textManager
    this._MarkerViewManager = new MarkerViewManager(this.markerManager, this)
  }

  /**
   * load content from localStorage if it exist
   * @param {*} sessionID
   */
  loadLocalContent() {
    if (store.get('CRATE2-' + this._sessionID)) {
      const doc = store.get('CRATE2-' + this._sessionID)
      this.viewEditor.setContents(doc.delta, 'user')
      jQuery(`#${this._editorContainerID} #title`).text(doc.title)
      this.convertLocalLinks() // this is to convert the links to inside links
    }
  }

  /**
   * Start all the event listeners related to the editor
   */
  startEventListeners() {
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

    this.textManager._removeManager.on('remoteRemove', index => {
      this.remoteRemove(index)
      this.emit('thereAreChanges')
    })

    //At the reception of Title changed operation
    this.textManager._titleManager.on('changeTitle', title => {
      jQuery(`#${this._editorContainerID} #title`).text(title)
      this.emit('thereAreChanges')
    })
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

    Operations.map(operation => {
      start = this.sendIt(operation, start, false)
    })
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
      case 'retain':
        this.sendFormat(start, operation)
        break

      case 'insert':
        this.sendInsert(start, operation)
        break

      case 'delete':
        this.sendDelete(start, operation, isItInsertWithAtt)
        break
    }
    return this.getNextIndex(start, operation)
  }

  getNextIndex(index, operation) {
    debug('getNextIndex', { index, operation })
    let nextIndex = index

    if (operation.Name === 'insert' && operation.Type === 'text') {
      nextIndex = index + operation.Value.length
    }

    if (operation.Name === 'insert' && operation.Type != 'text') {
      nextIndex = index + 1
    }

    if (operation.Name === 'retain' && operation.Attributes === '') {
      nextIndex = index + operation.Value
    }

    debug('getNextIndex', { nextIndex })
    return nextIndex
  }

  /**inline operations */

  isItBlock(Attributes) {
    const props = [
      'blockquote',
      'header',
      'indent',
      'list',
      'align',
      'direction',
      'code-block'
    ]
    let a = Object.getOwnPropertyNames(Attributes)

    let found = false
    a.forEach(att => {
      const index = props.indexOf(att)
      if (index > -1) {
        found = true
      }
    })
    return found
  }

  /**
 *   the value in this case is the end of format 

  insert the changed text with the new attributes

 1 delete the changed text  from retain to value

 If there is attributes than delete and then insert 
 * @param {*} operation 
 * @param {*} start 
 */

  sendFormat(start, operation) {
    if (operation.Attributes != '') {
      let isItInsertWithAtt = true
      let s = start
      let length = operation.Value

      let blocAttributes = null
      /* if(this.isItBlock(operation.Attributes)&&s>0){
        s-=1
        blocAttributes=operation.Attributes
        const range= this.viewEditor.getSelection()

        if(range.index>=s){
          s-=1
        } else {
          //length= s+operation.Value
          s=range.index
          length= s+operation.Value
        }
      }
*/
      // 2 Get delta of the insert text with attributes
      const delta = this.getDelta(s, s + length)
      const operations = this.getOperations(delta)
      const insertOperations = operations.filter(op => op.Name === 'insert')

      insertOperations.map(op => {
        if (this.isItComplete(op.Attributes)) {
          let opp = op
          if (blocAttributes) {
            opp.Attributes = { ...opp.Attributes, ...blocAttributes }
          }
          this.sendDelete(s, opp, isItInsertWithAtt)
          s = this.sendInsert(s, opp)
        }
      })
    }
  }

  /** sometimes we receive the attributes one by one if they are not complete yet we wait
   * we have to specify the first attrubyte that appears and the their number
   */
  isItComplete(attributes) {
    if (
      attributes.hasOwnProperty('commentAuthor') &&
      Object.keys(attributes).length < 5
    ) {
      return false
    }
    return true
  }
  sendInsert(index, Operation) {
    if (Operation.Type === 'text') {
      this.sendCharByChar(Operation.Value, index)
    } else {
      this.insert(Operation.Type, Operation.Value, index)
    }
    return index + Operation.Length
  }

  sendCharByChar(text, index) {
    for (let i = index; i < index + text.length; ++i) {
      debug('send [%]', text[i - index])
      this.insert('char', text[i - index], i)
    }
  }

  sendDelete(index, operation, isItInsertWithAtt) {
    console.log('Send delete', index, operation, isItInsertWithAtt)
    //to ensure that the editor contains just \n without any attributes
    if (!isItInsertWithAtt) {
      this._comments.UpdateComments()
    }
    // Delete caracter by caracter
    for (var i = index; i < index + operation.Length; ++i) {
      this.textManager._removeManager.remove(index)
    }
  }

  insert(type, content, position) {
    const attributes = this.viewEditor.getFormat(position, 1)
    const packet = { type, content, attributes }
    this.textManager._insertManager.insert({ packet, position })
    if (Object.keys(attributes).length > 0) {
      this.updateCommentsLinks()
    }
  }

  /**
   * remoteInsert At the reception of insert operation
   * @param  {[type]} element [description]
   * @param  {[type]} indexp  [description]
   * @return {[type]}         [description]
   */
  remoteInsert(element, indexp) {
    var index = indexp - 1

    debug('Remote Insert : ', element, index)

    if (index !== -1) {
      if (element.type === 'char') {
        this.viewEditor.insertText(
          index,
          element.content,
          element.attributes,
          'silent'
        )

        if (element.content != '\n') {
          this.viewEditor.removeFormat(index, 1, 'silent')
        }
      } else {
        this.viewEditor.insertEmbed(
          index,
          element.type,
          element.content[element.type],
          'silent'
        )
      }

      if (element.attributes) {
        if (element.text != '\n') {
          this.viewEditor.formatLine(index, element.attributes, 'silent')
          this.viewEditor.formatText(index, 1, element.attributes, 'silent')
        }
        this.updateCommentsLinks()
      }
    }
  }

  /**
   * remoteRemove At the reception of remove operation
   * @param  {[type]} index [description]
   * @return {[type]}       [description]
   */
  remoteRemove(index) {
    debug('Remote remove : ', index)
    let removedIndex = index - 1
    if (removedIndex !== -1) {
      this.viewEditor.deleteText(removedIndex, 1, 'silent')
      this.updateCommentsLinks()
    }
  }

  getDelta(start, end) {
    return this.viewEditor.editor.delta.slice(start, end)
  }

  updateCommentsLinks() {
    clearTimeout(this._timeout)
    this._timeout = setTimeout(() => {
      this.convertLocalLinks()
      this._comments.UpdateComments()
    }, 500)
  }

  convertLocalLinks() {
    const linksToCrate = this.getAllLinksToCrate()

    linksToCrate.forEach(link => {
      let sessionId = link.attr('id') || link.attr('href').split('?')[1]
      link.attr('href', '#')
      link.attr('id', sessionId)
      link.addClass('CrateSessionID')
      link[0].onclick = () => {
        this._document.createNewDocument(sessionId)
      }
    })
  }

  getAllLinksToCrate() {
    const linksToCrate = []
    const links = $(`#${this._document._view._editorContainerID} a`)
    for (let l of links) {
      const link = $(l)
      if (
        l.href.includes(window.location.href.split('?')[0]) ||
        l.className.includes('CrateSessionID')
      ) {
        linksToCrate.push(link)
      }
    }
    return linksToCrate
  }

  getOperations(changesDelta) {
    const operations = changesDelta.ops.map(op =>
      this.extractOperationInformation(op)
    )
    return operations
  }

  extractOperationInformation(op) {
    const operation = Object.keys(op)
    let Name = ''
    let Attributes = ''
    let Value = ''
    let Length = 1

    // extract attributes from the operation in the case of there existance
    for (let i = operation.length - 1; i >= 0; i--) {
      const v = op[operation[i]]
      if (operation[i] === 'attributes') {
        Attributes = v
      } else {
        Name = operation[i]
        Value = v
      }
    }
    const Type = this.getTypeOfContent(Value)

    if (Name === 'delete') {
      Length = Value
    } else if (Type === 'text') {
      Length = Value.length
    }

    debug('extractOperationInformation', {
      Name,
      Value,
      Attributes,
      Type,
      Length
    })
    return { Name, Value, Attributes, Type, Length }
  }

  getTypeOfContent(value) {
    if (value.formula != undefined) return 'formula'

    if (value.video != undefined) return 'video'

    if (value.image != undefined) return 'image'

    return 'text'
  }
}
