/**
 * Test connectivity 
 * After Joining the network 
 * After Shuffling  
 */

import  * as utils from "./utils"

import { Editing } from './Editing'

var debug = require('debug')('CRATE:test:spray_test')

/*process.on("unhandledRejection", error => {
    // Prints "unhandledRejection woops!"
  debug("unhandledRejection ",error);
  });
  
process.on("uncaughtException", error => {
    // Prints "unhandledRejection woops!"
  debug("uncaughtException",error)
  
  });*/
  


var chai = require('chai');
var expect = chai.expect;
var assert = chai.assert;
const addContext = require('mochawesome/addContext');

describe('Editing Test ', function () {
    this.timeout(20000)

    const testingValues=[[3,100,20,1],[8,100,20,1],[20,100,20,1]]
    const prototype={nbSessions:0,timeBetweenInsertions:0,stringSize:0,times:0}
    const tests=utils.Simulation.structureArray(testingValues,prototype)
   
    tests.forEach(async (test)=>{
       for (let i = 0; i < test.times; i++) {
        it(`Testing insertion Nbsessions ${test.nbSessions}, timeBetweenInsertions ${test.timeBetweenInsertions},stringSize ${test.stringSize}`, async function () {
            await utils.wait(2000)
            const areThereTheSame = await insertRandomChartsByRandomNodes(test)
            assert.isTrue(areThereTheSame)
        })

        it(`Testing insertion&&remove Nbsessions ${test.nbSessions}, timeBetweenInsertions ${test.timeBetweenInsertions},stringSize ${test.stringSize}`, async function () {
            await utils.wait(2000)
            const areThereTheSame = await insertRemoveRandomChartsByRandomNodes(test)
            assert.isTrue(areThereTheSame)
        })
    }
   })

   
    
})

async function insertRandomChartsByRandomNodes ({nbSessions,timeBetweenInsertions,stringSize}) {
    debug(`Testing editing Nbsessions ${nbSessions}, timeBetweenInsertions ${timeBetweenInsertions},stringSize ${stringSize}`)
    const sim = new utils.Simulation()
    await sim.init({nbSessions})
    await utils.wait(500)
    const editing=new Editing(sim)
    await editing.insertRandomChartsByRandomNodes(timeBetweenInsertions,stringSize)
    
    await utils.wait(500)
    sim.clear()

    const areTheSame= editing.areDocumentsTheSame()

    return areTheSame 
}

async function insertRemoveRandomChartsByRandomNodes ({nbSessions,timeBetweenInsertions,stringSize}) {
    debug(`Testing editing Nbsessions ${nbSessions}, timeBetweenInsertions ${timeBetweenInsertions},stringSize ${stringSize}`)
    const sim = new utils.Simulation()
    await sim.init({nbSessions})
    await utils.wait(500)
    const editing=new Editing(sim)
    await editing.insertRemoveRandomChartsByRandomNodes(timeBetweenInsertions,stringSize)
    
    await utils.wait(500)
    sim.clear()

    const areTheSame= editing.areDocumentsTheSame()

    return areTheSame 
}