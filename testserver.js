const fork = require('child_process').fork;
var path = require('path')
const program = path.resolve('test.js');
const parameters = [];
const options = {

};

const child = fork(program, parameters, options);
child.on('message', message => {
  console.log('message from child:', message);
  child.send('Hi');
});