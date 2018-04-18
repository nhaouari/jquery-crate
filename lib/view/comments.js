const Marker = require('../view/marker.js')
const dateformat = require('dateformat')

/**
 * This class is for managing the comments for quill
 */
class Comments {
	/**
	 * [constructor description]
	 * @param  {[type]} editorContainerID [description]
	 * @return {[type]}                   [description]
	 */

	constructor(editorContainerID) {
		// Selectors
		this._editorContainerID = editorContainerID
		this._viewEditor = {}
		this._inputCommentModel = $(`#${this._editorContainerID} #inputCommentModal`)
		this._comments = $(`#${this._editorContainerID} #comments`)
		this._ql_editor = $(`#${this._editorContainerID} .ql-editor`)
		this._editor = $(`#${this._editorContainerID} .editor`)
		this._commentInput = $(`#${this._editorContainerID} #commentInput`)
		this._currentTimestamp = {}
		this._commentCallback = {}
		this.commentAddClick = this.commentAddClick.bind(this)
		this.commentsClick = this.commentsClick.bind(this)
	}

	get viewEditor() {
		return this._viewEditor
	}

	set viewEditor(Editor) {
		this._viewEditor = Editor
	}

	commentAddClick(cb) {
		this._commentCallback = cb;
		this._inputCommentModel.modal('show');
	}

	commentServerTimestamp() {
		return new Promise((resolve, reject) => {
			this._currentTimestamp = Math.round((new Date()).getTime() / 1000); // call from server
			resolve(this._currentTimestamp);
		});
	}

	commentsClick() {
		if (this._comments.is(":visible")) {

			if (this._ql_editor.hasClass('ql-comments')) {
				this._ql_editor.removeClass('ql-comments');
			}

			this._comments.hide();
			this._comments.css('width', '0%');
			this._editor.css('width', '100%');

		} else {
			this._comments.addClass('comment');
			if (!this._editor.hasClass('ql-comments')) {
				this._editor.addClass('ql-comments');
			}

			this._comments.css('width', '30%');
			this._editor.css('width', '70%');
			this._comments.show();
		}
	}

	addCommentToList(comment, idAuthor, pseudo, name, color, currentTimestamp) {
		let utcSeconds = currentTimestamp;
		let d = new Date(); // The 0 there is the key, which sets the date to the epoch
		let date = dateFormat(d, "dddd, mmmm dS, yyyy, h:MM:ss TT");

		let id = 'ql-comment-' + idAuthor + '-' + utcSeconds;

		let cmtbox = $(
			`<div class='comment-box ${id}' onfocus="commentBoxFocus('${id}')" onfocusout="commentBoxFocus('${id}', 'out')" tabindex="1">
      <div class='comment-head'>
        <div id="${id}"style="background-color:${color};width: 40px;" ><img class="imageuser" src="./icons/${pseudo}.png" alt="${name}"></div>
    
        <div class='comment-details'>
          <div class='comment-author'>${name}</div>
          <div class='comment-date'>${date}</div>
        </div>
      </div>
      <div class='comment-body'>${comment}</div>
  
    </div>`
		);

		this._comments.append(cmtbox);
	}


	saveComment() {
		let comment = this._commentInput.val();
		this._commentCallback(comment);

		let name = this._viewEditor.options.modules.comment.commentAddOn;

		let id = this._viewEditor.options.modules.comment.commentAuthorId;

		let color = this._viewEditor.options.modules.comment.color;

		m = new Marker(id);
		console.log('addCommentToList called')
		this.addCommentToList(comment, id, name, store.get('myId').pseudo, color, this._currentTimestamp)
	}


	commentBoxFocus(id, type) {
		if (type !== 'out') {
			$('.ql-comments #' + id).addClass('commentFocus');
			this._comments.find('.' + id).css('border-color', 'red');

		} else {
			$('.ql-comments #' + id).removeClass('commentFocus');
			this._comments.find('. comment-box').css('border-color', '#F0F0F0');
		}

	}

}

module.exports = Comments