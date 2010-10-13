(function(uber, has){

    var trim;

    if(has("string-trim") && !has("bug-es5-trim")){
        trim = function trim(str){
            return str.trim();
        };
    }else{
        var wsPlus = /^\s+/, ws = /\s/;
        if(has("bug-es5-regexp")){
            var whitespace = ("\u0009\u000A\u000B\u000C\u000D\u0020\u00A0\u1680\u180E\u2000\u2001\u2002"+
                "\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028\u2029\uFEFF").split('');
            var re = /^\s$/, i = whitespace.length, chr;
            while(i--){
                if(re.test(whitespace[i])){
                    whitespace.splice(i, 1);
                }
            }
            whitespace = "[\\s" + whitespace.join('') + "]";
            wsPlus = new RegExp("^" + whitespace + "+");
            ws = new RegExp(whitespace);
        }
        trim = function trim(str){
            var str = str.replace(wsPlus, ''),
                i = str.length;
            while(ws.test(str.charAt(--i)));
            return str.substring(0, i + 1);
        };
    }

    uber.trim = trim;

})(uber, has);
