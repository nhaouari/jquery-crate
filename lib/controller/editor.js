var Marker = require('../view/marker.js');

window.Marker = Marker;
function EditorController(model, viewEditor,sessionID){
    var self = this;

    editor = viewEditor.editor;
    this.viewEditor = viewEditor;   
    this.fromRemote = false;
    this.model = model;
    var id= model.uid;
    

    Marker.cursors = editor.getModule('cursors');
    
    if(store.get("CRATE2-"+self.model.signalingOptions.session)) {
    this.markers= store.get("CRATE2-"+self.model.signalingOptions.session).markers ; 
    
  // convert the json objects to Marker object with functions 
   for (var property in this.markers) {
    if (this.markers.hasOwnProperty(property)) {
      this.markers[property]= Object.assign(new Marker(property),this.markers[property] );

    }
    }

   // this.markers[id] = Object.assign(new Marker(id),this.markers[id]);



} 
    else {
        this.markers= {};
}
    
    

window.markers = this.markers;


//if (!this.markers[id]) { 
//     console.log("Add myself");
    //this.markers.push(id);
    this.markers[id]= new Marker(id,5*1000,{index:0, length:0},editor.getModule('cursors'),false,true);
    
    if (store.get('myId')){
    this.markers[id].setPseudo(store.get('myId').pseudo);
    } else {
       store.set('myId',{id:id, pseudo:this.markers[id].pseudoName});
    }
//}


    UpdateComments(); 
    quill.options.modules.comment.commentAddOn=self.markers[id].animal;
    quill.options.modules.comment.commentAuthorId = id;
    quill.options.modules.comment.color = self.markers[id].colorRGB;



// saveButton


// To avoid the problem of Converting circular structure to JSON, we remove cursors property before saving


jQuery("#saveicon").click(function(){
      var timeNow =new Date().getTime(); 
      var title = jQuery("#title").text();
      var document = {date:timeNow,
                 title:title,
                 delta:self.viewEditor.editor.editor.delta,
                 sequence: self.model.sequence,
                 causality: self.model.causality,
                 name: self.model.name,
                 webRTCOptions: self.model.webRTCOptions,
                 markers: self.markers,
                 signalingOptions: self.model.signalingOptions};         
    

      store.set("CRATE2-"+self.model.signalingOptions.session,document);
      alert("Document is saved successfully");
      
           });



// copyButton 

 jQuery("#copyButton").click(function(){
           jQuery("#sessionUrl").select();
            document.execCommand("Copy");
      });


//


editor.on('selection-change', function(range, oldRange, source) {
  if (range){
    model.core.caretMoved(range);
    }
    });

editor.on('text-change', function(delta, oldDelta, source) {
        
        applyChanges(delta,0);

    
        //Send delta object with style charater by charcter starting from  the position "iniRetain"             
        function applyChanges (delta,iniRetain) {

        var changes = JSON.parse(JSON.stringify(delta, null, 2));

        var retain=iniRetain;
      
        if (editor.editor.delta.length()==3) {
          var retain=1;
        }

        var text ="";



        changes.ops.forEach(function(op) 
        {


            var operation = Object.keys(op);



                var oper = "";
                var att= "";

                     // extract attributes from the operation in the case of there existance
                        for (var i = operation.length - 1; i >= 0; i--) 
                        {
                            var v = op[operation[i]];
                            if (operation[i]==="attributes") {
                                att=v;
                            } else {
                                oper= operation[i];
                                value = v;

                            }
                        }


        


        // Change the style = remove the word and insert again with attribues,  
        
        // In the case of changing the style, delta will contain "retain" (the start postion) with attributes 
         


        var isItInsertWithAtt = false;  // to know if we have to update comments or not, if its delete because of changing style, no update comments is needed
        sendIt(text,att,0,value,oper);
        

        // Send the changes carater by caracter 
        function sendIt(text,att,start,value,oper){
                switch (oper){
                                    case "retain": 
                                    
                                    if (att != "") { 
                                            isItInsertWithAtt= true;

                                            // the value in this case is the end of format 
                                                
                                                
                                                
                                                
                                                // insert the changed text with the new attributes

                                           // 1 delete the changed text  from retain to value
                                            sendIt("","",retain,value,"delete");

                                           // 2 insert with attributes
                                            var Deltat  = editor.editor.delta.slice(retain,retain+value);
                                           
                                            applyChanges(Deltat,retain); 
                                   
                                    }    
                                    else {
                                    retain = value ;
                                    
                                    }
                                    
                                        // If there is attributes than delet and then insert   
                                    break;

                                    case "insert":
                                            text = value ;
                                            // Insert caracter by caracter aor by object for the other formats
                                        
                                            // this is a formula
                                             if (value.formula != undefined) {
                                                
                                                att=editor.getFormat(retain,1);
                                                model.core.insert({type:'formula',text:value,att:att}, retain);
                                            } else 

                                            {

                                            // this is a video
                                            if (value.video != undefined) {
                                                
                                                att=editor.getFormat(retain,1);
                                                model.core.insert({type:'video',text:value,att:att}, retain);
                                                   

                                                } else {
                                            // It is an image
                                            if (value.image != undefined) {
                                                 att=editor.getFormat(retain,1);
                                                 model.core.insert({type:'image',text:value,att:att}, retain);
                                                 
                                            }    
                                            else { // text

                                            for (var i=retain; i<(retain+text.length); ++i){
                                                     att=editor.getFormat(i,1);
                                                     model.core.insert({type:'char',text:text[i-retain],att:att}, i);
                                                                            };
                                            retain = retain +text.length ;
                                            }
                                        }
                                    }
                                    break;

                                    case "delete": var length = value;
                                     
                                    if (!isItInsertWithAtt) {UpdateComments();}      
                                    if (start == 0) {
                                    start = retain;    
                                    }

                                    // Delete caracter by caracter
                                    
                                            for (var i=start; i<(start+length); ++i){
                                                    model.core.remove(start);
                                                    
                                                        };
                                    break;
                                    }
        }
                    });


                }
    } );


// At the reception of insert operation   
model.core.on('remoteInsert', function(element, index){

      /*  console.log("Remot Insert element");
        console.dir(element);
        console.log(" attindex ="+index);
        var index3 =index-1; // just for debug
*/
     //   debugger;
        if (index!==-1){
            switch (element.type){
                        case "formula": 
                            editor.insertEmbed(index-1,'formula',element.text.formula, 'silent');
                        
                        break;
                        case "image": 
                            editor.insertEmbed(index-1,'image',element.text.image, 'silent');
                  
                        break;
                        case "video": 
                            editor.insertEmbed(index-1,'video',element.text.video, 'silent');
                     
                        break;
                        case "char": 
                            editor.insertText(index-1,element.text,element.att, 'silent');
                    

                            editor.removeFormat(index-1,1,'silent');   
                             break;
                        }
            if (element.att != "") {
                               editor.formatLine(index-1,element.att,'silent');         
                         
                               editor.formatText(index-1,1,element.att,'silent');      
                       
                                 if (element.att.commentAuthor) {
                                       UpdateComments();      
                                       } 
                                /* if (element.att.align) {
                                        editor.formatLine(index-2,'align',element.att.align,'silent')
                                    }
                                 if (element.att.header) {
                                        editor.formatLine(index-2,'header',element.att.header,'silent')
                                    }*/

                                }
            

        };
    });

// At the reception of remove operation    
model.core.on('remoteRemove', function(index){    
        
        var removedIndex = index-1;
        if (index !== -1){
            editor.deleteText(index-1, 1,'silent');
            
            UpdateComments();  
            var index3 =index-1; // just for debug
        };
    });
    

// At the reception of CARET positon
model.core.on('remoteCaretMoved', function(range, origin){
    
    if (!origin) return;
        
        if (self.markers[origin])  { // viewers + editor 
            self.markers[origin].update(range,true);
            
        } else { 
            //self.markers.push(origin);
            self.markers[origin]= new Marker(origin,5*1000,range,editor.getModule('cursors'),true);                
        }
   
    }); 



// For any change in title, broadcast the new title
jQuery('#title').focusout(function(){
 jQuery('#title').attr('contenteditable','false');
  if (jQuery('#title').text()=="") {
    jQuery('#title').text('Untitled document');
  }

  //TODO: Optimize change only if the text is changed from last state 
model.core.sendChangeTitle(jQuery('#title').text());

});




//At the reception of Title changed operation 

model.core.on('changeTitle', function(title){
   jQuery('#title').text(title);
  });



// send periodcaly ping  every 2 second


// TODO: Make 1 seconds as parameter
startTimer=setInterval(function () { model.core.sendPing();} , 2000);


// at reception of bing update the avatar 

model.core.on('ping', function(origin,pseudo){
        if (self.markers[origin])  {
            self.markers[origin].update(null,false); // to keep avatar
            self.markers[origin].setPseudo(pseudo);
            
        } else {  // to creat the avatar
            //self.markers.push(origin);
            self.markers[origin]= new Marker(origin,5*1000,{index:0, length:0},editor.getModule('cursors'),false);
            self.markers[origin].setPseudo(pseudo);
                 // broadcast the title if it changed 
                 //TODO: optimize by a unicast message

           // if we receive a ping and we are the main editor the send the new title
          if((document.URL.split("?")).length<=1 && jQuery('#title').text() != "Untitled document" ) // on main editor if the title h
              {
            model.core.sendChangeTitle(jQuery('#title').text());   
              }        
        }
  });

// This function to extact the comments form the editor abd show them in #comments
function UpdateComments() {
        // clear comments 
         jQuery("#comments").empty();
        // for each insert check att if it contains Athour then insert comment 
        quill.editor.delta.ops.forEach(function(op) {
            if (op.insert){
                  if(op.attributes) {
                        if(op.attributes.commentAuthor){
                           var id = op.attributes.commentAuthor;
                            //
                            addCommentToList(op.attributes.comment,id,self.markers[id].animal,self.markers[id].pseudoName,self.markers[id].colorRGB, op.attributes.commentTimestamp);
                        }

                  }  

            }




        });

}
}
module.exports = EditorController;