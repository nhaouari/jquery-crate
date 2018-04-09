let Model = require('./model/model.js')
let GUID = require('./model/guid.js')
let VEditor = require('./view/editor.js')
let VLink = require('./view/link.js')
let VStatesHeader = require('./view/statesheader.js')
let CStatesHeader = require('./controller/statesheader.js')
let CEditor = require('./controller/editor.js')


window.GUID2 = GUID
/*!
 * \brief transform the selected division into a distributed and decentralized 
 * collaborative editor.
 * \param options {
 *   signalingOptions: configure the signaling service to join or share the
 *     document. {address: http://example.of.signaling.service.address,
 *                session: the-session-unique-identifier,
 *                connect: true|false}
 *   webRTCOptions: configure the STUN/TURN server to establish WebRTC
 *     connections.
 *   styleOptions: change the default styling options of the editor.
 *   name: the name of the document
 *   importFromJSON: the json object containing the aformentionned options plus
 *     the saved sequence. If any of the other above options are specified, the
 *     option in the json object are erased by them.
 * }
 */

class doc {
  constructor(options, foglet) {
    // #1 initialize the model
    const model = new Model(options)

    // #2 initialize the view
    const divId = GUID()
   
    const ve = new VEditor(divId, options.signalingOptions.room)
    const vsh = new VStatesHeader(model, jQuery("#state"))
    const vl = new VLink(jQuery("#sharinglink"))
    const vsb = jQuery("#shareicon")

    // #3 initialize the controllers
    // model, statesView, linkView, shareView){
    const csh = new CStatesHeader(model, vsh, vl, vsb)
    const ce = new CEditor(model, ve, options.signalingOptions.room)

    // #4 grant quick access

    this.model = model
    window.crate_model = this.model
    window.crate_model.csh = csh
  }
}

module.exports = doc