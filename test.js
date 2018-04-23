var request = require("request");

request({
    method: "get",
    url: "https://carteserver.herokuapp.com/ice"
}, function(error, response, body) {
   
    console.log("this is response"+JSON.stringify(response))
    addresses = JSON.parse(body);
    var connectionOptions = (addresses && addresses.d) || {
        iceServers: [{
            url: 'stun:23.21.150.121', // default google ones if xirsys not
            urls: 'stun:23.21.150.121'
        }]
    }; // responding
    initialize(connectionOptions, sesssionID);
});
