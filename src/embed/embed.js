/**
@name glow.embed
@namespace
@description Detect and embed Flash objects
@see <a href="../furtherinfo/embed/">Flash embedding</a>
*/
(window.gloader || glow).module({
	name: "glow.embed",
	library: ["glow", "@VERSION@"],
	depends: [["glow", "@VERSION@", "glow.dom", "glow.data"]],
	builder: function(glow) {


		/**
		@name to_attributes
		@private
		@function
		@param object
		@returns attribute string suitable for inclusion within Flash embed/object tag
		@description converts a hash to a space delimited string of attribute assignments

			Simple values are assumed for the object properties, with the exception of
			'flashVars' which is treated as a special case. If 'flashVars' is itself an object,
			it will be serialised in querystring format.
			returns string representation of object as attribute assignments eg:
			{id:"myId",name:"my-name"}  becomes  'id="myId" name="my-name"'

		*/
		function to_attributes(object){

			var attributes = "";

			for (var $param in object){
				if ($param.toLowerCase() == "flashvars" && typeof object[$param] == "object"){
					attributes += ' FlashVars="' + glow.data.encodeUrl(object[$param]) + '"';
				}
				else {
					attributes += ' ' + $param + '="' + object[$param] + '"';
				}
			}
			return attributes;
		}

		/**
		@name toParams
		@private
		@function
		@param object
		@returns string of param tags or an object element
		@description converts a hash to a string of param tags

			Simple values are assumed for the object properties, with the exception of
			'flashVars' which is treated as a special case. If 'flashVars' is itself an object,
			it will be serialised in querystring format.
		*/
		function toParams(object) {
			var r = "",
				key,
				value;

			for (key in object) {
				if (key.toLowerCase() == "flashvars" && typeof object[key] == "object"){
					value = glow.data.encodeUrl(object[key]);
				} else {
					value = object[key];
				}

				r += '<param name="' + key + '" value="' + value + '" />\n';
			}
			return r;
		}

		/**
		@name _set_defaults
		@private
		@function
		@param target
		@param options
		@returns
		@description applies a hash of default property values to a target object

			Properties on the defaults object are copied to the target object if no such property is present.

		*/
		function _set_defaults(target,defaults){
			target = target || {};

			for (var param in defaults) {
				if (typeof target[param] == "undefined") {
					// is it safe to assign an object reference or should it be cloned ?
					target[param] = defaults[param];
				}
				else if (typeof defaults[param] == "object") {
					target[param] = _set_defaults(target[param],defaults[param]);
				}
			}

			return target;
		}

		/**
		 @name _platform
		 @private
		 @returns {string} 'win' or 'mac' or 'other'
		 @description identify the operating system
		 */
		function _platform(){
			var platform = (navigator.platform || navigator.userAgent);
			return platform.match(/win/i) ? "win" : platform.match(/mac/i) ? "mac" : "other";
		}

		/**
		@name _askFlashPlayerForVersion
		@private
		@function
		@param {Shockwave.Flash} flash_player a reference to an ActiveX Shockwave Flash player object
		@returns version object with structure: {major:n,minor:n,release:n,actual:"string"}
		@description returns flash_player version, as reported by the GetVariable("$version") method
		*/
		function _askFlashPlayerForVersion(flash_player){

			var $regexFLASH_VERSION = /^WIN (\d+),(\d+),(\d+),\d+$/;
			var $version = flash_player.GetVariable("$version");
			if ($match = $regexFLASH_VERSION.exec($version)){
				return {
					major 	: parseInt($match[1]),
					minor 	: parseInt($match[2]),
					release	: parseInt($match[3]),
					actual	: $version
				};
			}
			else {
				// throw an exception, something very strange going on if flash player returns version in any other format ?

			}
		}

		/**
		@name _getFlashPlayerVersion
		@private
		@function
		@returns version object with structure: {major:n,minor:n,release:n,actual:"string"}
		@description returns flash_player version

			Query installed Flash player version, using either ActiveX object creation (for Internet Explorer) or
			navigator plugins collection.

		*/
		function _getFlashPlayerVersion(){
			var $match, flash_player, NO_FLASH = {major : 0, minor : 0, release : 0}, result = NO_FLASH;
			
			if (glow.env.ie){
				try {
					flash_player = new ActiveXObject("ShockwaveFlash.ShockwaveFlash.7");
					result = _askFlashPlayerForVersion(flash_player);
				}
				catch(e){
					// Version 6 needs kid-glove treatment as releases 21 thru 29 crash if GetVariable("$version") is called
					try {
						flash_player = new ActiveXObject("ShockwaveFlash.ShockwaveFlash.6");
						try {
							// This works from release 47 onward...(first public release after 29)
							flash_player.AllowScriptAccess = "always";
							result = _askFlashPlayerForVersion(flash_player);
						}
						catch(e){
							// we cannot safely test between releases 21...29, so assume the latest and hope for the best...
							result = {major:6,minor:0,release:29};
						}
					}
					catch (e){
						// nothing more we can do, either no flash installed, flash player version is ancient or ActiveX is disabled
					}
				}
			}
			else {
				var regexFLASH_VERSION = /^Shockwave Flash\s*(\d+)\.(\d+)\s*\w(\d+)$/;

				if ((flash_player = navigator.plugins["Shockwave Flash"]) && ($match = regexFLASH_VERSION.exec(flash_player.description))){
					result = {
						major 	: parseInt($match[1]),
						minor 	: parseInt($match[2]),
						release	: parseInt($match[3]),
						actual	: flash_player.description
					};
				}
			}

			result.toString = function(){return this.major ? [this.major,this.minor,this.release].join(".") : "No flash player installed, or version is pre 6.0.0"};

			return result;

		}

		/**
		 @name installed_flash_player
		 @private
		 @description version of installed Flash player, initialised at startup.
		 */
		var installed_flash_player = _getFlashPlayerVersion();


		/**
		@name _meetsVersionRequirements
		@private
		@function
		@param {string|object} requiredVersion string or version object

		 	major version must be specified. minor version is optional. release is optional, but both major and
		 	minor versions must also be supplied if release is specified.
		 	eg, as string:  "9.0.0",  "9.1",  "9"
		 	or, as object:  {major:9,minor:0,release:0},  {major:9,minor:0}, {major:9}

		@returns {boolean}.
		@description returns true if installed Flash player version meets requested version requirements

		*/
		function _meetsVersionRequirements(requiredVersion){

			if (typeof requiredVersion != "object"){
				var match = String(requiredVersion).match(/^(\d+)(?:\.(\d+)(?:\.(\d+))?)?$/);
				if (!match){
					throw new Error('glow.embed._meetsVersionRequirements: invalid format for version string, require "n.n.n" or "n.n" or simply "n" where n is a numeric value');
				}

				requiredVersion = {
					major   : parseInt(match[1],10),
					minor   : parseInt(match[2]||0,10),
					release : parseInt(match[3]||0,10)
				}
			}

			var v = installed_flash_player, rv = requiredVersion;

			// return true if we meet the minimum version requirement...
			return (v.major > rv.major ||
			   (v.major == rv.major && v.minor > rv.minor) ||
			   (v.major == rv.major && v.minor == rv.minor && v.release >= rv.release));

		}

		/**
		@name _wrap_embedding_tag
		@private
		@function
		@param {string} src
		@param {object} attributes Hash of attributes to be included
		@param {string} params Hash of params to be included. These will be included as attributes for all but IE
		@returns {string} object or embed tag
		@description returns a complete object or embed tag, as appropriate (ie browser dependent)
		*/
		var _wrap_embedding_tag = glow.env.ie ? _wrap_object_tag : _wrap_embed_tag;
		function _wrap_embed_tag(src, attributes, params){
			return '<embed type="application/x-shockwave-flash" src="' + src + '"' + to_attributes(attributes) + to_attributes(params) + '></embed>';
		}
		function _wrap_object_tag(src, attributes, params){
			return '<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" ' + to_attributes(attributes) + '><param name="movie" value="' + src + '" />' + toParams(params) + '</object>';
		}

		var r = {},
			idIndex = 0; // Used with private function _getId()

		/**
		@name _getId()
		@private
		@function
		@returns {string} unique string to use for id of a flash object
		@description Returns a unique to the page string to use for the id of the flash object.  This function ensures that all flash objects embedded into the page get an id.
		*/
		function _getId() {
			return glow.UID + "FlashEmbed" + (idIndex++);
		}

		/**
		@name glow.embed.Flash
		@class
		@description A wrapper for a Flash movie so it can be embedded into a page
		@see <a href="../furtherinfo/embed/">Flash embedding</a>

		@param {String} src Absolute or relative URL of a Flash movie file to embed
		@param {selector | glow.dom.NodeList} container The element to embed the movie into

			<p>If a CSS selector is provided then the first matching element is used as the
			container.</p>

		   	<p>If the parameter is a {@link glow.dom.NodeList}, then the first
		   	element of the list is used as the container.</p>

		@param {String|Object} minVersion The minimum required version of the Flash plugin.

			<p>The Flash plugin has a version numbering scheme comprising of  major, minor and
			release numbers.</p>

			<p>This param can be a string with the major number only, major plus minor numbers, or
			full three-part version number, e.g. "9",  "9.1" , "6.0.55" are all valid values.</p>

			<p>If minVersion is set as an object, it must use a similar structure to the object
			returned by the {@link glow.embed.Flash#version} method, e.g: <code>{major: 9, minor:0,
			release:0}</code>.</p>

		@param {Object} [opts]

			Hash of optional parameters.

			@param {String} [opts.width] Width of the Flash movie. Defaults to "100%"
			@param {String} [opts.height] Height of the Flash movie. Defaults to "100%"
			@param {String} [opts.id] Unique id to be assigned to Flash movie instance.
			@param {String} [opts.className] CSS class to be assigned to the embedding element.
			@param {Object} [opts.attributes] A hash of attributes to assign to the embedded element tag.
			@param {Object} [opts.params] A hash of optional Flash-specific parameters.
				For example quality, wmode, bgcolor, flashvars.
		 	@param {String|Function} [opts.message] Error handling message or function.

		 		A message to display in the event that the Flash player is either not
		 		installed or is an earlier version than the specified minVersion. This message will
		 		be written into the container element instead of the Flash movie.

		 		If a function is supplied, it will be invoked and any return value will be used
		 		as the message to write into the container.

		 	@example
				var myFlash = new glow.embed.Flash("/path/to/flash.swf", "#flashContainer", "9");

			@example
				var myFlash = new glow.embed.Flash("/path/to/flash.swf", "#flashContainer", "9", {
					width: "400px",
					height: "300px"
				});

			@example
				var myFlash = new glow.embed.Flash("/path/to/flash.swf", "#flashContainer", "9", {
					width: "400px",
					height: "300px",
					params: {
						wmode: "transparent",
						flashvars: {
							navColour: "red",
							username: "Frankie"
						}
					}
				});
		 */
		r.Flash = function(src, container, minVersion, opts){

			opts = _set_defaults(opts,{
					width	: "100%",
					height	: "100%",
					params  : {
						allowscriptaccess	: "always",
						allowfullscreen		: "true",
						quality				: "high"
					},
					attributes : {},
					//expressInstall : false, // TODO add this in a later release
					message : "This content requires Flash Player version " + minVersion + " (installed version: " + installed_flash_player + ")",
					id : _getId() // Fix for trac 165
				}
			);

			/**
			 @name glow.embed.Flash#container
			 @type glow.dom.NodeList
			 @description The element containing the embedded movie.
			 */
			container = glow.dom.get(container);
			if (!container.length){
				throw new Error("glow.embed.Flash unable to locate container");
			}
			this.container = container;

			//this.expressInstall = opts.expressInstall; // TODO add this in a later release

			/**
			 @name glow.embed.Flash#movie
			 @type Shockwave.Flash
			 @description A reference to the actual Flash movie, for direct script access.
			 @example
				myFlash.movie.exposedFlashMethod();
			 */
			this.movie = null;

			this._displayErrorMessage = typeof opts.message == "function" ? opts.message : function(){return opts.message};

			this.isSupported;

			// Check that the min version requirement is satisfied and store this status, so we don't later try to embed the thing
			// if we don't can't meet the version requirements.

			if (this.isSupported = _meetsVersionRequirements(minVersion)){
				var attrs = opts.attributes,
					overwrites = ["id", "width", "height"],
					i = overwrites.length;

				// copies stuff like opts.id to attr.id
				while (i--) {
					if (opts[overwrites[i]]) { attrs[overwrites[i]] = opts[overwrites[i]]; }
				}

				if (opts.className) { attrs["class"] = opts.className; }
				this._embed_tag = _wrap_embedding_tag(src, attrs, opts.params);
			}
			/*
			else if (this.expressInstall && _meetsVersionRequirements("6.0.65") && _platform().match(/^win|mac$/)) {

				// Callback to be invokes in case of express install error
				window[glow.UID + "flashExpressInstallCancelled"] = function(){
					alert("Flash update cancelled");
				}
				window[glow.UID + "flashExpressInstallFailed"] = function(){
					alert("Unable to complete update, please go to adobe.com...");
				}
				window[glow.UID + "flashExpressInstallComplete"] = function(){

					alert("New version of flash installed");

				}

				new glow.embed.Flash("expressInstall.swf",
					this.container,
					"6.0.65", {
					//TODO check minimum width/height
						width:opts.width,
						height:opts.height,
						params : {
							flashVars : {
								MMredirectURL :  window.location.toString(),
								MMplayerType : glow.env.ie ? "ActiveX" : "PlugIn",
								MMdoctitle : document.title,
								GlowCallback : glow.UID + "flashExpressInstall"
							}
						}
					}
				).embed();

				this.expressInstalling = true;
			}*/
		};

		/**
		 @name glow.embed.Flash.version
		 @function
		 @description Get details of the current users Flash plugin
		 @returns An object with details of the currently installed Flash plugin.

		 	<dl>
		 		<dt>major (number)</dt><dd>Flash player major version mumber</dd>
		 		<dt>minor (number)</dt><dd>Flash player minor version mumber.</dd>
		 		<dt>release (number)</dt><dd>Flash player release version mumber.</dd>
		 		<dt>actual (string)</dt><dd>The Flash version exactly as reported by the Flash player.</dd>
		 		<dt>toString (function)</dt><dd>toString implementation in the form "major.minor.release" Eg "9.0.2"</dd>
		 	</dl>

		@example
			var version = glow.embed.Flash.version();
			alert("curr = " + version.major) // "curr = 9"
			alert("curr = " + version) // "curr = 9.0.2"
		 */
		r.Flash.version = function(){
			return installed_flash_player;
		};

		/**
		 @name glow.embed.Flash#embed
		 @function
		 @description Embed the Flash movie into the document
		 @returns {glow.embed.Flash}

		 @example
		 	var myFlash = new glow.embed.Flash(...);
		 	myFlash.embed();
		*/
		r.Flash.prototype.embed = function(){
			var containerElm = this.container[0];
			if (this.isSupported){

				containerElm.innerHTML = this._embed_tag;

				this.movie = containerElm.firstChild;

			}/*
			else if (this.expressInstalling){
				// wait for expressInstall to complete

			}*/
			else {
				var message = this._displayErrorMessage();
				if (message){
					containerElm.innerHTML = message;
				}
			}

			return this;

		};

		glow.embed = r;

	}
});
