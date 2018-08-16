import fetch from 'node-fetch';
import wrtc from 'wrtc';



async function test(ICEs) {    
    let workingICEs = 0

    for (let server of ICEs) {    
          await checkServer(server).then((result) => {
              if (result) {          
                  workingICEs++
              }                       
          })
    }
   
   return workingICEs

}


async function checkServer  (server,timeout = 2000){

  return new Promise(function(resolve, reject) {


    var promiseResolved = false;

    var RTCPeerConnection = wrtc.RTCPeerConnection;
    var RTCSessionDescription = wrtc.RTCSessionDescription;
    

    server.urls=[server.url]
    let opts = {
        iceServers: [server]
      }

    let pc = new RTCPeerConnection(opts);

    console.log(opts)
    pc.onicecandidate = function (candidate) {
        if (candidate.candidate) {
            if(candidate.candidate.candidate.indexOf('typ relay') > -1) { // sometimes sdp contains the ice candidates...
                promiseResolved = true;
                resolve(true);
            }
        }
    };

    setTimeout(() => {
        if (promiseResolved) return;
        resolve(false);
        promiseResolved = true;
    }, timeout);
    
    /*pc.onicegatheringstatechange = function() {
      console.log('state == ',pc.iceGatheringState)
        if (pc.iceGatheringState === 'complete') {
          resolve(false)
          promiseResolved = true
        }
      };
*/
     pc.createDataChannel('test');

      pc.createOffer().then(function(e) {
        pc.setLocalDescription(new RTCSessionDescription(e));
      });

    });   


    /*
      setTimeout(function() {
          if (promiseResolved) return;
          resolve(false);
          promiseResolved = true;
      }, timeout);


         let  pc = new wrtc.RTCPeerConnection({
              iceServers: [server]
          }),
         
         
          noop = function() {};

     const  dc = pc.createDataChannel('foo',{ negotiated: true, id: 0 });

            // create offer and set local description
      pc.onicecandidate = function(ice) { //listen for candidate events
                if (promiseResolved || !ice || !ice.candidate || !ice.candidate.candidate || !(ice.candidate.candidate.indexOf('typ relay') > -1)) return;
                promiseResolved = true;
                resolve(true);
            };

      pc.createOffer().then((sdp)=> {
          if (sdp.sdp.indexOf('typ relay') > -1) { // sometimes sdp contains the ice candidates...
              promiseResolved = true;
              resolve(true);
          }
          pc.setLocalDescription(sdp, noop, noop);
      });

  });*/
}

async function getICS (url) {
    const response = await fetch(url)
    if (response.status !== 200) {
        console.log('Error Code: ' +
          response.status);
          return   []
      } else {
        const jsonICEs=await response.json()
        const ICEs = jsonICEs.ice
        return ICEs
}

}


var chai = require('chai');
var expect = chai.expect;
var assert= chai.assert;

    describe('testing TURN STUN ', function () {  
        this.timeout(20000)
        
        it(`Get ICES`,async ()=> {
        const ICEsURL = "https://carteserver.herokuapp.com/ice"
        const ICEs  =await getICS(ICEsURL)
        console.log('Number of ICEs ',ICEs.length)
        assert.isAtLeast(ICEs.length,1)  
         })
        
        it(`Check TURN STUN Servers`,async ()=> {
        const ICEsURL = "https://carteserver.herokuapp.com/ice"
        const ICEs  =await getICS(ICEsURL)
        const numberOfWorkingServers= await test(ICEs)

        console.log()
        assert.isAtLeast(numberOfWorkingServers,1)
        console.log(' The number of working servers is '+numberOfWorkingServers );

         })
    })
    
  