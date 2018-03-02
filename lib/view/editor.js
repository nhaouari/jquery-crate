
function Editor(id,sessionID){
jQuery("#editor").attr('id','crate-'+id);
this.editor = quill;

this.editor.setText('');
    if (store.get("CRATE2-"+sessionID)) {
           var doc = store.get("CRATE2-"+sessionID);
           window.doc= doc;
           this.editor.setContents(doc.delta,"user");
           jQuery("#title").text(doc.title);
        }



jQuery('#title').click(function(){
   jQuery('#title').attr('contenteditable','true');
})


jQuery('#title').keypress(function(e){
    if(e.which == 13){
        quill.focus();    
    }
});




};

module.exports = Editor;
