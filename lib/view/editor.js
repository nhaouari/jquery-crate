
function Editor(id){
   
    jQuery("#editor").attr('id','crate-'+id);
    this.editor = quill;
    this.editor.setText(""); // ToDO check it again reproduce bu comment
    window.quill = quill;
    console.log("THis is test");
};

module.exports = Editor;
