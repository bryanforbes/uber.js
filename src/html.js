(function(uber, has, document){

    var STR = "string",
        getComputedStyle, getStyleName,
        setSelectable, setOpacity, getOpacity,
        domComputedStyle = has("dom-computed-style")
    ;

    uber.boxModel = has("css-content-box") ? "content-box" : "border-box";
    uber.floatProperty = has("css-style-float") ? "styleFloat" : "cssFloat";

    if(has("dom-current-style")){
        getComputedStyle = function getComputedStyle(node){
            // IE (as of 7) doesn't expose Element like sane browsers
            return node.currentStyle;
        };
    }else if(domComputedStyle){
        getComputedStyle = function getComputedStyle(node){
            return node.ownerDocument.defaultView.getComputedStyle(node, null);
        };
    }else{
        getComputedStyle = function getComputedStyle(node){
            return node.style;
        };
    }

    getStyleName = (function(){
        var testElem = document.createElement("div"),
            prefixes = ['Khtml', 'ms', 'O', 'Moz', 'Webkit'],
            dashRE = /-([a-z])/ig,
            startRE = /^(.)/,
            bump = function(all, letter){
                return letter.toUpperCase();
            },
            cache = {},
            floatName = uber.floatProperty,
            floatNames = { 'float': floatName, 'cssFloat': floatName, 'styleFloat': floatName };

        function getStyleName(styleName){
            if(styleName in cache){
                return cache[styleName];
            }
            var originalName = styleName,
                styleName = floatNames[styleName] || styleName.replace(dashRE, bump),
                style = testElem.style,
                length = prefixes.length,
                psn;

            // test unprefixed
            if(typeof style[styleName] == STR){
                return cache[originalName] = cache[styleName] = styleName;
            }

            styleName = styleName.replace(startRE, bump);

            while(--length){
                psn = prefixes[length] + styleName;
                if(typeof style[psn] == STR){
                    return cache[originalName] = cache[styleName] = cache[psn] = styleName;
                }
            }
            return cache[originalName] = null;
        };

        return getStyleName;
    })();

    if(has("css-selectable")){
        var selectableName = getStyleName("userSelect"),
            trueValue = "";
        if(/^(Khtml|Webkit)/.test(selectableName)){
            trueValue = "auto";
        }
        setSelectable = function setSelectable(node, selectable){
            node.style[selectableName] = selectable ? trueValue : "none";
        };
    }else if(has("bug-properties-are-attributes")){
        setSelectable = function setSelectable(node, selectable){
            var v = (node.unselectable = selectable ? "" : "on"),
                element, elements = node.getElementsByTagName("*"), i = -1;

            while(element = elements[++i]){
                if(element.nodeType == 1){ // ELEMENT_NODE
                    element.unselectable = v;
                }
            }
        };
    }else{
        setSelectable = function setSelectable(){
            /* do nothing */
        }
    }

    var astr = "DXImageTransform.Microsoft.Alpha";
    function af(n, f){
        try{
            return n.filters.item(astr);
        }catch(e){
            return f ? {} : null;
        }
    };

    var opacityProp = getStyleName("opacity");
    if(has("css-opacity-filter")){
        setOpacity = function setOpacity(node, value){
            var ov = value * 100,
                opaque = value == 1,
                item = !node.filters.length ? null : af(node),
                nodeStyle = node.style,
                curStyle = node.currentStyle || nodeStyle;

            if(!item && !opaque){
                nodeStyle.filter += " progid:" + astr + "(Opacity=" + ov + ")";
                item = af(node);
            }

            if(item){
                // only modify the zoom value if we need to force layout
                if(!opaque && !((curStyle && curStyle.hasLayout) || (curStyle && curStyle.zoom != "normal"))){
                    nodeStyle.zoom = 1;
                }
                item.Opacity = ov;

                // on IE7 Alpha(Filter opacity=100) makes text look fuzzy so disable it altogether (Dojo bug #2661),
                //but still update the opacity value so we can get a correct reading if it is read later.
                item.Enabled = !opaque;
            }

            if(uber.getNodeName(node) == "TR"){
                for(var i=node.cells.length; i--;){
                    uber.setOpacity(node.cells[i], value);
                }
            }
            return value;
        };
        getOpacity = function getOpacity(node){
            try{
                return af(node).Opacity / 100;
            }catch(e){
                return 1.0;
            }
        };
    }else if(!opacityProp){
        // Do nothing
        setOpacity = function setOpacity(){ return 1.0; };
        getOpacity = function getOpacity(){ return 1.0; };
    }else{
        setOpacity = function setOpacity(node, value){
            return node.style[opacityProp] = value;
        };
        if(domComputedStyle){
            getOpacity = function getOpacity(node){
                var cs = uber.getComputedStyle(node);
                return parseFloat(node.style[opacityProp] || (cs && cs[opacityProp]) || 1.0);
            };
        }else{
            getOpacity = function getOpacity(node){
                return parseFloat(node.style[opacityProp] || 1.0);
            };
        }
    }

    var _isVisible = (function(){
        var isVisible;
        if(domComputedStyle){
            isVisible = function isVisible(node){
                var cs = uber.getComputedStyle(node);
                return !!(cs && (node.offsetHeight || node.offsetWidth));
            };
        }else{
            isVisible = function isVisible(node){
                var cs = uber.getComputedStyle(node);
                return cs !== null && (cs || node.style).display != "none" &&
                    !!(node.offsetWidth || node.offsetHeight);
            };
        }
        return isVisible;
    })();

    var tableElements = { 'THEAD': 1, 'TBODY': 1, 'TR': 1 };
    var isVisible = (function(){
        // Adapted from FuseJS
        function isVisible(node){
            if(_isVisible(node)){
                var name = uber.getNodeName(node);
                if(tableElements[name] && (node = uber.getParentNode(node))){
                    return uber.isVisible(node);
                }
                return true;
            }
        }
        if(has("bug-table-elements-retain-offset-dimentions-when-hidden")){
            // IE7 and lower
            return isVisible;
        }else{
            return _isVisible;
        }
    })();

    uber.getComputedStyle = getComputedStyle;
    uber.getStyleName = getStyleName;
    uber.setSelectable = setSelectable;
    uber.setOpacity = setOpacity;
    uber.getOpacity = getOpacity;
    uber.isVisible = isVisible;

})(uber, has, document);
