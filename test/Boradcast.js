import { version } from "utf8";

class BroadcastTester{
    constructor(sim){
        this.sim=sim
    }
    /**
     * Check if no exceptions in all the vectors
     * @param {*} VersionVectors version vectors of all sessions
     */
    noExceptionInAllSessions(VersionVectors=null){
        if(!VersionVectors) {
            const VersionVectors=this.getClockVectors()
        }

        return VersionVectors.reduce((previous, current) => {
            return (previous&&(this.noExceptionInVV(current)))     
        },true);
    }


    /**
     * check if no exception for a given Version Vector 
     * @param {*} VV 
     */
    noExceptionInVV(VV){
      return  VV.vector.arr.reduce((previous, current) => {
            return previous&&(current.x.length===0)
        }, true);
    }

    /**
     *  Check if all the Version vectors are up to date
     * @param {*} versionVectors 
     */
    areAllVectorsUpToDate(versionVectors=null){
        if(!versionVectors){
            const versionVectors=this.getClockVectors()
        }
        versionVectors.forEach(VV => {
            const localEntry={id:VV.local.e,clock:VV.local.v}

               return  versionVectors.reduce((previousVV, currentVV) => {
                   return  previousVV&&this.isVectorUpToDate(currentVV,localEntry)
                }, true)
    
        })
    }
    
    /**
     * Is the vector up to date ,if it dose not exist it returns false 
     * @param {*} VV 
     * @param {*} entry 
     */
    isVectorUpToDate(VV,entry){ 
        const entryIndex=VV.vector.arr.indexOf(entry.id)

        let isUpToDATE=false
        if((entryIndex>=0&&VV.vector.arr[entryIndex].v===entry.clock&&VV.vector.arr[entryIndex].x.length===0)||(entry.clock===0)){
            isUpToDATE=true
        } 
        
        return isUpToDATE
    }

    /**
     * @return array of all the version vectors
     */
    getClockVectors(){       
        const vectors = this.sim._sessions.map(session=>session._documents[0].causality) 
        return vectors
    }


   
}