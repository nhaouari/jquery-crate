/*!
 * \brief object that represents the result of an insert operation
 * \param insert the result of the local insert operation
 * \param origin the origin of the insertion
 */
export function MInsertOperation(insert, origin){
    this.type = "MInsertOperation";
    this.insert = insert;
    this.origin = origin;
};


export function MAEInsertOperation(insert, id){
    this.type = "MAEInsertOperation";
    this.payload = new MInsertOperation(insert,id);
    this.id = {e:id};
    this.isReady = null;
};

/*!
 * \brief object that represents the result of a delete operation
 * \param remove the result of the local delete operation
 * \param origin the origin of the removal
 */
export function MRemoveOperation(remove, origin){
    this.type = "MRemoveOperation";
    this.remove = remove;
    this.origin = origin;
};


/*!
 * \brief object that represents the result of a caretMoved Operation
 * \param range the selection range
 * \param origin the origin of the selection
 */
export function MCaretMovedOperation(range, origin){
    this.type = "MCaretMovedOperation";
    this.range = range;
    this.origin = origin;
};




/*!
 * \brief message containing data to broadcast
 * \param name the name of the protocol, default 'causal'
 * \param id the identifier of the broadcast message
 * \param isReady the identifier(s) that must exist to deliver this message
 * \param payload the broadcasted data
 */
export function MBroadcast(name, id, isReady, payload){
    this.protocol = name;
    this.id = id;
    this.isReady = isReady;
    this.payload = payload;
};






/*!
 * \brief message that request an AntiEntropy 
 * \param causality the causality structure
 */
export function MAntiEntropyRequest(causality){
    this.type = 'MAntiEntropyRequest';
    this.causality = causality;
};


/*!
 * \brief message responding to the AntiEntropy request
 * \param id the identifier of the response message
 * \param causality the causality structure
 * \param nbElements the number of element to send
 * \param element each element to send 
 */
export function MAntiEntropyResponse(id, causality, nbElements, element){
    this.type = 'MAntiEntropyResponse';
    this.id = id;
    this.causality = causality;
    this.nbElements = nbElements;
    this.element = element;
    this.elements = [];
};


