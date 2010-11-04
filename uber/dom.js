require.def("uber/dom", ["uber", "has/has", "has/detect/bugs"], (function(global, document){
    return function(uber){
        if(!has("dom")){ return; }

        function getDocument(element){
            // based on work by John-David Dalton
            return element.ownerDocument || element.document ||
                (element.nodeType == 9 ? element : document);
        }

        function getWindow(element){
            // based on work by Diego Perini and John-David Dalton
            var frame, i = -1, doc = getDocument(element), frames = global.frames;
            if(document != doc){
                while(frame = frames[++i]){
                    if(frame.document == doc){
                        return frame;
                    }
                }
            }
            return global;
        }

        var byId;
        if(has("bug-getelementbyid-ids-names")||has("bug-getelementbyid-ignores-case")){
            byId = function byId(id, doc){
                var _d = doc || document, te = _d.getElementById(id);
                // attributes.id.value is better than just id in case the 
                // user has a name=id inside a form
                if(te && (te.attributes.id.value == id || te.id == id)){
                    return te;
                }else{
                    var eles = _d.all[id];
                    if(!eles || eles.nodeName){
                        eles = [eles];
                    }
                    // if more than 1, choose first with the correct id
                    var i = 0;
                    while((te = eles[i++])){
                        if((te.attributes && te.attributes.id && te.attributes.id.value == id)
                        || te.id == id){
                            return te;
                        }
                    }
                }
            };
        }else{
            byId = function byId(id, doc){
                return (doc||document).getElementById(id);
            };
        }

        function isDescendant(node, ancestor){
            try{
                while(node){
                    if(node === ancestor){
                        return true;
                    }
                    node = node.parentNode;
                }
            }catch(e){};
            return false;
        }

        var NUMBER_PROP = has("dom-uniquenumber") ? "uniqueNumber" : "_uberId",
            _nextNodeId = 2;

        function getNodeId(node){
            // Based on work by John-David Dalton
            var id = node[NUMBER_PROP], win;

            if(!id){
                // In IE window == document is true but not document == window.
                // Use loose comparison because different `window` references for
                // the same window may not strict equal each other.
                win = uber.getWindow(node);
                if (node == win) {
                    id = node == global ? '0' : uber.getNodeId(node.frameElement) + '-0';
                }else if(node.nodeType == 9){ // document node
                    // quick return for common case OR
                    // calculate id for foreign document objects
                    id = node == document ? '1' : uber.getNodeId(win.frameElement) + '-1';
                }else{
                    id = node._uberId = _nextNodeId++;
                }
            }

            return id;
        }

        // Adapted from FuseJS
        var destroyElement, destroyDescendants,
            PARENT_PROP = has("dom-parentelement") ? "parentElement" : "parentNode";
        if(has("dom-innerhtml")){
            // Prevent leaks using removeChild
            destroyElement = (function(){
                var trash = document.createElement('div');
                function destroyElement(element){
                    trash.appendChild(element);
                    trash.innerHTML = '';
                }
                return destroyElement;
            })();
            destroyDescendants = function destroyDescendants(element){
                element.innerHTML = '';
            };
        }else{
            destroyElement = function destroyElement(element, parentNode){
                parentNode = parentNode || element[PARENT_PROP];
                if(parentNode){
                    parentNode.removeChild(element);
                }
            };
            destroyDescendants = function destroyDescendants(element){
                var child, de = uber.destroyElement;
                while(child = element.lastChild){
                    de(child, element);
                }
            };
        }

        uber.getWindow = getWindow;
        uber.getDocument = getDocument;
        uber.byId = byId;
        uber.isDescendant = isDescendant;
        uber.getNodeId = getNodeId;
        uber.destroyElement = destroyElement;
        uber.destroyDescendants = destroyDescendants;
        
    };

})(this, document));
