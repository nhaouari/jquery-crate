
import animals from "animals";
import hash from "string-hash";


/**
 * Marker is class for managing the marker of one user,it includes the caret, avatar, and pseudo Names.
 */

export class Marker {
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

  constructor(origin, options, editor) {

    //lifeTime = -1, range, cursorsp, cursor, isItME = false, editor) {



    if (options == null) {
      var options = {
        lifeTime: -1,
        range: {},
        cursor: false,
        isItME: false
      }
    }
    /**
     *  origin the id of the the user
     * @type {[type]}
     */


    this.options = options
    this.origin = origin;

    /**
     * lifeTime After this time, if no ping or Caret position is received => 
     * remove caret and avatar. if lifetime is -1 we don't add the avatar
     * @type {[type]}
     */
    this.lifeTime = options.lifeTime;

    /**
     * used to store last update time to detected outdated users
     * @type {Date}
     */
    this.time = new Date().getTime();

    /**
     * color rgb(r,g,b)
     * @type {String}
     */
    this.colorRGB = this.constructor.getColor(this.origin, 'rgb')

    /**
     *  color rgba(r,g,b,0.5)
     * @type {String}
     */
    this.colorRGBLight = this.constructor.getColor(this.origin, 'rgba')


    /**
     * auto generated pseudo name (from animals list)
     * @type {[type]}
     */
    this.animal = this.constructor.getPseudoname(this.origin, null)

    /**
     * Anonymous + auto generated pseudo name
     * @type {String}
     */
    this.pseudoName = this.constructor.getPseudoname(this.origin)

    /**
     * add or not the avatar 
     * @type {Boolean}
     */
    this.avatarAdd = false;

    /**
     * true for an editor, false if it is from a ping
     * @type {[type]}
     */
    this.cursor = options.cursor;

    this._editor = editor
    if (editor) {
      this._editorContainerID = editor._editorContainerID
    }

    if (this.lifeTime != -1) { // -1 => created without timer avatar cursor 
      if (options.isItME) {
        this.addAvatar()
      } else if (this.cursor) {
        this.addCursor(options.range);
      }
    }
  };


  /**
   * capitalize uppercase the first letter
   * @param  {[string]} s [string]
   * @return {[string]}   [String the first letter is in uppercase]
   */
  static capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  };


  /**
   * getColor for a specific id, get a unique color
   * @param  {[string]} str [the id of the user]
   * @return {[(r,g,b))]}     [the corresponding rgb color]
   */
  static getColor(str, format = 'rgb') {
    var h1 = hash(str) % 206;
    var h2 = (h1 * 7) % 206;
    var h3 = (h1 * 11) % 206;
    let color = Math.floor(h1 + 50) + ", " + Math.floor(h2 + 50) + ", " + Math.floor(h3 + 50)
    if (format === 'rgb') {
      return 'rgb(' + color + ')';
    }

    if (format === 'rgba') {
      return 'rgba(' + color + ')';
    }

    return color
  }


  static getPseudoname(id, format = 'Anonymous') {

    if (format === 'Anonymous') { 
      return 'Anonymous ' +
        this.capitalize(animals.words[hash(id) % animals.words.length]);
    }
    return animals.words[hash(id) % animals.words.length];
  }
  /**
   * update the time to keep the avatar and cursor if it exist
   * @param  {[{index: index,length: 0}]} range  [description]
   * @param  {[boolean]} cursor [if it is true add update the caret position]
   */
  update(range, cursor) {
    this.time = new Date().getTime();
    let editor =  $(`#${this._editorContainerID}`)
    let avatar = $(`#${this._editorContainerID} #${this.origin}`)
    
    if (!avatar.length && editor.length) {
      this.addAvatar();
    }

    if (this.avatarAdd) {
      avatar.attr('data-toggle', 'tooltip');
      avatar.attr('title', this.pseudoName);
    }
    if (this.cursor == true && cursor == true) { // in the case of update, make sure that ping updates don't change the range

      this._editor.viewEditor.getModule('cursors').moveCursor(this.origin, range);

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
        this._editor.viewEditor.getModule('cursors').removeCursor(this.origin);
        this.cursor = false;
      }
      this.removeAvatar();
      return true
    } else {
     // jQuery(`#${this._editorContainerID} #${this.origin}`).css('opacity', (1 - ((timeNow - this.time) / this.lifeTime)));
      return false
    }

  }



  /*
   * addAvatar addAvatar of the user to the editor with corresponding divID
   * @param {String} divID [the id of the div where the avatars are placed]
   */
  addAvatar(divID = "#users") {
    jQuery(`#${this._editorContainerID} ${divID}`).append(this.getAvatar());
    let avatar = $(`#${this._editorContainerID} #${this.origin}`)
    avatar.attr('data-toggle', 'tooltip')
    avatar.attr('title', this.pseudoName)
    this.avatarAdd = true;
    
    if (!this.options.isItME) {
      /**
       * a timer that is used to check if the user is Outdated
       * @return {[type]}   [description]
       */

      this.timer = setInterval(() => this.checkIfOutdated(), 1000);
    }

  };

  /**
   * getAvatar return the div that contains this user id
   * @return {[type]} [description]
   */
  getAvatar() {
    return '<div id="' + this.origin + '"style="background-color:' + this.colorRGB + ';"><img class="imageuser" src="./icons/' + this.animal + '.png" alt="' + this.pseudoName + '"></div>';
  };


   /**
   * getAvatar return the div that contains this user id
   * @return {[type]} [description]
   */
 static getAvatar(id) {
    return '<div id="' + id + '"style="background-color:' + this.getColor(id, 'rgb') + ';"><img class="imageuser" src="./icons/' + this.getPseudoname(id, null) + '.png" alt="' + this.getPseudoname(id) + '"></div>';
  };

  /**
   * removeAvatar remove the avatar of the user from the interface
   * @return {[type]} [description]
   */
  removeAvatar() {

    let avatar = $(`#${this._editorContainerID} #${this.origin}`)
    avatar.remove()
    this.avatarAdd = false;
    clearInterval(this.timer);
  };

  /**
   * setPseudo set pseudo  for the user
   * @param {[type]} Pseudo [description]
   */

  setPseudo(Pseudo) {
    this.pseudoName = Pseudo
    let avatar = $(`#${this._editorContainerID} #${this.origin}`)
    if (avatar.length) {
      avatar.attr('title', this.pseudoName);
    }
  };

  /**
   * addCursor add the cursor to the editor
   * @param {[{index: index,length: 0}]} range [description]
   */
  addCursor(range) {
    this.cursor = true;
    this._editor.viewEditor.getModule('cursors').setCursor(this.origin, range, this.pseudoName, this.colorRGB);
  };

}

