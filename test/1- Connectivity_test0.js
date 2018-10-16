/**
 * Test connectivity 
 * After Joining the network 
 * After Shuffling  
 */


import  * as utils from "./utils"
var debug = require('debug')('CRATE:test:spray_test')
process.on("unhandledRejection", error => {
    // Prints "unhandledRejection woops!"
   debug("unhandledRejection ",error);
  });
  
process.on("uncaughtException", error => {
    // Prints "unhandledRejection woops!"
    debug("uncaughtException",error)
  
  });
  


var chai = require('chai');
var expect = chai.expect;
var assert = chai.assert;
const addContext = require('mochawesome/addContext');



describe('Connectivity ', function () {
    const testingValues=[[3,3,5000],[5,3,5000]]
    const prototype={nbSessions:0,nbTimes:0,timeOut:0}
    const tests=utils.Simulation.structureArray(testingValues,prototype)

  
    tests.forEach( (test)=>{
        it(`Test Join sessions ${test.nbSessions} (${test.nbTimes} times, timeout==${test.timeOut})`, async function () { 
            this.timeout(20000)
            debug(`Test Join sessions ${test.nbSessions} (${test.nbTimes} times, timeout==${test.timeOut})`)
            let NbofConnectedNetworks= 0

            for (let i = 0; i < test.nbTimes; i++) {  
                let sim = new utils.Simulation()
                debug(`{nbSessions:${test.nbSessions}}`)
                await sim.init({nbSessions:test.nbSessions})
                await utils.wait(test.timeOut)
                const isConnected = sim.isGraphConnected()
                
                sim.clear()
                if(isConnected){
                    NbofConnectedNetworks++
                }
            }

            addContext(this,`Connected Graphs ${NbofConnectedNetworks}/${test.nbTimes}` );
            debug(`Connected Graphs ${NbofConnectedNetworks}/${test.nbTimes}`)
            assert.isTrue(NbofConnectedNetworks===test.nbTimes)
        })
    })
    

})
