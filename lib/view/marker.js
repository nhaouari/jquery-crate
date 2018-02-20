var animals = require('animals');
var hash = require('string-hash');

var Marker=function (origin,lifeTime,range,cursorsp,cursor,isItME=false){
    this.origin = origin;
    this.lifeTime = lifeTime;
    this.time = new Date().getTime();
    this.color = this.getColor(this.origin);
    this.colorRGB = 'rgb('+this.color+')';
    this.colorRGBLight = 'rgba('+this.color+', 0.5)';
    this.animal = animals.words[hash(this.origin)%animals.words.length];
    this.pseudoName = 'Anonymous ' +
    this.capitalize(animals.words[hash(this.origin)%animals.words.length]);
    this.cursors = cursorsp;
    window.crate_cursors = cursorsp;
    if(!isItME) {
        this.startTimer();
    } 
     this.addAvatar();
    if (cursor) {
     addCursor(range);   
    }
    
    
    this.cursor = cursor; // true if editing, false if it is from ping
};

Marker.prototype.capitalize = function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
};



Marker.prototype.getColor = function getColor(str){
    var h1 = hash(str)%206;
    var h2 = (h1*7)%206;
    var h3 = (h1*11)%206;
    return Math.floor(h1+50)+ ", "+Math.floor(h2+50)+ ", "+Math.floor(h3+50);
};

Marker.prototype.update=function update(range,cursor){
      this.time = new Date().getTime();
   

     if (this.cursor == true && cursor==true) { // in the case of update, make sure that ping updates don't change the range
      this.cursors.moveCursor(this.origin, range);
      } else if (cursor==true) {
        this.cursor = cursor; 
        this.addCursor(range);  
      }

    };

Marker.prototype.startTimer=function () {
self = this;

this.timer=setInterval(    
  function () {
                var timeNow =new Date().getTime(); 
                // if  cursor  is outdated 
                if ((timeNow-self.time) >= self.lifeTime) {
                        // Remve cursor and avatar
                       if (self.cursor) 
                       {
                            self.cursors.removeCursor(self.origin);
                       } 
                        
                        self.removeAvatar(); 
                        clearInterval(self.timer);
                } 
    },this.lifeTime );

}

Marker.prototype.addAvatar=function addAvatar() {
       jQuery("#users"). append('<div id="'+this.origin+'"style="background-color:'+this.colorRGB+';"><img class="imageuser" src="./icons/'+this.animal+'.png" alt="'+this.pseudoName+'"></div>');
    };

Marker.prototype.removeAvatar=function removeAvatar() {
       jQuery("#"+this.origin+"").remove();
        };

Marker.prototype.addCursor=function addCursor(range) {
    this.cursor = true;
    this.cursors.setCursor(this.origin, range,this.pseudoName, this.colorRGB);
        };



module.exports = Marker;
