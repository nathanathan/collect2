'use strict';
// depends upon: --
// NOTE: builder.js sets controller.prompts property.
define(['screenManager','opendatakit','parsequery','database'], function(ScreenManager,opendatakit,parsequery,database) {
return {
    screenManager : null,
    previousScreenIndices : [],
    gotoPreviousScreen: function(){
        var that = this;
        var screenManager = this.screenManager;
        screenManager.validate(true, {
            success: function() {
                while (that.hasPromptHistory()) {
                    console.log("gotoPreviousPrompt: poppreviousScreenNames ms: " + (+new Date()) + 
								" page: " + screenManager.prompt.promptIdx);
					var prmpt = that.getPromptByName(that.previousScreenIndices.pop(), {reverse:true});
					var t = prmpt.type;
					if ( t == "goto_if" || t == "goto" || t == "label" || t == "calculate" ) {
                        console.error("Invalid previous prompt type");
                        console.log(prmpt);
					}
					that.setPrompt(prmpt, {reverse:true});
					return;
                }

				alert("I've forgotten what the previous page was!");
				console.log("gotoPreviousPrompt: noPreviousPage ms: " + (+new Date()) + 
							" page: " + screenManager.prompt.promptIdx);
            },
            failure: function(missingValue) {
                console.log("gotoPreviousPrompt: validationFailed ms: " + (+new Date()) +
							" page: " + screenManager.prompt.promptIdx);
                if ( missingValue ) {
                    screenManager.requiredFieldMissingAction();
                } else {
                    screenManager.validationFailedAction();
                }
                return;
            }
        });
    },
    gotoNextScreen: function(options){
        var that = this;
        var screenManager = this.screenManager;
        screenManager.validate(false, {
            success: function(){
                screenManager.computeNextPrompt(function(nextPrompt){
                    if(nextPrompt){
                        console.log("gotoNextPrompt: nextPrompt ms: " + (+new Date()) + 
						" page: " +	screenManager.prompt.promptIdx);
                        that.gotoPromptName(nextPrompt, options);
                    } else {
                        alert(screenManager.noNextPageMessage);
                        console.log("gotoNextPrompt: noNextPage ms: " + (+new Date()) +
						" page: " + screenManager.prompt.promptIdx);
                    }
                });
            },
            failure: function(){
                screenManager.validationFailedAction();
                console.log("gotoNextPrompt: validationFailed ms: " + (+new Date()) +
					" page: " + screenManager.prompt.promptIdx);
                return;
            }
        });
    },
    getPromptByName: function(name){
		if ( name == null ) return null;
		if ( ('' + name).match(/^\d+$/g) ) {
			var idx = Number(name);
			if(idx >= 0 && idx < this.prompts.length){
				return this.prompts[idx];
			}
        }
        for(var i = 0; i < this.prompts.length; i++){
            var promptName = this.prompts[i].name;
            if(promptName == name){
                return this.prompts[i];
            }
        }
        alert("Unable to find screen: " + name);
        return null;
    },
    getLabel: function(name){
        var prompts = this.prompts;
        for(var i = 0; i < prompts.length; i++){
            if(prompts[i].type !== 'label') continue;
            if(prompts[i].param === name){
                return prompts[i];
            }
        }
        alert("Unable to find label: " + name);
        return null;
    },
    setPrompt: function(prompt, jqmAttrs){
        console.log('setPrompt');
        console.log(prompt);
        this.screenManager.setPrompt(prompt, jqmAttrs);
		// goto_if, goto, and label statements may change the prompt!
		var idx = this.screenManager.prompt.promptIdx;
		var newhash = opendatakit.getHashString(database.getMetaDataValue('formPath'),
					database.getMetaDataValue('instanceId'), ''+idx);
		if ( newhash != window.location.hash ) {
			window.location.hash = newhash;
		}
    },
    hasPromptHistory: function() {
        return (this.previousScreenIndices.length !== 0);
    },
    clearPromptHistory: function() {
        this.previousScreenIndices.length = 0;
    },
    gotoPrompt: function(prompt, passedInOptions){
        var options = {
            omitPushOnReturnStack : false
        };
        if(passedInOptions){
            $.extend(options, passedInOptions);
        }
        var that = this;
        if ( this.screenManager == null ) {
			this.screenManager = new ScreenManager(this);
		}
        that.screenManager.beforeMove(function(){
            if (options.omitPushOnReturnStack) {
                that.setPrompt(prompt);
            } else {
                // push this prompt onto the return stack only if it has a name...
				var prmpt = that.screenManager.prompt;
                var idx = (prmpt != null) ? prmpt.promptIdx : null;
                if ( idx != null ) {
					that.previousScreenIndices.push(idx);
                }
                that.setPrompt(prompt);
            }
        });
    },
    gotoLabel: function(name, options){
        this.gotoPrompt(this.getLabel(name), options);
    },
    gotoPromptName: function(name, options){
        var prompt = this.getPromptByName(name);
        if ( prompt == null ) {
            this.gotoPrompt(this.prompts[0], options);
        } else {
            this.gotoPrompt(prompt, options);
        }
    },
    /*
     * Callback interface from ODK Collect into javascript.
     * Handles all dispatching back into javascript from external intents
    */
    opendatakitCallback:function(page, path, action, jsonString) {
        var selpage = this.getPromptByName(page);
        if ( selpage == null ) {
            console.log("opendatakitCallback: ERROR - PAGE NOT FOUND! " + page + " path: " + path + " action: " + action );
            return;
        }
        var handler = selpage.getCallback(path, action);
        if ( handler != null ) {
            handler( path, action, jsonString );
        } else {
            console.log("opendatakitCallback: ERROR - NO HANDLER ON PAGE! " + page + " path: " + path + " action: " + action );
            return;
        }
    },
    /*
     * window.location.hash is an ampersand-separated list of 
	 * key=value pairs. The key and value are escaped.
	 * The main values are:
	 *    formPath=relative path from the collect/index.html to 
	 *             the form definition directory (formPath/formDef.json).
	 *             The name of the directory containing the formDef.json 
	 *             is the formId-formVersion of this form.
	 *
	 *    instanceId=unique id for this filled-in form instance.
	 *
	 *    pathRef=concatenation of promptIdx and other data used
	 *            when rendering a screen.
	 * 
     */
    odkHashChangeHandler:function(e) {
		if ( window.location.hash == '#' ) {
			// this is bogus transition due to jquery mobile widgets
			e.stopPropagation();
			return;
		}
		var params = window.location.hash.slice(1).split("&");
		var formPath = null;
		var instanceId = null;
		var pageRef = null;
		for (var i = 0; i < params.length; i++)
		{
			var tmp = params[i].split("=");
			var key = tmp[0];
			var value = unescape(tmp[1]);
			if ( key == 'formPath' ) {
				formPath = value;
			} else if ( key == 'instanceId' ) {
				instanceId = value;
			} else if ( key == 'pageRef' ) {
				pageRef = value;
			}
		}
		if ( formPath != database.getMetaDataValue('formPath') || instanceId != database.getMetaDataValue('instanceId') ) {
			// this should trigger a hash-change action
			parsequery.parseQueryParameters(window.updateScreen);
			return;
		}
		
		this.gotoRef(pageRef);
	},
	gotoRef:function(pageRef) {
		if ( pageRef == null ) {
			pageRef = '0';
		}
		// process the pageRef... -- each part is separated by slashes
        var hlist = pageRef.split('/');
        var hleading = hlist[0];

		var prmpt; 
		if ( hleading != null ) {
			prmpt = this.getPromptByName(hleading);
			if ( prmpt == null ) {
				prmpt = this.prompts[0];
				hlist = [];
			}
		} else {
			prmpt = this.prompts[0];
			hlist = [];
		}

		if (  this.screenManager == null || prmpt !== this.screenManager.prompt ) {
			this.gotoPrompt(prmpt, { hlist : hlist });
		}
    }
}
});