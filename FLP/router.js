define([
	'jquery', 
	'backbone', 
	'underscore',
    'text!../dirListView.html'], 
function($, Backbone, _, dirListView){
    var compiledTemplate = _.template(dirListView);
    var $container =  $('#container');

    function getDirList(dirPath, callback) {
        if(!('requestFileSystem' in window)) {
            alert('Cannot request file system');
            var fakeEntries = [{
                isFile: true,
                isDirectory: false,
                name: "fakeFile.js",
                fullPath: dirPath + "fakeFile.js"
            }, {
                isFile: true,
                isDirectory: false,
                name: "fakeFile2.js",
                fullPath: dirPath + "fakeFile.js"
            }];
            callback(fakeEntries);
            return;
        }
        window.requestFileSystem(window.LocalFileSystem.PERSISTENT, 0, function(fileSystem) {
            console.log(fileSystem.name);
            console.log(fileSystem.root.name);
            $('#file-system-text').html("File System: <strong>" + fileSystem.name + "</strong> " + "Root: <strong>" + fileSystem.root.name + "</strong>");
            fileSystem.root.getDirectory(dirPath, {
                create: true,
                exclusive: false
            }, function(dirEntry) {
                var directoryReader = dirEntry.createReader();
                // Get a list of all the entries in the directory
                directoryReader.readEntries(function(entries) {
                    callback(entries);
                }, function(error) {
                    alert("Failed to list directory contents: " + error.code);
                });
            }, function(error) {
                alert("Unable to create new directory: " + error.code);
            });
        }, function failFS(evt) {
            console.log(evt);
            alert("File System Error: " + evt.target.error.code);
        });
    }
    
    
    //indexRelPathPrefix computed so the location of the boilerplate directory can change
    //only requiring modification of index.html
    //I haven't tested it though.
    //var indexRelPathPrefix = _.map(require.toUrl('').split('/'), function(){return '';}).join('../');
	var Router = Backbone.Router.extend({
        currentContext: {
            page: '',
            qp: {},
            last: {},
            url: ''
        },
		initialize: function(){
			Backbone.history.start();
            //TODO: Loading message?
		},
		routes: {
            '': 'listFiles',
			':page': 'listFiles'
		},
        start: function(){
            this.navigate('listFiles', {trigger: true, replace: true});
        },
		listFiles: function(page, params){
            var that = this;
            console.log('params:');
            console.log(params);
            if(!params){
                params = {};
            }
            _.extend(params, {
                "dirPath" : "odk/js/forms/"
            });
            getDirList(params.dirPath, function(entries) {
                console.log(entries);
                $container.html(compiledTemplate({"entries" : entries}));
                /*
                var i;
                var $entries = $('#entries');
                for (i = 0; i < entries.length; i++) {
                    console.log(entries[i].name);
                    if (entries[i].isDirectory) {
                        var $formLink = $('<li><a href="file:///sdcard/' + dirPath + entries[i].name + '/formDef.json">' + entries[i].name + '</a></li>');
                        $entries.append($formLink);
                    }
                }
                */
            });
            
		}
	});
	return Router;
});
