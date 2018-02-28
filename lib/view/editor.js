
function Editor(id,sessionID){
   
jQuery("#editor").attr('id','crate-'+id);
this.editor = quill;
this.sessionID=sessionID;

self = this;


this.editor.setText('');
if (store.get("CRATE2-"+sessionID)) {
	 var doc = store.get("CRATE2-"+sessionID);
	 window.doc= doc;
	 this.editor.setContents(doc.delta);
	 jQuery("#title").text(doc.title);
}
    // ToDO check it again reproduce bu comment
  
    window.quill = quill;

	

    jQuery("#saveicon").click(function(){
    		var timeNow =new Date().getTime(); 
			var title = jQuery("#title").text();
          	store.set("CRATE2-"+self.sessionID,{date:timeNow,title:title ,delta:self.editor.editor.delta});
        });

    console.log("THis is test");
};

module.exports = Editor;
