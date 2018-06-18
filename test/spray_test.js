import {simulation} from "./utils";
import {wrtc} from "wrtc";
import {tarjan} from "./tarjan"

async function testJoin(simulationOptions, maxJoinNumber = 10,timeout=5000) {
    console.log(`Test Joining - connectivity: NBsessions= ${simulationOptions.nbSessions}| Join tries= ${maxJoinNumber} `);
     let tests = { success: 0, failed: 0, all: 0 };

      const test = async () => {
       return new Promise(async (resolve, reject) => {

        for (let i = 0; i < maxJoinNumber; i++) {
             let sim = new simulation()
             await sim.init(simulationOptions)
             await timeout(timeout)
             tests.all++

              if (!isGraphConnected(sim)) {
                console.log("Graph not fully connected");
                tests.failed = tests.failed + 1;
                // clearInterval(this._timerTestShuffling)
              } else {
                console.log("Graph fully connected");
                tests.success = tests.success + 1;
              }

     
              console.log(
                `Success RATE ${tests.success / tests.all * 100}% in (${
                  tests.all
                }) Join.`,
                tests
              );
            
            
              }
              resolve();
       })}
    
 
       let evaluate = ()=> {
         if (tests.success == tests.all) {
         return true
         } else {
         return false 
         }
       }

     await test() 
     evaluate()
   }


  function isGraphConnected(sim) {
    const tarjan = new Tarjan();

    const allNeighbors = sim.getAllNeighbors()
    
    if (allNeighbors.length > 0 ) {
      return tarjan.test(allNeighbors, true);
    } else {
      console.warn("The number of neighbours equals to 0, the sessions are not connected")
      return false
    }
  }

  function  timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
   
var chai = require('chai');
var expect = chai.expect;
var assert= chai.assert;

// default options
let simulationOptions = {
    seed: 3,
    nbSessions: 5,
    maxRandomTime: 3 * 1000,
    nbRounds: 5,
    URL: 'http://127.0.0.1:8000/document.html?test',
    nbOfEdits: 5,
    preSimulationTime: 20 * 1000,
    useSignalingServer:true,
    crateOptions:{
        signalingServer: "https://carteserver.herokuapp.com",
        storageServer: "https://storagecrate.herokuapp.com",
        stun: "23.21.150.121",
        containerID: "content-default",
        display: false,
        wrtc   
    }
}

simulation.defaultOptions = simulationOptions


describe('testing Spray ', function () {  
        this.timeout(20000)
        
        it(`Test Join`,async ()=> {
           const TestJoin = await testJoin({nbSessions:3},10) 
           assert.isTrue(testJoin)
        })
        
    })
    
  


