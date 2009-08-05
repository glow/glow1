var srcLoader;

(function() {
	/**
	 @name moduleList
	 @description List of all modules.
		In the order they must be loaded in. Update this as new modules
		are added to glow. If any of these modules other than glow.widgets 
		need CSS, you'll need to edit createGlowMap as well
	*/
	var moduleList = [
		"glow",
		"glow.dom",
		"glow.events",
		"glow.data",
		"glow.net",
		"glow.tweens",
		"glow.anim",
		"glow.dragdrop",
		"glow.i18n",
		"glow.embed",
		"glow.forms",
		"glow.widgets",
		"glow.widgets.Mask",
		"glow.widgets.Overlay",
		"glow.widgets.Panel",
		"glow.widgets.InfoPanel",
		"glow.widgets.Sortable",
		"glow.widgets.Slider",
		"glow.widgets.AutoSuggest",
		"glow.widgets.AutoComplete",
		"glow.widgets.Carousel",
		"glow.widgets.Timetable",
		"glow.widgets.Editor"
	];
	
	/**
	 @name cssList
	 @description CSS Files to load
	*/
	var cssList = [
		"{$base}/widgets/widgets.css"
	];
	
	/**
	 @name autoRoot
	 @description A calculated root folder for glow
	*/
	var autoRoot = (function() {
		var lastElm = (document.body || document.getElementsByTagName("head")[0]).lastChild;
		
		return (lastElm.src || "").replace(/srcloader\/srcloader\.js$/, "");
	})();
	
	
	/**
	 @name createGlowMap
	 @private
	 @function
	 @param {String} root Relative path to the root of the trunk / branch / tag
	
	 @description Create a gloader map to glow within SVN
	
	 @example
		gloader.map.add("glow", createGlowMap("../../"));
	*/
	var createGlowMap = function(root) {
		
		// add a trailing slash if we need to
		if (root.slice(-1) != "/") {
			root += "/";
		}
		
		var r = {
			$version: "@VERSION@",
			$base: root + "src",
			$server: "",
			"glow": "{$base}/glow/glow.js"
		};
	
		var i, len, modulePath, moduleSplit;
	
		//we miss out the 0th index as its path is in a different format to the others
		for (i = 1, len = moduleList.length; i < len; i++) {
			modulePath = "{$base}/";
			moduleSplit = moduleList[i].split(".").slice(1);
			modulePath += moduleSplit.join("/") + "/" + moduleSplit[moduleSplit.length-1] + ".js";
			r[moduleList[i]] = modulePath.toLowerCase();
		}
	
		// now let's sort out the modules with CSS files
		r["glow.widgets"] = [r["glow.widgets"]].concat(cssList);
	
		return r;
	}
	
	/**
	 @name srcLoader
	 @function
	
	 
	 @param {Object} opts An object containing any of the following:
		@param {Object} opts.path Path to the root of the trunk / branch / tag.
			This is worked out automatically, you should only need to set this
			manually if you have included srcloader.js in an asynchronous way
		@param {String} [opts.loadMethod='gloaderSyncNoCallback'] How to load the assets.
			'gloaderSyncNoCallback' (but you can still use opts.onLoad here)
			'gloaderSyncCallback'
			'gloaderAsync'
			
			If gloader isn't present on the page, it won't be used, glow will be
			included by document.write'ing script tags
			
		@param {String} [opts.modules] Glow modules to load. The order is important
			Eg: ["glow", "glow.dom", "glow.events"]. All modules will be loaded by
			default
		@param {Function} [opts.onLoad] Callback to run when loading is complete.
			Glow will be passed in as the first param
	
	 @description Loads unbuilt glow modules (checked out copies).
		Note that this function does not resolve dependencies unless you are using gloader,
		ensure you include the full list of modules you need.
	
	*/
	
	srcLoader = (function() {
		var ua = navigator.userAgent.toLowerCase();
		var isIE = /msie/i.test(ua) && !(/opera/.test(ua));
		var emptyFunc = function() {};
	
		function runAfterLastScript(callback) {
			//ie runs document written inline scripts before external script, pah!
			if (isIE) {
				// we may be looking for script tags in the head or the body
				var headOrBody = document.body || document.getElementsByTagName("head")[0];
				allScripts = headOrBody.getElementsByTagName("script");
				allScripts[allScripts.length - 1].onreadystatechange = function() {
					if (/^(?:loaded|complete)$/.test(this.readyState)) {
						callback(glow);
					}
				}
			} else {
				(window.__cb || (window.__cb = [])).push(callback);
				document.write('<' + 'script type="text/javascript">__cb[' + (__cb.length - 1) + '](glow)<' + '/script>');
			}
		}
	
		return function(opts) {
			opts = opts || {};
			
			if (opts.loadMethod && !window.gloader) {
				throw new Error("Cannot find gloader, cannot use load method: " + opts.loadMethod);
			}
			
			//set up defaults
			opts = {
				loadMethod: opts.loadMethod || "gloaderSyncNoCallback",
				onLoad: opts.onLoad || emptyFunc,
				modules: opts.modules || moduleList,
				path: opts.path || autoRoot
			};
	
			var i = 0,
				modules = opts.modules,
				modulesLen = modules.length,
				toLoad,
				path = opts.path,
				map = createGlowMap(path),
				linkElm,
				head = document.getElementsByTagName("head")[0];
			
			
			// if gloader isn't around, we need to do things our own special way *sobs*
			if (!window.gloader) {
				
				for (; i < modulesLen; i++) {
					toLoad = map[modules[i]];
					//have we found a path?
					if (!toLoad) {
						throw new Error("Module " + modules[i] + " not found in map");
					}
					//is it an array?
					if (toLoad.push) {
						//ok, we're going to assume the other files are CSS files
						for (var j = 1, toLoadLen = toLoad.length; j < toLoadLen; j++) {
							//resolve the base paths
							if (document.body) {
								linkElm = document.createElement("link");
								linkElm.type = "text/css";
								linkElm.rel = "stylesheet";
								linkElm.href = toLoad[j].replace(/\{\$base\}/g, map.$base);
								head.appendChild(linkElm);
							} else {
								document.write('<' + 'link type="text/css" rel="Stylesheet" href="' + toLoad[j].replace(/\{\$base\}/g, map.$base) + '"/>');
							}
						}
						//right, now we just want to deal with the js
						toLoad = toLoad[0];
					}
	
					//is it already loaded?
					if (srcLoader.loaded[toLoad]) { continue };
	
					//write it
					document.write('<' + 'script type="text/javascript" src="' + toLoad.replace(/\{\$base\}/g, map.$base) + '"><' + '/script>');
					srcLoader.loaded[toLoad] = true;
				}
	
				//run callback after scripts have processed
				if (opts.onLoad != emptyFunc) {
					runAfterLastScript(opts.onLoad);
				}
			} else {
	
				//add map
				gloader.map.add("glow", map);
	
				//create the options object for gloader
				//do we want it to be async?
				var gloaderOpts = {
					async: (opts.loadMethod == 'gloaderAsync')
				}
				//do we want to use a callback?
				if (opts.loadMethod != 'gloaderSyncNoCallback') {
					gloaderOpts.onLoad = opts.onLoad;
				}
				gloader.load(["glow", "@VERSION@"].concat(modules), gloaderOpts);
	
				//if we didn't use a callback in gloader...
				if (!gloaderOpts.onLoad) {
					//run callback after scripts have processed
					runAfterLastScript(opts.onLoad);
				}
			}
		};
	})();
	srcLoader.createGlowMap = createGlowMap;
	srcLoader.loaded = {};

})();