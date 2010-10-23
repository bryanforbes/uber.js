(function(uber, has, document, global){
    if(!has("dom")){ return; }

    function getDocument(element){
        return element.ownerDocument || element.document ||
            (element.nodeType == 9 ? element : document);
    }

    function getWindow(element){
        // based on work by Diego Perini
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

    var div = document.createElement("div"),
        docEl = document.documentElement,
        hasUniqueNumber = (typeof div.uniqueNumber == 'number' &&
            docEl.uniqueNumber == 'number' &&
            div.uniqueNumber != docEl.uniqueNumber),
        NUMBER_PROP = hasUniqueNumber ? "uniqueNumber" : "_uberId",
        _nextNodeId = 2;

    function getNodeId(node){
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

    var hasAEL = has("dom-addeventlistener"),
        hasAE = has("dom-attachevent"),
        div = document.createElement("div");

    var addEvent, removeEvent;
    if(hasAEL){
        // W3C
        addEvent = function(obj, evtName, handler){
            obj.addEventListener(evtName, handler, false);
        };
        removeEvent = function(obj, evtName, handler){
            obj.removeEventListener(evtName, handler, false);
        };
    }else if(hasAE){
        // IE and old Opera
        addEvent = function(obj, evtName, handler){
            obj.attachEvent("on" + evtName, handler);
        };
        removeEvent = function(obj, evtName, handler){
            obj.detachEvent("on" + evtName, handler);
        };
    }/*else{
        // TODO: do we want to support this?
        // DOM0
        addEvent = function(obj, evtName, handler){
            var attrName = "on" + evtName,
                oldHandler = element[attrName];

            if(oldHandler){
                obj[attrName] = function(){
                    oldHandler.apply(this, arguments);
                    handler.apply(this, arguments);
                };
            }else{
                obj[attrName] = handler;
            }
        };
        removeEvent = function(obj, evtName, handler){
            obj["on" + evtName] = null;
        };
    }*/
    var domReady = new uber.Deferred(),
        documentReadyStates = { "loaded": 1, "interactive": 1, "complete": 1 },
        fixReadyState = typeof document.readyState != "string",
        isLoaded = false,
        pollerTO;

    function onDOMReady(){
        if(isLoaded){ return; }

        isLoaded = true;
        div = null;

        if(fixReadyState){
            document.readyState = "interactive";
        }
        removeEvent(document, "DOMContentLoaded", onHandlerLoaded);
        removeEvent(document, "readystatechange", onHandlerLoaded);
        removeEvent(global, "load", onHandlerLoaded);

        if(pollerTO){
            clearTimeout(pollerTO);
        }

        domReady.resolve();
    }
    function onHandlerLoaded(){
        if(isLoaded){ return; }
        onDOMReady();
    }
    var doScrollCheck = false;
    function poller(){
        if(isLoaded){ return; }
        // doScroll will not throw an error when in an iframe
        // so we rely on the event system to fire the domReady event
        // before the window onload in IE6/7
        if(doScrollCheck){
            try {
                div.doScroll();
                console.log("scroll ready");
                onDOMReady();
                return;
            } catch(e) { }
        }
        if(documentReadyStates[document.readyState]){
            console.log("readystate poll ready");
            onDOMReady();
            return;
        }
        pollerTO = setTimeout(poller, 30);
    }
    if(document.readyState == "complete"){
        domReady.resolve();
    }else{
        // Connect to "load" and "readystatechange", poll for "readystatechange",
        // and either connect to "DOMContentLoaded" or poll for div.doScroll.
        // First one fired wins.
        if(hasAEL){
            addEvent(document, "DOMContentLoaded", onHandlerLoaded);
        }else if(has("dom-element-do-scroll")){
            // Avoid a potential browser hang when checking window.top (thanks Rich Dougherty)
            // The value of frameElement can be null or an object.
            // Checking window.frameElement could throw if not accessible.
            try { doScrollCheck = global.frameElement == null; } catch(e) { }
        }

        addEvent(global, "load", onHandlerLoaded);
        addEvent(document, "readystatechange", onHandlerLoaded);

        // Derived with permission from Diego Perini's IEContentLoaded
        // http://javascript.nwbox.com/IEContentLoaded/
        pollerTO = setTimeout(poller, 30);
    }

    // The following code only sets up the event on the objects
    // if .then() is called the first time.
    var freeze = Object.freeze||null;
    function unloadDeferred(eventName){
        var attached = 0, deferred = new uber.Deferred(),
            op = deferred.promise,
            promise = new uber.Promise(),
            then, cancel;
        promise.then = function then(){
            var result = op.then.apply(op, arguments);
            if(!attached){
                attached = 1;
                addEvent(global, eventName, function(){
                    deferred.resolve();
                });
            }
            return result;
        }
        promise.cancel = function cancel(){
            op.cancel.apply(op, arguments);
        }
        if(freeze){
            freeze(promise);
        }
        deferred.promise = promise;
        return deferred;
    }

    var unload = unloadDeferred("unload");
    var beforeUnload = unloadDeferred("beforeunload");

    uber.getWindow = getWindow;
    uber.getDocument = getDocument;
    uber.getNodeId = getNodeId;

    // only pass back the promise so the deferreds can't
    // be modified
    uber.domReady = function(){ return domReady.promise; };
    uber.unload = function(){ return unload.promise; };
    uber.beforeUnload = function(){ return beforeUnload.promise; };
})(uber, has, document, this);