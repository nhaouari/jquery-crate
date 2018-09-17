import {MarkerManager} from "./MarkerManager/MarkerManager"

import {TextManager} from "./TextManager/TextManager"

export class Communication {
    constructor(opts) {
        this._document = opts.document
        this._options=opts
    }

    init(opts={}){
        this._options= Object.assign(this._options,opts)
        this.markerManager = new MarkerManager(this._options)
        this.textManager= new TextManager(this._options) 
    }

    close() {
        this.markerManager.close()
        this.textManager.close()
    }

}