var Marker = require('../view/marker.js');

function EditorController(model, viewEditor){
    var self = this, editor = viewEditor.editor;
    editor2 = viewEditor.editor2;
    this.viewEditor = viewEditor;   
    this.fromRemote = false;
    
    // #B initialize the string within the editor
    function getStringChildNode(childNode){
        var result = '';
        if (childNode.e !== null){ result = childNode.e; };
        for (var i=0; i<childNode.children.length; ++i){
            result += getStringChildNode(childNode.children[i]);
        };
        return result;
    };
    
    editor.setValue(getStringChildNode(model.sequence.root),1);
    
    var insertRemoveOp = false;
    editor.getSession().on('change', function(e){
        switch(e.data.action){
        case 'removeLines':
        case 'removeText':
        case 'insertLines':
        case 'insertText':
            insertRemoveOp = true;
        }
    });
    
    editor.getSession().getSelection().on('changeCursor', function(e, sel){
        if (!insertRemoveOp){
            var range = sel.getRange();
            model.core.caretMoved({
                start: editor.getSession().getDocument().positionToIndex(range.start),
                end: editor.getSession().getDocument().positionToIndex(range.end)
            });
        }
        insertRemoveOp = false;
    });
    
editor2.on('text-change', function(delta, oldDelta, source) {
applyChanges(delta,0);

function applyChanges (delta,iniRetain) {

var changes = JSON.parse(JSON.stringify(delta, null, 2));

window.crate_changes =changes;
var retain=iniRetain;
if (editor2.editor.delta.length()==3) {
var retain=1;
}

var text ="";



changes.ops.forEach(function(op) {

    var operation = Object.keys(op);

    window.crate_op=op;


        var oper = "";
        var att= "";

             //there is attributes 
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

function sendIt(text,att,start,value,oper){
        switch (oper){
                            case "retain": 
                            
                            if (att != "") { // the value in this case is the end of format 
                                temp =retain+value;

                                // step1 get the hole delta of the changed text 
                                // delete the changed text 
                                // insert the changed text with the new attributes

                           //console.log("att = $.param(editor2.editor.delta.slice("+retain+","+temp+"))");   
                           // delete 
                            sendIt("","",retain,value,"delete");
                            //insert with attributes
                            var Deltat  = editor2.editor.delta.slice(retain,retain+value);
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


                                    window.crate_insert_value = value;

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
                            break;

                            case "delete": var length = value;

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
}

        );



    editor.getSession().on('change', function(e) {
        var begin, end, text, message, j=0;

        if (!self.fromRemote){
            // #1 process the boundaries from range to index and text
            begin = editor.getSession().getDocument().positionToIndex(
                e.data.range.start);
            
            switch (e.data.action){
            case 'removeLines':
                end = begin;
                for (var i=0; i<e.data.lines.length;++i){
                    end += e.data.lines[i].length+1; // +1 because of \n
                };
                remoteCaretsUpdate(begin, begin-end);
                break;  
            case 'removeText':
                if (e.data.text.length === 1){
                    end = begin+1; //faster
                } else {
                    end = editor.getSession().getDocument().positionToIndex(
                        e.data.range.end);
                };
                remoteCaretsUpdate(begin, begin-end);
                break;
            case 'insertLines':
                text = '';
                for (var i=0; i<e.data.lines.length;++i){
                    text = text + (e.data.lines[i]) + '\n';
                };
                end = begin + text.length;
                remoteCaretsUpdate(begin, text.length);
                break;
            case 'insertText':
                text = e.data.text;
                end = editor.getSession().getDocument().positionToIndex(
                    e.data.range.end);
                remoteCaretsUpdate(begin, text.length);
                break;
            };
            // #2 update the underlying CRDT model and broadcast the results
            for (var i=begin; i<end; ++i){
                switch (e.data.action){
                case 'insertText': model.core.insert(text[j], i); break;
                case 'insertLines': model.core.insert(text[j], i); break;
                case 'removeText': model.core.remove(begin); break;
                case 'removeLines': model.core.remove(begin); break;
                };
                ++j;
            };
        };
    });
    
    model.core.on('remoteInsert', function(element, index){
        var aceDocument = editor.getSession().getDocument(),
            delta,
            tempFromRemote;
        console.log("caracter received (Insert) ==>'"+element+"'");
        if (index!==-1){
            delta = {action: 'insertText',
                     range: { start: aceDocument.indexToPosition(index-1),
                              end:   aceDocument.indexToPosition(index)},
                     text: element},
            tempFromRemote = self.fromRemote;
            self.fromRemote = true;
            //aceDocument.applyDeltas([delta]);
            remoteCaretsUpdate(index,1);
            self.fromRemote = tempFromRemote;

            if (element.type == "image") 
                {
                window.crate_image= element.text;
                editor2.insertEmbed(index-1,'image',element.text.image, 'silent');


                }  else 
                {
                if (element.att === "") {
                editor2.insertText(index-1,element.text, 'silent');
                }
                else
                {
                 editor2.insertText(index-1,element.text, element.att,'silent');
                }
                           
                }
            window.crate_ele = element;
            var index3 =index-1; // just for debug
            console.log("insertText("+index3+","+element+",'silent')");

        };
    });
    
    model.core.on('remoteRemove', function(index){    
        var aceDocument = editor.getSession().getDocument(),
            delta,
            tempFromRemote;
        var removedIndex = index-1;
        console.log("remove index (delete) ==>'"+removedIndex+"'");
        if (index !== -1){
            delta = {action: 'removeText',
                     range: { start: aceDocument.indexToPosition(index - 1),
                              end:   aceDocument.indexToPosition(index)},
                     text: null};
            tempFromRemote = self.fromRemote;
            self.fromRemote = true;
            aceDocument.applyDeltas([delta]);
            remoteCaretsUpdate(index,-1);
            self.fromRemote = tempFromRemote;

            editor2.deleteText(index-1, 1,'silent');
            var index3 =index-1; // just for debug
            console.log("deleteText("+index3+",1,'silent')");
        };
    });
    
    model.core.on('remoteCaretMoved', function(range, origin){
        if (!origin) return;
        if (editor.session.remoteCarets[origin]){
            // #A update the existing cursor
            var marker = editor.session.remoteCarets[origin];
            marker.cursors = [range]; // save the cursors as indexes
            editor.getSession()._signal('changeFrontMarker');
            marker.refresh();
        }else{
            // #B create a new cursor
            var marker = new Marker(editor.session, origin, range);
            editor.session.addDynamicMarker(marker, true);
            editor.session.remoteCarets[origin] = marker;
            marker.refresh();
            // call marker.session.removeMarker(marker.id) to remove it
            // call marker.redraw after changing one of cursors
        }
    });
    
    editor.session.remoteCarets = {};
    function remoteCaretsUpdate(index, length){
        var change = false, document = editor.session.getDocument();
        for (origin in editor.session.remoteCarets){
            var remoteCaret = editor.session.remoteCarets[origin];
            for (i=0; i<remoteCaret.cursors.length; ++i){
                var cursor = remoteCaret.cursors[i];
                if (cursor.start >= index){
                    cursor.start += length;
                    change = true;
                }
                if (cursor.end >= index){
                    cursor.end += length;
                    change = true;
                }
            }
        }
        if (change){
            editor.session._signal('changeFrontMarker');
        }
    };
    
};

module.exports = EditorController;
