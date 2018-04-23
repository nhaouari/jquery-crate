var express = require('express');
var app = express();


var psTree = require('ps-tree');

var kill = function (pid, signal, callback) {
    signal   = signal || 'SIGKILL';
    callback = callback || function () {};
    var killTree = true;
    if(killTree) {
        psTree(pid, function (err, children) {
            [pid].concat(
                children.map(function (p) {
                    return p.PID;
                })
            ).forEach(function (tpid) {
                try { process.kill(tpid, signal) }
                catch (ex) { }
            });
            callback();
        });
    } else {
        try { process.kill(pid, signal) }
        catch (ex) { }
        callback();
    }
};



var documents  ={};

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
app.get('/', function (req, res) {
   res.send('Hello World');
})


app.get('/:action/:session', function(req, res) {

switch(req.params.action) {
    case "join":
    if (!documents[req.params.session]) {
		
	var pid = newDocument(req.params.session,res);
	documents[req.params.session]=pid;
    res.send('{"results":1}');
	console.log("Create new document with SessionID "+req.params.session+" PID: "+documents[req.params.session]);
	 
    
    }
    break;
    case "kill":
     if (documents[req.params.session]) {
    kill(documents[req.params.session]);
    console.log("Delete the document with SessionID "+req.params.session+" PID: "+documents[req.params.session]);	
	delete documents[req.params.session];

	}
	case "exist":
		  console.log("Exist ? "+req.params.session);
		  if (documents[req.params.session]) {
		  res.send('{"results":1}');
		   console.log('			{"results":1}');

		  } else 
		  {
		  res.send('{"results":0}');
		    console.log('			{"results":0}');
		  }
    break;
    default:

       
}




});

var server = app.listen(8082, function () {
   var host = server.address().address
   var port = server.address().port
   
   console.log("Example app 2 listening at http://%s:%s", host, port)
})


 function newDocument (sessionID,res) {
  var exec = require('child_process').exec;
  console.log('New document: ');
  var newProc = exec("node index.js "+sessionID, function (error, stdout, stderr) {
    console.log("stdout: " + stdout);
    console.log("stderr: " + stderr);
    if (error)  {
    //	res.send('{"results":0}');
    	console.log('exec error: ' + error);


    } else {
    //	res.send('{"results":1}');

    }
  });
  return newProc.pid;
}