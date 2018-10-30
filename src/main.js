import Marker from './view/marker'
import { ErrorHandler } from './helpers/ErrorHandler'
import DocumentBuilder from './DocumentBuilder'

export default class Crate {
  constructor(options = null, documentBuilder = null) {
    if (!documentBuilder) {
      documentBuilder = DocumentBuilder
    }
    this.documentBuilder = new documentBuilder(options, this)
    // key=index,value=session
    this._documents = []
    // key=sessionId,value=documentIndex
    this._documentsIds = new Map()
    this.actualSessionIndex = -1
  }

  getDocumentIndexs() {
    let keys = Array.from(this._documents.keys())
    return keys
  }

  getDocument(index) {
    return this._documents[index]
  }

  getNumberOfDocuments() {
    return this._documents.length
  }

  //TODO: Prevent creating two session with the same id
  async createNewDocument(documentId) {
    let documentIndex = this.getIndexFromDocumentId(documentId)
    if (!documentIndex && documentIndex != 0) {
      const documentIndex = this.getNumberOfDocuments()
      const doc = await this.documentBuilder.buildDocument(
        documentId,
        documentIndex
      )
      this._documentsIds.set(documentId, documentIndex)
      this.addDocument(doc)
      doc.init().then(() => {
        this.setActualDocument(documentId)
      })
      return this
    } else {
      throw new Error('The session exist')
    }
  }

  addDocument(document) {
    this._documents.push(document)
    this.updateView()
  }

  removeDocument(documentIndex) {
    if (this.exist(documentIndex)) {
      //change the index off all the sessuib index more than this
      this.getDocumentIndexs()
        .filter(index => index > documentIndex)
        .map(index => this.getDocument(index))
        .map(document => {
          this._documentsIds.set(
            this.getDocumentIdFromIndex(document.documentIndex),
            document.documentIndex - 1
          )
          document.documentIndex -= 1
        })

      const documentId = this.getDocumentIdFromIndex(documentIndex)
      this._documentsIds.delete(documentId)
      //change the new index in  the session
      this._documents.splice(documentIndex, 1)

      this.updateActualDocumentIndex(documentIndex)
      this.updateView()
    } else {
      throw new ErrorHandler().SESSION_NOT_FOUND(documentIndex)
    }
  }

  updateActualDocumentIndex(removedIndex) {
    // if we remove the selected document move to previous if exist, else move to next if exist, else set  actualSessionIndex = -1
    if (this.actualSessionIndex === removedIndex) {
      if (this.exist(removedIndex - 1)) {
        this.setActualDocument(this.getDocumentIdFromIndex(removedIndex - 1))
      } else if (this.exist(removedIndex + 1)) {
        this.setActualDocument(this.getDocumentIdFromIndex(removedIndex + 1))
      } else {
        this.actualSessionIndex = -1
      }
    } else if (this.actualSessionIndex > documentIndex) {
      this.actualSessionIndex--
    }
  }
  focusInToDocument(documentIndex) {
    if (this.exist(documentIndex)) {
      this.getDocument(documentIndex).emit('FocusIn')
    } else {
      throw new ErrorHandler().SESSION_NOT_FOUND(documentIndex)
    }
  }

  focusOutToDocument(documentIndex) {
    if (this.exist(documentIndex)) {
      this.getDocument(documentIndex).emit('FocusOut')
    } else {
      throw ErrorHandler().SESSION_NOT_FOUND(documentIndex)
    }
  }

  getIndexFromDocumentId(documentId) {
    return this._documentsIds.get(documentId)
  }

  getDocumentIdFromIndex(documentIndex) {
    return this.getDocument(documentIndex).documentId
  }

  setActualDocument(documentId) {
    const documentIndex = this.getIndexFromDocumentId(documentId)
    if (
      documentIndex !== undefined &&
      this.actualSessionIndex != documentIndex
    ) {
      this.actualSessionIndex = documentIndex
      this.focusInToDocument(documentIndex)

      //emit FocusOut to all other sessions
      this.getDocumentIndexs()
        .filter(index => index != documentIndex)
        .forEach(documentIndex => this.focusOutToDocument(documentIndex))
    } else {
      throw Error('Session ' + documentId + ' dose not exist')
    }
  }

  getActualDocument() {
    return this.getDocument(this.actualSessionIndex)
  }

  //TODO: remove this function
  async addNewDocument(sessionId) {
    let documentIndex = this.getIndexFromDocumentId(sessionId)
    if (!documentIndex && documentIndex != 0) {
      await this.createNewDocument(sessionId)
      documentIndex = this.getIndexFromDocumentId(sessionId)
    }
    return this
  }

  updateView() {
    this.getDocumentIndexs().forEach(documentIndex => {
      this.getDocument(documentIndex).emit(
        'UpdateView',
        this.getNumberOfDocuments()
      )
    })
  }

  /**
   * focus on the next session of it is possible
   */
  moveToNext() {
    return this.moveTo(this.actualSessionIndex + 1)
  }

  /**
   * focus on the previous session
   */
  moveToPrevious() {
    return this.moveTo(this.actualSessionIndex - 1)
  }

  moveTo(documentIndex) {
    if (this.exist(documentIndex)) {
      this.setActualDocument(this.getDocumentIdFromIndex(documentIndex))
    }
    return this
  }

  exist(documentIndex) {
    return this.getDocument(documentIndex) !== undefined
  }
}

Crate.Marker = Marker
