require.def("uber", ["has/has"], (function(global){
	return function(){
		return global.uber = {
			isHostType: has.isHostType,
			clearElement: has.clearElement
		};
	};
})(this));
