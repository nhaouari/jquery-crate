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


async function checkServer  (server, timeout=2000){

  return new Promise(function(resolve, reject) {

      setTimeout(function() {
          if (promiseResolved) return;
          resolve(false);
          promiseResolved = true;
      }, timeout);

      var promiseResolved = false,
          myPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection //compatibility for firefox and chrome
          ,
          pc = new myPeerConnection({
              iceServers: [server]
          }),
          noop = function() {};
      pc.createDataChannel(""); //create a bogus data channel
      pc.createOffer(function(sdp) {
          if (sdp.sdp.indexOf('typ relay') > -1) { // sometimes sdp contains the ice candidates...
              promiseResolved = true;
              resolve(true);
          }
          pc.setLocalDescription(sdp, noop, noop);
      }, noop); // create offer and set local description
      pc.onicecandidate = function(ice) { //listen for candidate events
          if (promiseResolved || !ice || !ice.candidate || !ice.candidate.candidate || !(ice.candidate.candidate.indexOf('typ relay') > -1)) return;
          promiseResolved = true;
          resolve(true);
      };
  });
}

async function getICS (url) {
    const response = await fetch(url)
    if (response.status !== 200) {
        console.log('Error Code: ' +
          response.status);
          return   []
      } else {
        const jsonICEs=await response.json()
        window.jsonICEs=  jsonICEs
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
        assert.isAtLeast(numberOfWorkingServers,1)
        console.log(' The number of working servers is '+numberOfWorkingServers );

         })
    })
    
  