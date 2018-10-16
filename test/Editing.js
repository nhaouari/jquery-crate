
var debug = require('debug')('CRATE:test:Editing')
export class  Editing {
    constructor (sim){
        this._sim = sim
    }
    
    async initSimulator(simulationOptions){
       this._sim = new simulation() 
       await this._sim.init(simulationOptions); 
       await this.timeout(5000);
    }

    async insertRandomChartsByRandomNodes(timeBetweenInsertions,stringSize) {
       debug(
          `Random insertion by random nodes : NBsessions= ${
           this._sim._sessions.length
          }| stringSize = ${stringSize} `
        );

        for (let i = 0; i < stringSize; i++) {
          const randomID = this.pickRandomNodeID();
          const char = this.insertRandomCharBy(randomID);
          await this._sim.wait(timeBetweenInsertions);
        }
    }

    async insertRemoveRandomChartsByRandomNodes(timeBetweenInsertions,stringSize) {
        debug(
           `Random insertion by random nodes : NBsessions= ${
            this._sim._sessions.length
           }| stringSize = ${stringSize} `
         );
     
         let string = "";
         for (let i = 0; i < stringSize; i++) {
           const randomID = this.pickRandomNodeID();
           const char = this.insertRandomCharBy(randomID);
           string += char
 
           const probabilityOfRemove=this.random()
 
           if (probabilityOfRemove<=0.5) {
             const removedIndex=this.deleteRandomIndex(randomID)
             string=string.slice(0, removedIndex) + string.slice(removedIndex+1);
           }
           await this._sim.wait(timeBetweenInsertions);
         }
     }
     
    pickRandomNodeID() {
        const chosenNode = Math.floor(this.random() * this._sim._sessions.length);
        debug(`Node ${chosenNode} is chosen`);
        return chosenNode;
    }

    random() {
        return this._sim.random()
    }

    
    insertRandomCharBy(sessionID,position=null) {
        let char = this.peekRandomChar()
        
        if(!position){
            position = this._sim.getDocument(sessionID).delta.ops.length
        }
        
        this.insert(char, position, sessionID)
        return char
    }

    peekRandomChar() {
        let possible =
           "ABCDEF GHIJKL MNOPQ RSTUV WXYZab cdefgh ijklmn opqrstu vwxyz012 3456789 ";
        let char = possible.charAt(Math.floor(this.random() * possible.length));
        return char;
    }

    deleteRandomIndex(sessionID){
        let indexToRemove=this.pickIndexToRemove(sessionID)
        this.delete(indexToRemove,sessionID)
        return indexToRemove
    }

    pickIndexToRemove(sessionID){
        let maxPosition= this.getDelta(sessionID).ops.length-1
        const randomIndex=Math.floor(Math.random() * maxPosition)
        return randomIndex
    }

    delete(index, sessionID) {
        this._sim.getDocument(sessionID)._communication.textManager._removeManager.remove(index)
        debug(`Session ${sessionID} delete ${index}`)
    }

    insert(char, position, sessionID) {
        const packet = {content:char,attributes:""}
        const insertionObj={packet,position}
        console.log(insertionObj)
        this._sim.getDocument(sessionID)._communication.textManager._insertManager.insert(insertionObj)
        debug(`Session ${sessionID} insert ${packet} at ${position}`)
    }

    areDocumentsTheSame(){
        const delta= this.getDelta(0)
        
        const deltas=  this._sim._sessions.map((session,index)=>{
            return this.getDelta(index)
        })
       
       console.log('Deltas',deltas)


       const causalitys=  this._sim._sessions.map((session,index)=>{
        return session._documents[0].causality
        })
    
       console.log('causalitys',causalitys)

       const areTheSame=this._sim._sessions.reduce((previous,session,index)=>{
        return previous&&(JSON.stringify(delta)===JSON.stringify(this.getDelta(index)))
    },true) 
       
        return areTheSame

    
    }
    
    getDelta(sessionID){
        return this._sim.getDocument(sessionID).delta
    }
}