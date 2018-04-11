let VLink = require('./view/link.js')
let CStatesHeader = require('./controller/statesheader.js')
let CEditor = require('./controller/editor.js')

class view {
    constructor(options, model) {
        // #2 initialize the view

        const ce = new CEditor(model, options.signalingOptions.room)
        const vl = new VLink(jQuery("#sharinglink"))
        const vsb = jQuery("#shareicon")
        const csh = new CStatesHeader(model, vl, vsb)
        // #3 initialize the controllers
        // model, statesView, linkView, shareView){



    }
}

module.exports = view