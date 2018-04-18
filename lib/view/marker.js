const animals = require('animals');
const hash = require('string-hash');



/**
 * Marker is class for managing the marker of one user,it includes the caret, avatar, and pseudo Names.
 */

class Marker {
  /**
   * Marker Module manages the Carets, avatars, pseudo names for the different users of the document
   * @param {[string]}  origin the id of the the user
   * @param {Number}  lifeTime After this time, if no ping or Caret position is received => 
   * remove caret and avatar. if lifetime is -1 we didn't add the avatar
   * @param {[{index: index,length: 0}]}  range  range stars from index with the specified length
   * @param {[cursor module]}  cursorsp the used cursor module for quilljs
   * @param {[Boolean]}  cursor  create the caret or not. If it is from ping, it will be false else true
   * @param {Boolean} isItME  is it my caret ? true or false to disable the time if it is true
   */
  constructor(origin, lifeTime = -1, range, cursorsp, cursor, isItME = false, editorContainerID) {

    /**
     *  origin the id of the the user
     * @type {[type]}
     */
    this.origin = origin;

    /**
     * lifeTime After this time, if no ping or Caret position is received => 
     * remove caret and avatar. if lifetime is -1 we don't add the avatar
     * @type {[type]}
     */
    this.lifeTime = lifeTime;

    /**
     * used to store last update time to detected outdated users
     * @type {Date}
     */
    this.time = new Date().getTime();

    /**
     * color r,g,b
     * @type {String}
     */
    this.color = this.getColor(this.origin);

    /**
     * color rgb(r,g,b)
     * @type {String}
     */
    this.colorRGB = 'rgb(' + this.color + ')';

    /**
     *  color rgba(r,g,b,0.5)
     * @type {String}
     */
    this.colorRGBLight = 'rgba(' + this.color + ', 0.5)';

    /**
     * auto generated pseudo name (from animals list)
     * @type {[type]}
     */
    this.animal = animals.words[hash(this.origin) % animals.words.length];

    /**
     * Anonymous + auto generated pseudo name
     * @type {String}
     */
    this.pseudoName = 'Anonymous ' +
      this.capitalize(animals.words[hash(this.origin) % animals.words.length]);

    /**
     * add or not the avatar 
     * @type {Boolean}
     */
    this.avatarAdd = false;

    /**
     * true for an editor, false if it is from a ping
     * @type {[type]}
     */
    this.cursor = cursor;



    /**
     * _avatar this is avatar selector 
     * @type {Object}
     */
    this._avatar = {}

    this._editorContainerID = editorContainerID

    if (lifeTime != -1) { // -1 => created without timer avatar cursor 
      if (!isItME) {
        /**
         * a timer that is used to check if the user is Outdated
         * @return {[type]}   [description]
         */
        this.timer = setInterval(() => this.checkIfOutdated(), 1000);
      } else {
        console.log('it is me')
        this.addAvatar()
      }


      if (cursor) {
        this.addCursor(range);
      }



    }
  };

  /**
   * capitalize uppercase the first letter
   * @param  {[string]} s [string]
   * @return {[string]}   [String the first letter is in uppercase]
   */
  capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  };


  /**
   * getColor for a specific id, get a unique color
   * @param  {[string]} str [the id of the user]
   * @return {[(r,g,b))]}     [the corresponding rgb color]
   */
  getColor(str) {
    var h1 = hash(str) % 206;
    var h2 = (h1 * 7) % 206;
    var h3 = (h1 * 11) % 206;
    return Math.floor(h1 + 50) + ", " + Math.floor(h2 + 50) + ", " + Math.floor(h3 + 50);
  };

  /**
   * update the time to keep the avatar and cursor if it exist
   * @param  {[{index: index,length: 0}]} range  [description]
   * @param  {[boolean]} cursor [if it is true add update the caret position]
   */
  update(range, cursor) {
    this.time = new Date().getTime();

    if (!$(`#${this._editorContainerID} #${this.origin}`).length) {
      this.addAvatar();
    }

    this._avatar.attr('data-toggle', 'tooltip');
    this._avatar.attr('title', this.pseudoName);

    if (this.cursor == true && cursor == true) { // in the case of update, make sure that ping updates don't change the range
      Marker.cursors.moveCursor(this.origin, range);
    } else if (cursor == true) {
      this.cursor = cursor;
      this.addCursor(range);
    }
  };

  /**
   * checkIfOutdated check if the user is outdated and if it is the case remove its caret and avatar 
   */
  checkIfOutdated() {

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
      // jQuery("#" + this.origin + "").css('opacity', (1 - ((timeNow - this.time) / this.lifeTime)));

    }

  }

  /*
   * addAvatar addAvatar of the user to the editor with corresponding divID
   * @param {String} divID [the id of the div where the avatars are placed]
   */
  addAvatar(divID = "#users") {
    jQuery(`#${this._editorContainerID} ${divID}`).append(this.getAvatar());
    this._avatar = jQuery(`#${this._editorContainerID} #${this.origin}`)
    this._avatar.attr('data-toggle', 'tooltip')
    this._avatar.attr('title', this.pseudoName)
    this.avatarAdd = true;
  };

  /**
   * getAvatar return the div that contains this user id
   * @return {[type]} [description]
   */
  getAvatar() {
    return '<div id="' + this.origin + '"style="background-color:' + this.colorRGB + ';"><img class="imageuser" src="./icons/' + this.animal + '.png" alt="' + this.pseudoName + '"></div>';
  };

  /**
   * removeAvatar remove the avatar of the user from the interface
   * @return {[type]} [description]
   */
  removeAvatar() {
    this._avatar.remove();
    this.avatarAdd = false;
  };

  /**
   * setPseudo set pseudo  for the user
   * @param {[type]} Pseudo [description]
   */

  setPseudo(Pseudo) {
    this.pseudoName = Pseudo;
    if ($(`#${this._editorContainerID} #${this.origin}`).length) {
      this._avatar.attr('title', this.pseudoName);
    }



  };

  /**
   * addCursor add the cursor to the editor
   * @param {[{index: index,length: 0}]} range [description]
   */
  addCursor(range) {
    this.cursor = true;
    Marker.cursors.setCursor(this.origin, range, this.pseudoName, this.colorRGB);
  };

}

module.exports = Marker;