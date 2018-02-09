
function Editor(container, id){
    this.div = jQuery('<div>').appendTo(container)
        .attr('id','crate-'+id)
        .css('min-height', '400px');
   
// To remove
    this.editor = ace.edit('crate-'+id);

    this.editor.$blockScrolling = Infinity;
    this.editor.setTheme("ace/theme/chrome");
    this.editor.getSession().setUseWrapMode(true); // word wrapping
    this.editor.setHighlightActiveLine(false); // not highlighting current line
    this.editor.setShowPrintMargin(false); // no 80 column margin
    this.editor.renderer.setShowGutter(false); // no line numbers
//----

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
    var quill = new Quill('#crate-'+id, {
     modules: {
        toolbar: toolbarOptions
        },
     theme: 'snow'
        });


    this.editor2 = quill;
    this.editor2.setText(""); // ToDO check it again reproduce bu comment


    window.quill = quill;

};

module.exports = Editor;
