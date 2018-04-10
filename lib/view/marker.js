const animals = require('animals');
const hash = require('string-hash');



/**
 * [Marker Module manages the Carets, avatars, pseudonames for the different users of the document]
 * @param {[string]}  origin   [the id of the the user]
 * @param {Number}  lifeTime [After this time, if no ping or Caret position is received => remove caret and avatar. if lifetime is -1 we didn't add the avatar]
 * @param {[{index: index,length: 0}]}  range    [range stars from index with the specified length]
 * @param {[cursor module]}  cursorsp [the used cursor module for quilljs]
 * @param {[Boolean]}  cursor   [create the caret or not. If it is from ping, it will be false else true]
 * @param {Boolean} isItME   [is it my caret ? true or false to disable the time if it is true]
 */


var Marker = function(origin, lifeTime = -1, range, cursorsp, cursor, isItME = false) {
  this.origin = origin;
  this.lifeTime = lifeTime;
  this.time = new Date().getTime();
  this.color = this.getColor(this.origin);
  this.colorRGB = 'rgb(' + this.color + ')';
  this.colorRGBLight = 'rgba(' + this.color + ', 0.5)';
  this.animal = animals.words[hash(this.origin) % animals.words.length];
  this.pseudoName = 'Anonymous ' +
    this.capitalize(animals.words[hash(this.origin) % animals.words.length]);
  this.avatarAdd = false;
  this.cursor = cursor; // true if editing, false if it is from ping

  if (lifeTime != -1) { // -1 => created without timer avatar cursor 
    if (!isItME) {
      this.timer = setInterval(() => this.checkIfOutdated(), 1000);
    }
    this.addAvatar();
    if (cursor) {
      this.addCursor(range);
    }
  }
};

/**
 * [capitalize upercase the first letter]
 * @param  {[string]} s [string]
 * @return {[string]}   [String the first letter is in uppercase]
 */
Marker.prototype.capitalize = function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
};


/**
 * [getColor for a specific id, get a unique color]
 * @param  {[string]} str [the id of the user]
 * @return {[(r,g,b))]}     [the correspanding rgb color]
 */
Marker.prototype.getColor = function getColor(str) {
  var h1 = hash(str) % 206;
  var h2 = (h1 * 7) % 206;
  var h3 = (h1 * 11) % 206;
  return Math.floor(h1 + 50) + ", " + Math.floor(h2 + 50) + ", " + Math.floor(h3 + 50);
};

/**
 * [update the time to keep the avatar and cursor if it exist]
 * @param  {[{index: index,length: 0}]} range  [description]
 * @param  {[boolean]} cursor [if it is true add update the caret position]
 */
Marker.prototype.update = function update(range, cursor) {
  this.time = new Date().getTime();

  if (!$("#" + this.origin).length) {
    this.addAvatar();
  }

  jQuery("#" + this.origin).attr('data-toggle', 'tooltip');
  jQuery("#" + this.origin).attr('title', this.pseudoName);

  if (this.cursor == true && cursor == true) { // in the case of update, make sure that ping updates don't change the range
    Marker.cursors.moveCursor(this.origin, range);
  } else if (cursor == true) {
    this.cursor = cursor;
    this.addCursor(range);
  }
};

/**
 * [checkIfOutdated check if the user is outdated and if it is the case remove its caret and avatar ]
 */
Marker.prototype.checkIfOutdated = function checkIfOutdated() {

  var timeNow = new Date().getTime();
  var dff = (timeNow - this.time);
   // if  cursor  is outdated 
  if ((timeNow - this.time) >= this.lifeTime) {
    // Remve cursor and avatar
    if (this.cursor) {
      Marker.cursors.removeCursor(this.origin);
      this.cursor = false;
    }
    this.removeAvatar();
    clearInterval(this.timer); 
  } else {
    jQuery("#" + this.origin + "").css('opacity', (1 - ((timeNow - this.time) / this.lifeTime)));

  }

}

/**
 * [addAvatar addAvatar of the user to the editor with correpanding divID]
 * @param {String} divID [the id of the div where the avatars are placed]
 */
Marker.prototype.addAvatar = function addAvatar(divID = "#users") {
  jQuery(divID).append(this.getAvatar());
  jQuery("#" + this.origin + "").attr('data-toggle', 'tooltip');
  jQuery("#" + this.origin + "").attr('title', this.pseudoName);
  this.avatarAdd = true;
};

/**
 * [getAvatar return the div that contains this user id]
 * @return {[type]} [description]
 */
Marker.prototype.getAvatar = function getAvatar() {
  return '<div id="' + this.origin + '"style="background-color:' + this.colorRGB + ';"><img class="imageuser" src="./icons/' + this.animal + '.png" alt="' + this.pseudoName + '"></div>';
};

/**
 * [removeAvatar remove the avatar of the user from the interface]
 * @return {[type]} [description]
 */
Marker.prototype.removeAvatar = function removeAvatar() {
  jQuery("#" + this.origin + "").remove();
  this.avatarAdd = false;
};

/**
 * [setPseudo set pseudo  for the user ]
 * @param {[type]} Pseudo [description]
 */

Marker.prototype.setPseudo = function setPseudo(Pseudo) {
  this.pseudoName = Pseudo;
  jQuery("#" + this.origin + "").attr('title', this.pseudoName);
};

/**
 * [addCursor add the cursor to the editor]
 * @param {[{index: index,length: 0}]} range [description]
 */
Marker.prototype.addCursor = function addCursor(range) {
  this.cursor = true;
  Marker.cursors.setCursor(this.origin, range, this.pseudoName, this.colorRGB);
};



module.exports = Marker;