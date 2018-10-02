 //require('jquery-qrcode')
 /**
  * Marker is class for managing the marker of one user,it includes the caret, avatar, and pseudo Names.
  */

 export class StatesHeader {
     /**
      * StatesHeader is class that is for showing the state of the network, share option of the document.
      * @param  {[type]} model     [description]
      * @param  {[type]} linkView  [description]
      * @param  {[type]} shareView [description]
      * @return {[type]}           [description]
      */
     constructor(model, linkView, shareView, editorContainerID) {

         this.model = model
         this.startSharingText = '<i class="fa fa-link fa-2x ficon2"></i>'
         this.startSharingTooltip = 'start sharing'
         this.stopSharingText = '<i class="fa fa-unlink fa-2x ficon2"></i>'
         this.stopSharingTooltip = 'stop sharing'

         this.red = "#cd2626"
         this.yellow = "#eead0e"
         this.green = "#228b22"
         this.blue = "#00BFFF"
         this._editorContainerID = editorContainerID
         this.networkState = jQuery(`#${this._editorContainerID} #state`)

         this.setNetworkState("connected");
         model.rps.on("open", () => {
                    this.setNetworkState('connected')
            }
        )

        model.rps.on("close", (id) => {
                    setTimeout(()=>{
                        if(model._foglet.getNeighbours(Infinity).length<=0)
                        this.setNetworkState('disconnected')
                    }
                    ,5000) 
                }
            )

         shareView.click(() => {
             var address = (window.location.href).split('?')[0]
             linkView.printLink(address + "?" + this.model.signalingOptions.session)

             jQuery(`#${this._editorContainerID} #copyButton`).click(() => {
                 this.copyLink()
             })

         })

         linkView.qrcode.click(() => {
             var address = (window.location.href).split('?')[0]
             address = address + "?" + this.model.signalingOptions.session
             linkView.qrcodeCanvas.html("")
             linkView.qrcodeCanvas.qrcode({
                 size: 400,
                 text: address
             })
         })
     }


     /**
      * copyLink copy the link of the document
      * @return {[type]} [description]
      */
     copyLink() {
         console.log(`Copy => #${this._editorContainerID} #sessionUrl`)
         jQuery(`#${this._editorContainerID} #sessionUrl`).select()
         document.execCommand("Copy")
     }


     /**
      * Set the state of the network on the browser 
      * @param {[type]} state set three different states according Spray protocol states:'connected', 'partiallyconnected', and 'disconnected' 
      */
     setNetworkState(state) {
         switch (state) {
             case "connected":
                 var connectedString =
                     `<span class='alert-success'>Congratulations!</span>
                     You are connected to people, and people are 
                     connected to you. <span class='alert-info'>You can start editing " 
                     together</span>.`
                 this.networkState.css("color", this.green)
                 this.networkState.attr("data-content", connectedString)
                 break
             case "partiallyConnected":
                 var partiallyConnectedString =
                     `<span class='alert-warning'>Partially connected</span>: 
                     either you are connected to people, or people are connected to you. 
                     This is not great, but you <span class='alert-info'> still can edit.</span>`

                 this.networkState.css("color", this.yellow)
                 this.networkState.attr("data-content", partiallyConnectedString)
                 break
             case "disconnected":
                 var disconnectedString =
                     `<span class='alert-danger'>Disconnected</span>:
                     you are currently editing <span class='alert-info'>on
                    your own</span>.`
                 this.networkState.css("color", this.red)
                 this.networkState.attr("data-content", disconnectedString)
                 break
         }
     }
 }