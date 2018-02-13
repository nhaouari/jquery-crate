
function Editor(container, id){
    this.div = jQuery('<div>').appendTo(container)
        .attr('id','crate-'+id)
        .css('min-height', '400px');



 var toolbarOptions = [
      ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
      ['blockquote', 'code-block'],
      ['formula','image','video'],

      [{ 'header': 1 }, { 'header': 2 }],               // custom button values
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'script': 'sub'}, { 'script': 'super' }],      // superscript/subscript
      [{ 'indent': '-1'}, { 'indent': '+1' }],          // outdent/indent
      [{ 'direction': 'rtl' }],                         // text direction

      [{ 'size': ['small', false, 'large', 'huge'] }],  // custom dropdown
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],

      [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
      [{ 'font': [] }],
      [{ 'align': [] }],

      ['clean']                                         // remove formatting button
    ];

  Quill.register('modules/cursors', QuillCursors);
    var quill = new Quill('#crate-'+id, {
     modules: {
        formula: true,
        toolbar: toolbarOptions,
        cursors: true,
        history: {
             delay: 2000,
             maxStack: 500
         }
        },
     theme: 'snow'
        });


    this.editor = quill;
    this.editor.setText(""); // ToDO check it again reproduce bu comment


    window.quill = quill;

};

module.exports = Editor;
