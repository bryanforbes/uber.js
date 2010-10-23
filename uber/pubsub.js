require.def("uber/pubsub", ["uber", "uber/dispatcher"], (function(global){
    return function(uber){
        uber._topics = {};

        function subscribe(topic, func){
            var f = uber._topics[topic];
            if(!f){
                f = uber._topics[topic] = uber.createDispatcher();
                f.add(null);
            }
            return f.add(func);
        }

        function publish(topic, args){
            var f = uber._topics[topic];
            if(f){
                f.apply(global, args||[]);
            }
        }

        uber.subscribe = subscribe;
        uber.publish = publish;
    };
})(this));
