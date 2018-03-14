
function Editor(id,sessionID){
jQuery("#editor").attr('id','crate-'+id);
this.editor = quill;


// Initilise the the editor content 
//this.editor.setText('');
    if (store.get("CRATE2-"+sessionID)) {
           var doc = store.get("CRATE2-"+sessionID);
           this.editor.setContents(doc.delta,"user");
           jQuery("#title").text(doc.title);
        }


// make title editable
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
