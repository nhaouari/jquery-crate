import dateformat from "dateformat"
/**
 * This class is for managing the comments for quill
 */
export class Comments {
	/**
	 * [constructor description]
	 * @param  {[type]} editorContainerID [description]
	 * @return {[type]}                   [description]
	 */

	constructor() {
		// Selectors
		this._commentCallback = {}
		this.commentAddClick = this.commentAddClick.bind(this)
		this.commentsClick = this.commentsClick.bind(this)
	}

	init(editor){
		this._editor = editor
		this._authorId = this._editor._document.uid
		this._editorContainerID = this._editor._editorContainerID
		this._viewEditor = this._editor.viewEditor
		this._markerManager=this._editor._MarkerViewManager

		this.setSelectors()
		return this
	}
	addAuthorInformation() {
		const commentOpt = this._viewEditor.options.modules.comment
		commentOpt.commentAuthorId = this._authorId
		commentOpt.commentAddOn = this._markerManager.getMarker(this._authorId).animal
		commentOpt.color = this._markerManager.getMarker(this._authorId).colorRGB
		return this
	}

	setSelectors() {
		this._inputCommentModel = $(`#${this._editorContainerID} #inputCommentModal`)
		this._comments = $(`#${this._editorContainerID} #comments`)
		this._ql_editor = $(`#${this._editorContainerID} .ql-editor`)
		this._editor = $(`#${this._editorContainerID} .editor`)
		this._commentInput = $(`#${this._editorContainerID} #commentInput`)
	}

	get viewEditor() {
		return this._viewEditor
	}

	set viewEditor(Editor) {
		this._viewEditor = Editor
	}

	commentAddClick(cb, self) {
		console.log('commentAddClick is clicked');
		this._commentCallback = cb.bind(self);
		this._inputCommentModel.modal('show');
	}

	getCurrentTimestamp() {
		return new Promise((resolve, reject) => {
			const currentTimestamp = Math.round((new Date()).getTime() / 1000); // call from server
			resolve(currentTimestamp);
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

	async addCommentToList({comment,currentTimestamp,authorId}) {

		const marker = this._markerManager.addMarker(authorId, false, {
			lifetime: -1
		})
		const date = dateFormat(new Date(), "dddd, mmmm dS, yyyy, h:MM:ss TT");

		const divId = 'ql-comment-' + authorId + '-' + currentTimestamp;

		const opts = {
			id: divId,
			date: date,
			pseudoName: marker.pseudoName,
			colorRGB: marker.colorRGB,
			comment: comment,
			iconURL: `./icons/${marker.animal}.png`
		}

		const cmtBox = this.getCommentBoxDiv(opts)
		this._comments.append(cmtBox);
		this.addFocusEffects(divId)

	}

	getCommentBoxDiv(opts) {

		const cmtbox = $(
			`<div class='comment-box ${opts.id} row' id='comment-box-${opts.id}' tabindex="1" title='${opts.date}'>
      <div class='comment-head row'>
        <div id="${opts.id}"style="background-color:${opts.colorRGB};width: 40px;" ><img class="imageuser" src="${opts.iconURL}" alt="${opts.pseudoName}"></div>
    
        <div class='comment-details'>
          <div class='comment-author'>${opts.pseudoName}</div>
        </div>
      </div>
      <div class='comment-body row' >${opts.comment}</div>
  
    </div>`
		);
		return cmtbox
	}

	addFocusEffects(divId) {
		console.log('#comment-box-' + divId);
		
		$('#comment-box-' + divId).focusin(() => {
			this.commentBoxFocus(divId,'in')

		})

		$('#comment-box-' + divId).focusout(() => {
			this.commentBoxFocus(divId, 'out')
		})
	}

	async saveComment() {
		let comment = this._commentInput.val();
		this._commentInput.val("")
		const currentTimestamp = await this.getCurrentTimestamp()
		await this.addCommentToList({comment,currentTimestamp,authorId:this._authorId})		
		this._commentCallback({comment,currentTimestamp});
	}

	commentBoxFocus(id, type) {
		console.log(type,'.ql-comments #' + id)
		if (type !== 'out') {
			$('.ql-comments #' + id).addClass('commentFocus')
			this._comments.find('.' + id).css('border-color', 'red')
		} else {
			$('.ql-comments #' + id).removeClass('commentFocus')
			this._comments.find('.comment-box').css('border-color', '#F0F0F0')
		}
	}

	/**
	 * UpdateComments This function to extract the comments form the editor and show them in #comments
	 */
	UpdateComments() {

		console.log("cmments updated");
		// clear comments 
		this.clearComments()
		// for each insert check att if it contains the author then insert comment 
		this.viewEditor.editor.delta.ops.forEach((op) => {
			if (op.insert && op.attributes && op.attributes.commentAuthor) {
				const authorId = op.attributes.commentAuthor
				const comment=op.attributes.comment
				const currentTimestamp=op.attributes.commentTimestamp
				this.addCommentToList({comment,currentTimestamp,authorId})
			}

		})

	}


	clearComments() {
		jQuery(`#${this._editorContainerID} #comments`).empty()
	}
}