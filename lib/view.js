let VEditor = require('./view/editor.js')
let VLink = require('./view/link.js')
let VStatesHeader = require('./view/statesheader.js')
let CStatesHeader = require('./controller/statesheader.js')
let CEditor = require('./controller/editor.js')

class view {
    constructor(options, model) {
        // #2 initialize the view

        const ce = new CEditor(model, options.signalingOptions.room)

        const vsh = new VStatesHeader(model, jQuery("#state"))
        


        const vl = new VLink(jQuery("#sharinglink"))

      
        const vsb = jQuery("#shareicon")
  const csh = new CStatesHeader(model, vsh, vl, vsb)
        // #3 initialize the controllers
        // model, statesView, linkView, shareView){
      


    }
}

module.exports = view