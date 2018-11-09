import { ImageDrop } from 'quill-image-drop-module'
//import { ImageResize } from 'quill-image-resize-module'
import { GUID } from '../helpers/randomID'

export class QuillManager {
  constructor(editorContainerID, comments, editor) {
    this._editorContainerID = editorContainerID
    this._comments = comments
    this._editor = editor
  }

  registerModules() {
    Quill.register('modules/cursors', QuillCursors)
    Quill.register('modules/comment', QuillComment)
    Quill.register('modules/imageDrop', ImageDrop)
    //Quill.register('modules/imageResize', ImageResize);
  }

  getQuill() {
    this.registerModules()
    const quill = new Quill(`#${this._editorContainerID} #editor`, {
      modules: {
        formula: true,
        toolbar: {
          container: this.getToolbarOptions(),
          handlers: {
            subdocument: function(value) {
              let range = this.quill.getSelection()
              // let preview = this.quill.getText(range);
              let preview = window.location.href.split('?')[0] + '?' + GUID()
              let tooltip = this.quill.theme.tooltip
              tooltip.edit('link', preview)
            },
            undo: function(value) {
              this.quill.history.undo()
            },
            redo: function(value) {
              this.quill.history.redo()
            }
          }
        },
        cursors: this.getCursorModuleOptions(),
        history: this.getHistoryModuleOptions(),
        comment: this.getCommentsModuleOptions(),
        imageDrop: true
      },

      theme: 'snow'
    })
    /** ImageResize: {
          modules: [ 'Resize', 'DisplaySize', 'Toolbar' ],
          handleStyles: {
            backgroundColor: 'black',
            border: 'none',
            color: white
            // other camelCase styles for size display
        } */

    this.addExtraToolbarOptions()

    // hook changing the editor when click on save link ==> open in the document
    quill.theme.tooltip.save2 = quill.theme.tooltip.save
    const self = this
    quill.theme.tooltip.save = function() {
      quill.theme.tooltip.save2()
      self._editor.convertLocalLinks()
    }

    return quill
  }
  getToolbarOptions() {
    const toolbarOptions = [
      [
        {
          header: [1, 2, 3, 4, 5, 6, false]
        }
      ],
      [
        {
          font: []
        }
      ],
      ['bold', 'italic', 'underline', 'strike'], // toggled buttons
      // custom button values
      [
        {
          align: []
        }
      ],
      [
        {
          list: 'ordered'
        },
        {
          list: 'bullet'
        }
      ],
      //  [{ 'script': 'sub'}, { 'script': 'super' }],      // superscript/subscript
      // [{ 'indent': '-1'}, { 'indent': '+1' }],          // outdent/indent
      /* [{
               'direction': 'rtl'
             }], // text direction
      
             [{
               'size': ['small', false, 'large', 'huge']
             }], // custom dropdown*/

      [
        {
          color: []
        },
        {
          background: []
        }
      ], // dropdown with defaults from theme
      ['clean'], // remove formatting button
      /*['blockquote', 'code-block'],*/
      ['formula', 'image', 'link'],
      ['subdocument'],
      ['comments-toggle'], // comment color on/off
      ['comments-add'] // comment add
    ]

    return toolbarOptions
  }

  getCursorModuleOptions() {
    const opts = {
      autoRegisterListener: true, // default: true
      hideDelay: 500, // default: 3000
      hideSpeed: 0
      // default: 400
    }
    return opts
  }

  getHistoryModuleOptions() {
    const opt = {
      delay: 500,
      maxStack: 1000
    }

    return opt
  }

  getCommentsModuleOptions(comments, editorContainerID) {
    const opts = {
      enabled: true,
      commentAuthorId: 123,
      commentAddOn: 'Author Name', // any additional info needed
      color: 'yellow', // comment background color in the text
      commentAddClick: this._comments.commentAddClick, // get called when `ADD COMMENT` btn on options bar is clicked
      commentsClick: this._comments.commentsClick, // get called when you click `COMMENTS` btn on options bar for you to do additional things beside color on/off. Color on/off is already done before the callback is called.
      commentTimestamp: this._comments.getCurrentTimestamp,
      containerID: this._editorContainerID
    }
    return opts
  }
  addExtraToolbarOptions() {
    $('.ql-subdocument .ql-comments-toggle .ql-comments-add').attr(
      'data-toggle',
      'tooltip'
    )
    $('.ql-comments-toggle,.ql-comments-add').css({
      position: 'relative',
      top: '-5px'
    })

    $('.ql-subdocument').html('<strong>SUB</strong>')
    $('.ql-subdocument').attr('title', 'Add subdocument')

    $('.ql-comments-toggle').html('<i class="fa fa-comments"></i>')
    $('.ql-comments-toggle').attr('title', 'Show/hide comments')

    $('.ql-comments-add').html('<i class="fa fa-comment"></i>')
    $('.ql-comments-add').attr('title', 'Add comment')
  }
}
