var Marker = require('../view/marker.js');

function EditorController(model, viewEditor){
    var self = this;
    editor = viewEditor.editor;
    this.viewEditor = viewEditor;   
    this.fromRemote = false;
    markers= [];


    // Add the the user to list of cusors

    var id= model.uid;

    markers.push(id);
    markers[id]= new Marker(id,5*1000,{index:0, length:0},editor.getModule('cursors'),false,true);
    
    quill.options.modules.comment.commentAddOn=markers[id].animal;
    quill.options.modules.comment.commentAuthorId = id;
    quill.options.modules.comment.color = markers[id].colorRGB;



    window.crate_insert_value=[];



editor.on('selection-change', function(range, oldRange, source) {
  if (range){
    model.core.caretMoved(range);
    console.log("local cursor changed");
    }
    });

editor.on('text-change', function(delta, oldDelta, source) {
        

        applyChanges(delta,0);

    
        //Send delta object with style charater by charcter starting from  the position "iniRetain"             
        function applyChanges (delta,iniRetain) {

        var changes = JSON.parse(JSON.stringify(delta, null, 2));

        window.crate_changes =changes;
        var retain=iniRetain;
        if (editor.editor.delta.length()==3) {
        var retain=1;
        }

        var text ="";



        changes.ops.forEach(function(op) {

            var operation = Object.keys(op);

            window.crate_op=op;


                var oper = "";
                var att= "";

                     //there are attributes 
                        for (var i = operation.length - 1; i >= 0; i--) {
                            var v = op[operation[i]];
                            if (operation[i]==="attributes") {
                                att=v;
                            } else {
                                oper= operation[i];
                                value = v;

                            }
                        }

        sendIt(text,att,0,value,oper);
        var isItInsertWithAtt = false; // it will be delte then insert with attr
        function sendIt(text,att,start,value,oper){
                switch (oper){
                                    case "retain": 
                                    
                                    if (att != "") { // the value in this case is the end of format 
                                        temp =retain+value;
                                        isItInsertWithAtt= true;
                                        // step1 get the hole delta of the changed text 
                                        // delete the changed text 
                                        // insert the changed text with the new attributes

                                   //console.log("att = $.param(editor.editor.delta.slice("+retain+","+temp+"))");   
                                   // delete 
                                    sendIt("","",retain,value,"delete");
                                    //insert with attributes
                                    var Deltat  = editor.editor.delta.slice(retain,retain+value);
                                    applyChanges(Deltat,retain);
                                    }    
                                    else {
                                    retain = value ;
                                    console.log('retain ==|'+value);

                                    }
                                    
                                        // If there is attributes than delet and then insert   
                                    break;

                                    case "insert":
                                            text = value ;
                                            // Insert caracter by caracter
                                            console.log('insert ==|'+text);


                                            

                                            crate_insert_value.push(value);
                                            // this is a formula
                                             if (value.formula != undefined) {
                                                console.log("It is formula ! "); 
                                                model.core.insert({type:'formula',text:value,att:att}, retain);
                                            } else 

                                            {

                                            // this is a video
                                            if (value.video != undefined) {
                                                console.log("It is video ! "); 
                                                model.core.insert({type:'video',text:value,att:att}, retain);
                                                   

                                                } else {
                                            // It is an image
                                            if (value.image != undefined) {
                                                 model.core.insert({type:'image',text:value,att:att}, retain);
                                                 console.log("It is image ! ");
                                            }    
                                            else { // text
                                            for (var i=retain; i<(retain+text.length); ++i){
                                                     model.core.insert({type:'char',text:text[i-retain],att:att}, i);
                                                     console.log('model.core.insert('+text[i-retain]+','+ i+')');
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
                                    console.log('delete ==|'+value);
                                            for (var i=start; i<(start+length); ++i){
                                                    model.core.remove(start);
                                                    console.log('model.core.remove('+i+')');
                                                        };
                                    break;
                                    }
        }
                    });


                }
    } );
  
model.core.on('remoteInsert', function(element, index){

        var index3 =index-1; // just for debug
            console.log("insertText("+index3+","+element.text+",'silent')");
        if (index!==-1){
            switch (element.type){
                        case "formula": 
                            window.crate_formula= element.text;
                            editor.insertEmbed(index-1,'formula',element.text.formula, 'silent');
                        break;
                        case "image": 
                            window.crate_image= element.text;
                            editor.insertEmbed(index-1,'image',element.text.image, 'silent');
                        break;
                        case "video": 
                            window.crate_video= element.text;
                            editor.insertEmbed(index-1,'video',element.text.video, 'silent');
                        break;
                        case "char": 
                           
                                editor.insertText(index-1,element.text, 'silent');
                                editor.removeFormat(index-1,1,'silent');

                            if (element.att != "") {
                                // there is a comment inserted
                                console.log(element.att);

                                if (element.att.commentAuthor) {
                                       UpdateComments();      
                                       }           
                            }
                        break;
                        }
            if (element.att != "") { 
                                editor.formatText(index-1,1,element.att,'silent');
                                }
            window.crate_ele = element;
            

        };
    });
    
model.core.on('remoteRemove', function(index){    
        
        var removedIndex = index-1;
        console.log("remove index (delete) ==>'"+removedIndex+"'");
        if (index !== -1){
            editor.deleteText(index-1, 1,'silent');
            
            UpdateComments();  
            var index3 =index-1; // just for debug
            console.log("deleteText("+index3+",1,'silent')");
        };
    });
    
    //(origin,lifeTime,range,cursors)
model.core.on('remoteCaretMoved', function(range, origin){
    
    if (!origin) return;
        
        if (markers[origin])  { // viewers + editor 
            markers[origin].update(range,true);
            
        } else { 
            markers.push(origin);
            markers[origin]= new Marker(origin,5*1000,range,editor.getModule('cursors'),true);                
        }
   
    }); 



// if the title changed
jQuery('#title').focusout(function(){
 jQuery('#title').attr('contenteditable','false');
  console.log("Title changed ...");
  if (jQuery('#title').text()=="") {
    jQuery('#title').text('Untitled document');
  }

  //TODO: Optimize change only if the text is changed from last state 
model.core.sendChangeTitle(jQuery('#title').text());

});




//when title is changed 

model.core.on('changeTitle', function(title){
   jQuery('#title').text(title);
  });



// send periodcaly ping  every 1 second
// TODO: Make 1 seconds as parameter
startTimer=setInterval(function () { model.core.sendPing();} , 1000);


// at reception of bing update the avatar 

model.core.on('ping', function(origin){

            // Life time is 60s of the cursor 
           

        if (markers[origin])  {
            markers[origin].update(null,false); // to keep avatar
            
        } else {  // to creat the avatar
             markers.push(origin);
            markers[origin]= new Marker(origin,5*1000,{index:0, length:0},editor.getModule('cursors'),false);
         
                 // broadcast the title if it changed 
                 //TODO: optimize by a unicast message
          if((document.URL.split("?")).length<=1 && jQuery('#title').text() != "Untitled document" ) // on main editor if the title h
              {
            model.core.sendChangeTitle(jQuery('#title').text());   
              }        
        }
  });


function UpdateComments() {
        // clear comments 
         jQuery("#comments").empty();
        // for each insert check att if it contains Athour then insert comment 
        quill.editor.delta.ops.forEach(function(op) {
            if (op.insert){
                  if(op.attributes) {
                        if(op.attributes.commentAuthor){
                           var id = op.attributes.commentAuthor;
                            //console.log("commentTimestamp = "+op.attributes.commentTimestamp);
                            addCommentToList(op.attributes.comment,id,markers[id].animal,markers[id].colorRGB, op.attributes.commentTimestamp);
                        }

                  }  

            }




        });

}
}
module.exports = EditorController;