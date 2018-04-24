var express = require('express');
var app = express();
const fork = require('child_process').fork;
var path = require('path')
var psTree = require('ps-tree');
var fs = require('fs');

var kill = function(pid, signal, callback) {
    signal = signal || 'SIGKILL';
    callback = callback || function() {};
    var killTree = true;
    if (killTree) {
        psTree(pid, function(err, children) {
            [pid].concat(
                children.map(function(p) {
                    return p.PID;
                })
            ).forEach(function(tpid) {
                try {
                    process.kill(tpid, signal)
                } catch (ex) {}
            });
            callback();
        });
    } else {
        try {
            process.kill(pid, signal)
        } catch (ex) {}
        callback();
    }
};



var documents = {};

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
app.get('/', function(req, res) {
    res.send('Hello World');
})


app.get('/:action/:session', function(req, res) {

            switch (req.params.action) {
                case "join":
                    if (!documents[req.params.session]) {

                        var pid = newDocument(req.params.session, res);
                        documents[req.params.session] = pid;
                        res.send('{"results":1}');
                        console.log("Create new document with SessionID " + req.params.session + " PID: " + documents[req.params.session]);


                    }
                    break;
                case "kill":
                    if (documents[req.params.session]) {
                        kill(documents[req.params.session]);
                        console.log("Delete the document with SessionID " + req.params.session + " PID: " + documents[req.params.session]);
                        delete documents[req.params.session];

                    }
                case "exist":
                    console.log("Exist ? " + req.params.session);
                    if (documents[req.params.session]) {
                        res.send('{"results":1}');
                        console.log('			{"results":1}');

                    } else {
                        var file = `./tmp/crate-${req.params.session}.json`

                        if (fs.existsSync(file)) { // sleeping mode
                            res.send('{"results":2}');
                            console.log('			{"results":2}');
                        } else {
                             res.send('{"results":0}');
                            console.log('           {"results":0}');
                        }
                    }
                        break;
                        default:


                    }



            });

        var server = app.listen(8082, function() {
            var host = server.address().address
            var port = server.address().port

            console.log("Example app 2 listening at http://%s:%s", host, port)
        })


        function newDocument(sessionID, res) {
            var exec = require('child_process').exec;
            const program = path.resolve('index.js')
            const parameters = [sessionID];
            /* const options = { stdio: [ 'pipe', 'pipe', 'pipe', 'ipc' ],
    silent: true }
*/
            const options = {
            }

            const child = fork(program, parameters, options);
            console.log('New document: ');

            process.on('message', (message) => {
                console.log('message from parent:', message);
            });

            child.on('message', (message) => {
                if (message.type == "kill") {
                    if (message.id) {
                        kill(message.id);
                        console.log("Delete the document with SessionID " + message.id + " PID: " + documents[message.id]);
                        delete documents[message.id];
                    }

                }
            });

            child.on('error', (error) => {
                console.log("this is error")
            });


            return child.pid;
        }