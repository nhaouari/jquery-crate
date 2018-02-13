var animals = require('animals');
var hash = require('string-hash');

function Marker(origin){
    this.origin = origin;
    this.color = getColor(this.origin);
    this.colorRGB = 'rgb('+this.color+')';
    this.colorRGBLight = 'rgba('+this.color+', 0.5)';
    this.pseudoName = 'Anonymous ' +
    capitalize(animals.words[hash(this.origin)%animals.words.length]);
};


function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

function getColor(str){
    var h1 = hash(str)%206;
    var h2 = (h1*7)%206;
    var h3 = (h1*11)%206;
    return Math.floor(h1+50)+ ", "+Math.floor(h2+50)+ ", "+Math.floor(h3+50);
}

module.exports = Marker;
