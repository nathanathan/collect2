// This set's up the module paths for underscore and backbone
require.config({ 
    'paths': { 
		"underscore": "libs/underscore-min", 
		"backbone": "libs/backbone-min",
        "backboneqp": "libs/backbone.queryparams"
	},
	'shim': 
	{
        underscore: {
			'exports': '_'
		},
		backbone: {
			'deps': ['jquery', 'underscore'],
			'exports': 'Backbone'
		},
        backboneqp: ['backbone', 'underscore']
	}	
}); 

require([
	'underscore',
	'backbone',
    'app',
    'backboneqp'
	], 
	function(_, Backbone, app){
        /*
        No need to worry about timing:
        This event behaves differently from others in that any event handler registered after the event has been fired will have its callback function called immediately.
        */
        document.addEventListener("deviceready", function onDeviceReady() {
            window.testVar = !('requestFileSystem' in window);
            app.init();
        });
});
