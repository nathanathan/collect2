define([
	'jquery', 
	'backbone', 
	'underscore',
    'sfsf',
    'text!main.html',
    'text!dirListView.html'], 
function($, Backbone, _, sfsf, mainTemplateHtml, dirListView){
    var mainTemplate = _.template(mainTemplateHtml);

    var DirView = Backbone.View.extend({
        template: _.template(dirListView),
        orderVar: 1,
        render: function() {
            console.log('render');
            console.log(this.collection.toJSON());
            this.$el.html(this.template({
                entries : this.collection.toJSON()
            }));
            return this;
        },
        events: {
            'click .sort-name' : 'sortName',
            'click .sort-date' : 'sortDate',
            'click .refresh' : 'refresh'
        },
        genComparator : function(cfunc, incr) {
            if(!incr) {
                incr = 1;
            }
            return function(Ain, Bin) {
                var A = cfunc(Ain);
                var B = cfunc(Bin);
                if(A < B) return -incr;
                if(A > B) return incr;
                if(A == B) return 0;
            };
        },
        sortName: function(e) {
            console.log('sortName');
            console.log(e);
            this.orderVar = -this.orderVar;
            this.collection.comparator = this.genComparator(function(entry) {
                return entry.get("name");
            }, this.orderVar);
            this.collection.sort();
            this.render();
            return this;
        },
        sortDate: function(e) {
            console.log('sortTime');
            console.log(e);
            this.orderVar = -this.orderVar;
            this.collection.comparator = this.genComparator(function(entry) {
                return entry.get("_modificationTime");
            }, this.orderVar);
            this.collection.sort();
            this.render();
            return this;
        },
        refresh: function(e) {
            console.log('refresh');
            console.log(e);
            var that = this;
            
            sfsf.cretrieve(that.options.dirPath, function(error, dirEntry) {
                if(error){
                    console.log(error);
                    alert("File System Error: " + error.target.error.code);
                    return;
                }
                sfsf.readEntriesWithMetadata(dirEntry, function (error, entries){
                    if(error){
                        console.log(error);
                        alert("Could not get metadata");
                        return;
                    }
                    console.log('resetting entries');
                    console.log(entries);
                    //The map function is used to convert the EntryList object into a normal array.
                    that.collection['reset'](_.map(entries, function(entry){ return entry; }));
                    that.render();
                });
            });
            
            return this;
        }
    });
    
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
            '': 'main',
			'listFiles': 'listFiles'
		},
        main: function(params){
            console.log('main');
            $("#container").html(mainTemplate());
            //this.navigate('listFiles', {trigger: true, replace: true});
        },
		listFiles: function(page, params){
            console.log('params:');
            console.log(params);
            if(!params) {
                params = {};
            }
            params = _.extend({
                "dirPath" : ""
            }, params);
            
            var myDirView = new DirView({
                collection: new Backbone.Collection(),
                dirPath: params.dirPath
            });
            myDirView.setElement(document.getElementById("container"));
            myDirView.refresh();
		}
	});
	return Router;
});
