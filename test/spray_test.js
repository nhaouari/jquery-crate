/**
 * Test if the graph is always connected in joining
 * 
 * 
 */


import  * as utils from "./utils";

process.on("unhandledRejection", error => {
    // Prints "unhandledRejection woops!"
    console.log("unhandledRejection ");
  });
  
  process.on("uncaughtException", error => {
    // Prints "unhandledRejection woops!"
    console.log("uncaughtException");
  
  });
  


describe('testing Spray ', function () {
    this.timeout(100000)
    it(`Test Join sessions 3 (10 times)`, async () => {
        const TestJoin = await testJoin({nbSessions: 3}, 10)
        assert.isTrue(TestJoin)
    })

})



async function testJoin(simulationOptions, maxJoinNumber = 10, timeout = 5000) {
    console.log(`Test Joining - connectivity: NBsessions= ${simulationOptions.nbSessions}| Join tries= ${maxJoinNumber} `);
    let tests = {
        success: 0,
        failed: 0,
        all: 0
    };

    const test = async () => {
        return new Promise(async (resolve, reject) => {
            console.log('testing ');
            for (let i = 0; i < maxJoinNumber; i++) {

                tests.all++
                    let result = await testOneJoin({...simulationOptions},timeout)
                if (result) {
                    tests.success++
                } else {
                    tests.failed++
                }

            }
            resolve();
        })
    }


    let evaluate = () => {
        if (tests.success == tests.all) {
            console.log('TESTS OK')
            return true
        } else {
            console.log('TESTS !OK')
            return false
        }
    }


    await test()
    return evaluate()
}

async function testOneJoin(simulationOptions,timeout) {
    let sim = new utils.Simulation()
    await sim.init(simulationOptions)
    await utils.wait(timeout)
    const isConnected = sim.isGraphConnected()
    sim.clear()

    if (!isConnected) {
        console.log("Graph not fully connected");
        return false
        // clearInterval(this._timerTestShuffling)
    } else {
        return true
    }
}


var chai = require('chai');
var expect = chai.expect;
var assert = chai.assert;


