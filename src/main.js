import Marker from './view/marker'
import { ErrorHandler } from './helpers/ErrorHandler'
import DocumentBuilder from './DocumentBuilder'
import { GUID } from './helpers/randomID'

/**
 * @typedef {Object} Core
 * @property {Object} documentBuilder the builder of the documents
 * @property {Document[]} _documents the list of the documents in the session
 * @property {number[]} _documentsIds The index ids of the documents
 * @property {number} actualSessionIndex the index id of the actual document
 *
 */

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

    // Documents that are started creating them, this is to avoid to create twice the same document
    this._documentsWaiting = new Set()
  }

  /**
   * Get all document indexes
   */
  getDocumentIndexs() {
    let keys = Array.from(this._documents.keys())
    return keys
  }

  /**
   * Get document by its index
   * @param {*} index  it is index in the core
   * @deprecated
   */
  getDocument(index) {
    return this._documents[index]
  }

  /**
   * Get document by its index
   * @param {*} index  it is index in the core
   */
  getDocumentByIndex(index) {
    return this._documents[index]
  }

  /**
   * Get document by its document Id
   * @param {string} documentId  it is index in the core
   */
  getDocumentByDocumentId(documentId) {
    const index = this.getIndexFromDocumentId(documentId)
    return this._documents[index]
  }

  getNumberOfDocuments() {
    return this._documents.length
  }

  /**
   * Create a new document ans set it as actual document
   * @param {string} documentId the id of the document
   * @param {Object} specialOpts special options that override the default options
   * @returns {void|Core}
   */
  async createNewDocument(documentId, specialOpts = {}) {
    const searchIndex = this.getIndexFromDocumentId(documentId)
    const waitingCreation = this._documentsWaiting.has(documentId)
    if (!searchIndex && searchIndex != 0 && !waitingCreation) {
      this._documentsWaiting.add(documentId)
      const documentIndex = this.getNumberOfDocuments()
      const doc = await this.documentBuilder.buildDocument(
        documentId,
        documentIndex,
        null,
        specialOpts
      )

      doc
        .init()
        .then(() => {
          this.addDocument(doc)
          this._documentsIds.set(documentId, documentIndex)
          this._documentsWaiting.delete(documentId)
          this.setActualDocument(documentId)
        })
        .catch(err => {
          this._documentsWaiting.delete(documentId)
          console.error('problem in the creation of the document', err)
        })

      return doc
    } else if (!waitingCreation) {
      this.setActualDocument(documentId)
      return this.getDocumentByDocumentId(documentId)
    } else {
      console.warn('The document is under creation')
      return null
    }
  }

  /**
   * add document to list of documents
   * @param {Document} document
   */
  addDocument(document) {
    this._documents.push(document)
    this.updateView()
  }

  /**
   *  remove document and update the status of the different documents
   * @param {number} documentIndex
   */
  removeDocument(documentIndex) {
    if (this.exist(documentIndex)) {
      //Change the index off all the documentIndexs that are greater than documentIndex

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

  /**
   * Update the actual document index after removing a document
   * @param {number} removedIndex
   */
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
    } else if (this.actualSessionIndex > removedIndex) {
      this.actualSessionIndex--
    }
  }

  /**
   * Emit FocusIn event to the document with documentIndex index
   * @param {number} documentIndex
   */
  focusInToDocument(documentIndex) {
    if (this.exist(documentIndex)) {
      this.getDocument(documentIndex).emit('FocusIn')
    } else {
      throw new ErrorHandler().SESSION_NOT_FOUND(documentIndex)
    }
  }

  /**
   * Emit FocusOut event to the document with documentIndex index
   * @param {number} documentIndex
   */
  focusOutToDocument(documentIndex) {
    if (this.exist(documentIndex)) {
      this.getDocument(documentIndex).emit('FocusOut')
    } else {
      throw ErrorHandler().SESSION_NOT_FOUND(documentIndex)
    }
  }

  /**
   * get Document Index from document Id
   * @param {string} documentId
   * @returns {number} documentIndex
   */
  getIndexFromDocumentId(documentId) {
    return this._documentsIds.get(documentId)
  }

  /**
   * get Document Id from document Index
   * @param {number} documentIndex
   * @returns {string} documentId
   */
  getDocumentIdFromIndex(documentIndex) {
    return this.getDocument(documentIndex).documentId
  }

  /**
   * Set actual document by document Id. The actual document is the document that w're editing
   * @param {string} documentId
   */
  setActualDocument(documentId) {
    const documentIndex = this.getIndexFromDocumentId(documentId)

    if (documentIndex === undefined) {
      throw Error('Document ' + documentId + ' dose not exist')
    } else if (this.actualSessionIndex != documentIndex) {
      this.actualSessionIndex = documentIndex
      this.focusInToDocument(documentIndex)

      //emit FocusOut to all other sessions
      this.getDocumentIndexs()
        .filter(index => index != documentIndex)
        .forEach(documentIndex => this.focusOutToDocument(documentIndex))
    }
  }

  /**
   * get actual document index
   * @returns {Document}
   *    */
  getActualDocument() {
    return this.getDocument(this.actualSessionIndex)
  }

  /**
   * Emit 'UpdateView' to all the documents
   */
  updateView() {
    this.getDocumentIndexs().forEach(documentIndex => {
      this.getDocument(documentIndex).emit(
        'UpdateView',
        this.getNumberOfDocuments()
      )
    })
  }

  /**
   * Focus on the next document (it dose exist)
   */
  moveToNext() {
    return this.moveTo(this.actualSessionIndex + 1)
  }

  /**
   * Focus on the Previous document (it dose exist)
   */
  moveToPrevious() {
    return this.moveTo(this.actualSessionIndex - 1)
  }

  /**
   * Move to a given document index
   * @param {number} documentIndex
   * @returns {Core} document
   */
  moveTo(documentIndex) {
    if (this.exist(documentIndex)) {
      this.setActualDocument(this.getDocumentIdFromIndex(documentIndex))
    }
    return this
  }

  /**
   * Dose the given documment index exist in the list of documents
   * @param {number} documentIndex
   */
  exist(documentIndex) {
    return this.getDocument(documentIndex) !== undefined
  }

  /**
   * Get random Id, this used for documents and for users
   * @returns {string} random Id
   */
  static getRandomId() {
    return GUID()
  }
}

Crate.Marker = Marker
