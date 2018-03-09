var animals = require('animals');
var hash = require('string-hash');
// if lifetime -1 we didn't add the avatar
var Marker=function (origin,lifeTime=-1,range,cursorsp,cursor,isItME=false){
    this.origin = origin;
    this.lifeTime = lifeTime;
    this.time = new Date().getTime();
    this.color = this.getColor(this.origin);
    this.colorRGB = 'rgb('+this.color+')';
    this.colorRGBLight = 'rgba('+this.color+', 0.5)';
    this.animal = animals.words[hash(this.origin)%animals.words.length];
    this.pseudoName = 'Anonymous ' +
    this.capitalize(animals.words[hash(this.origin)%animals.words.length]);
    
    this.avatarAdd= false;
if (lifeTime!=-1) {
    //this.cursors = cursorsp;

    

    window.crate_cursors = cursorsp;
    if(!isItME) {
       this.timer=setInterval(() => this.checkIfOutdated(),1000 );
    } 
     this.addAvatar();
    if (cursor) {
     addCursor(range);   
    }
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

     if (!$("#"+this.origin).length) {
      this.addAvatar();
     }
     
     jQuery("#"+this.origin).attr('data-toggle','tooltip');
     jQuery("#"+this.origin).attr('title', this.pseudoName);

  

     if (this.cursor == true && cursor==true) { // in the case of update, make sure that ping updates don't change the range
      Marker.cursors.moveCursor(this.origin, range);
      } else if (cursor==true) {
        this.cursor = cursor; 
        this.addCursor(range);  
      }

    };


Marker.prototype.checkIfOutdated=function checkIfOutdated () 
{
           
                  var timeNow =new Date().getTime(); 


                  var dff= (timeNow-this.time); 

                  // console.log("Timer is working for "+this.animal+" Time from last update: "+dff+ "/ lifeTime is "+this.lifeTime);
                  

                // if  cursor  is outdated 
                if ((timeNow-this.time) >= this.lifeTime) {
                      
                        // Remve cursor and avatar
                       if (this.cursor) 
                       {
                           Marker.cursors.removeCursor(this.origin);
                           this.cursor = false;
                       
                       } 
                        
                        this.removeAvatar(); 
                        clearInterval(this.timer);

                        //console.log("--> Stop Timer <-- ");
                        //console.dir(this.timer);
                } else {
                    jQuery("#"+this.origin+"").css('opacity',(1-((timeNow-this.time)/this.lifeTime)));

                        } 
              
}


Marker.prototype.addAvatar=function addAvatar(divID="#users") {
       jQuery(divID). append(this.getAvatar());
       jQuery("#"+this.origin+"").attr('data-toggle','tooltip');
       jQuery("#"+this.origin+"").attr('title', this.pseudoName);

       this.avatarAdd = true;
    };

Marker.prototype.getAvatar=function getAvatar() {
       return '<div id="'+this.origin+'"style="background-color:'+this.colorRGB+';"><img class="imageuser" src="./icons/'+this.animal+'.png" alt="'+this.pseudoName+'"></div>';
    };

Marker.prototype.removeAvatar=function removeAvatar() {
       jQuery("#"+this.origin+"").remove();
       this.avatarAdd = false;
        };
Marker.prototype.setPseudo=function setPseudo(Pseudo) {
       this.pseudoName = Pseudo;
       jQuery("#"+this.origin+"").attr('title', this.pseudoName);
    };

Marker.prototype.addCursor=function addCursor(range) {
    this.cursor = true;
    Marker.cursors.setCursor(this.origin, range,this.pseudoName, this.colorRGB);
        };



module.exports = Marker;
