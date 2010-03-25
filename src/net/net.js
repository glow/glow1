/**
@name glow.net
@namespace
@description Sending data to & from the server
@see <a href="../furtherinfo/net/net.shtml">Using glow.net</a>
*/
(window.gloader || glow).module({
	name: "glow.net",
	library: ["glow", "@VERSION@"],
	depends: [["glow", "@VERSION@", "glow.data", "glow.events"]],
	builder: function(glow) {
		//private

		var STR = {
				XML_ERR:"Cannot get response as XML, check the mime type of the data",
				POST_DEFAULT_CONTENT_TYPE:'application/x-www-form-urlencoded;'
			},
			endsPlusXml = /\+xml$/,
			/**
			 * @name glow.net.scriptElements
			 * @private
			 * @description Script elements that have been added via {@link glow.net.loadScript loadScript}
			 * @type Array
			 */
			scriptElements = [],
			/**
			 * @name glow.net.callbackPrefix
			 * @private
			 * @description Callbacks in _jsonCbs will be named this + a number
			 * @type String
			 */
			callbackPrefix = "c",
			/**
			 * @name glow.net.globalObjectName
			 * @private
			 * @description Name of the global object used to store loadScript callbacks
			 * @type String
			 */
			globalObjectName = "_" + glow.UID + "loadScriptCbs",
			$ = glow.dom.get,
			events = glow.events,
			emptyFunc = function(){},
			idCount = 1;

		/**
		 * @name glow.net.xmlHTTPRequest
		 * @private
		 * @function
		 * @description Creates an xmlHTTPRequest transport
		 * @returns Object
		 */
		function xmlHTTPRequest() {
			//try IE first. IE7's xmlhttprequest and XMLHTTP6 are broken. Avoid avoid avoid!
			if (window.ActiveXObject) {
				return (xmlHTTPRequest = function() { return new ActiveXObject("Microsoft.XMLHTTP"); })();
			} else {
				return (xmlHTTPRequest = function() { return new XMLHttpRequest(); })();
			}
		}

		/**
		 * @name glow.net.populateOptions
		 * @private
		 * @function
		 * @description Adds defaults to get / post option object
		 * @param {Object} opts Object to add defaults to
		 * @returns Object
		 */
		function populateOptions(opts) {
			var newOpts = glow.lang.apply({
				onLoad: emptyFunc,
				onError: emptyFunc,
				onAbort: emptyFunc,
				headers: {},
				async: true,
				useCache: false,
				data: null,
				defer: false,
				forceXml: false
			}, opts || {} );
			
			// add requested with header if one hasn't been added
			if ( !('X-Requested-With' in newOpts.headers) ) {
				newOpts.headers['X-Requested-With'] = 'XMLHttpRequest';
			}
			return newOpts;
		}

		/*
		PrivateMethod: noCacheUrl
			Adds random numbers to the querystring of a url so the browser doesn't use a cached version
		*/

		function noCacheUrl(url) {
			return [url, (/\?/.test(url) ? "&" : "?"), "a", new Date().getTime(), parseInt(Math.random()*100000)].join("");
		}

		/*
		PrivateMethod: makeXhrRequest
			Makes an http request
		*/
		/**
		 * @name glow.net.makeXhrRequest
		 * @private
		 * @function
		 * @description Makes an xhr http request
		 * @param {String} method HTTP Method
		 * @param {String} url URL of the request
		 * @param {Object} Options, see options for {@link glow.net.get}
		 * @returns Object
		 */
		function makeXhrRequest(method, url, opts) {
			var req = xmlHTTPRequest(), //request object
				data = opts.data && (typeof opts.data == "string" ? opts.data : glow.data.encodeUrl(opts.data)),
				i,
				request = new Request(req, opts);

			if (!opts.useCache) {
				url = noCacheUrl(url);
			}

			//open needs to go first to maintain cross-browser support for readystates
			req.open(method, url, opts.async);

			//add custom headers
			for (i in opts.headers) {
				req.setRequestHeader(i, opts.headers[i]);
			}

			function send() {
				request.send = emptyFunc;
				if (opts.async) {
					//sort out the timeout if there is one
					if (opts.timeout) {
						request._timeout = setTimeout(function() {
							abortRequest(request);
							var response = new Response(req, true, request);
							events.fire(request, "error", response);
						}, opts.timeout * 1000);
					}

					req.onreadystatechange = function() {
						if (req.readyState == 4) {
							//clear the timeout
							request._timeout && clearTimeout(request._timeout);
							//set as completed
							request.completed = true;
							var response = new Response(req, false, request);
							if (response.wasSuccessful) {
								events.fire(request, "load", response);
							} else {
								events.fire(request, "error", response);
							}
							// prevent parent scopes leaking (cross-page) in IE
							req.onreadystatechange = new Function();
						}
					};
					req.send(data);
					return request;
				} else {
					req.send(data);
					request.completed = true;
					var response = new Response(req, false, request);
					if (response.wasSuccessful) {
						events.fire(request, "load", response);
					} else {
						events.fire(request, "error", response);
					}
					return response;
				}
			}

			request.send = send;
			return opts.defer ? request : send();
		}

		//public
		var r = {}; //the module

		/**
		@name glow.net.get
		@function
		@description Makes an HTTP GET request to a given url

		@param {String} url
			Url to make the request to. This can be a relative path. You cannot make requests
			for files on other domains, to do that you must put your data in a javascript
			file and use {@link glow.net.loadScript} to fetch it.
		@param {Object} opts
			Options Object of options.
			@param {Function} [opts.onLoad] Callback to execute when the request has sucessfully loaded
				The callback is passed a Response object as its first parameter.
			@param {Function} [opts.onError] Callback to execute if the request was unsucessful
				The callback is passed a Response object as its first parameter.
				This callback will also be run if a request times out.
			@param {Function} [opts.onAbort] Callback to execute if the request is aborted
			@param {Object} [opts.headers] A hash of headers to send along with the request
				Eg {"Accept-Language": "en-gb"}
			@param {Boolean} [opts.async=true] Should the request be performed asynchronously?
			@param {Boolean} [opts.useCache=false] Allow a cached response
				If false, a random number is added to the query string to ensure a fresh version of the file is being fetched
			@param {Number} [opts.timeout] Time to allow for the request in seconds
				No timeout is set by default. Only applies for async requests. Once
				the time is reached, the error event will fire with a "408" status code.
			@param {Boolean} [opts.defer=false] Do not send the request straight away
				Deferred requests need to be triggered later using myRequest.send()
			@param {Boolean} [opts.forceXml=false] Treat the response as XML.
				This will allow you to use {@link glow.net.Response#xml response.xml()}
				even if the response has a non-XML mime type.

		@returns {glow.net.Request|glow.net.Response}
			A response object for non-defered sync requests, otherwise a
			request object is returned

		@example
			var request = glow.net.get("myFile.html", {
				onLoad: function(response) {
					alert("Got file:\n\n" + response.text());
				},
				onError: function(response) {
					alert("Error getting file: " + response.statusText());
				}
			});
		*/
		r.get = function(url, o) {
			o = populateOptions(o);
			return makeXhrRequest('GET', url, o);
		};

		/**
		@name glow.net.post
		@function
		@description Makes an HTTP POST request to a given url

		@param {String} url
			Url to make the request to. This can be a relative path. You cannot make requests
			for files on other domains, to do that you must put your data in a javascript
			file and use {@link glow.net.loadScript} to fetch it.
		@param {Object|String} data
			Data to post, either as a JSON-style object or a urlEncoded string
		@param {Object} opts
			Same options as {@link glow.net.get}

		@returns {glow.net.Request|glow.net.Response}
			A response object for non-defered sync requests, otherwise a
			request object is returned

		@example
			glow.net.post("myFile.html", {key:"value", otherkey:["value1", "value2"]}, {
				onLoad: function(response) {
					alert("Got file:\n\n" + response.text());
				},
				onError: function(response) {
					alert("Error getting file: " + response.statusText());
				}
			});
		*/
		r.post = function(url, data, o) {
			o = populateOptions(o);
			o.data = data;
			if (!o.headers["Content-Type"]) {
				o.headers["Content-Type"] = STR.POST_DEFAULT_CONTENT_TYPE;
			}
			return makeXhrRequest('POST', url, o);
		};

		/**
		@name glow.net.send
		@function
		@description Makes a custom HTTP request to a given url
			Not all HTTP verbs work cross-browser. Use {@link glow.net.get get},
			{@link glow.net.post post}, {@link glow.net.put put} or
			{@link glow.net.del del} for 'safe' methods.

		@param {String} method
			The HTTP method to use for the request. Methods are case sensitive
			in some browsers.
		@param {String} url
			Url to make the request to. This can be a relative path. You cannot make requests
			for files on other domains, to do that you must put your data in a javascript
			file and use {@link glow.net.loadScript} to fetch it.
		@param {Object|String} [data]
			Data to post, either as a JSON-style object or a urlEncoded string
		@param {Object} opts
			Same options as {@link glow.net.get}

		@returns {glow.net.Request|glow.net.Response}
			A response object for non-defered sync requests, otherwise a
			request object is returned

		@example
			glow.net.send('HEAD', 'myFile.html', null, {
				onLoad: function(response) {
					// ...
				}
			});
		*/
		r.send = function(method, url, data, o) {
			// Ensure that an empty body does not cause a 411 error.
			data = data || '';

			o = populateOptions(o);
			o.data = data;

			return makeXhrRequest(method, url, o);
		};

		/**
		@name glow.net.put
		@function
		@description Makes an HTTP PUT request to a given url

		@param {String} url
			Url to make the request to. This can be a relative path. You cannot make requests
			for files on other domains, to do that you must put your data in a javascript
			file and use {@link glow.net.loadScript} to fetch it.
		@param {Object|String} data
			Data to put, either as a JSON-style object or a urlEncoded string
		@param {Object} opts
			Same options as {@link glow.net.get}

		@returns {glow.net.Request|glow.net.Response}
			A response object for non-defered sync requests, otherwise a
			request object is returned

		@example
			glow.net.put("myFile.html", {key:"value", otherkey:["value1", "value2"]}, {
				onLoad: function(response) {
					alert("Got file:\n\n" + response.text());
				},
				onError: function(response) {
					alert("Error getting file: " + response.statusText());
				}
			});
		*/
		r.put = function(url, data, o) {
			o = populateOptions(o);
			o.data = data;
			if (!o.headers["Content-Type"]) {
				o.headers["Content-Type"] = STR.POST_DEFAULT_CONTENT_TYPE;
			}
			return makeXhrRequest('PUT', url, o);
		};

		/**
		@name glow.net.del
		@function
		@description Makes an HTTP DELETE request to a given url

		@param {String} url
			Url to make the request to. This can be a relative path. You cannot make requests
			for files on other domains, to do that you must put your data in a javascript
			file and use {@link glow.net.loadScript} to fetch it.
		@param {Object} opts
			Same options as {@link glow.net.get}

		@returns {glow.net.Request|glow.net.Response}
			A response object for non-defered sync requests, otherwise a
			request object is returned

		@example
			glow.net.del("myFile.html", {
				onLoad: function(response) {
					alert("Got file:\n\n" + response.text());
				},
				onError: function(response) {
					alert("Error getting file: " + response.statusText());
				}
			});
		*/
		r.del = function(url, o) {
			o = populateOptions(o);
			return makeXhrRequest('DELETE', url, o);
		};

		/**
		@name glow.net.loadScript
		@function
		@description Loads data by adding a script element to the end of the page
			This can be used cross domain, but should only be used with trusted
			sources as any javascript included in the script will be executed.

		@param {String} url
			Url of the script. Use "{callback}" in the querystring as the callback
			name if the data source supports it, then you can use the options below
		@param {Object} [opts]
			An object of options to use if "{callback}" is specified in the url.
			@param {Function} [opts.onLoad] Called when loadScript succeeds.
				The parameters are passed in by the external data source
			@param {Function} [opts.onError] Called on timeout
				No parameters are passed
			@param {Function} [opts.onAbort] Called if the request is aborted
			@param {Boolean} [opts.useCache=false] Allow a cached response
			@param {Number} [opts.timeout] Time to allow for the request in seconds
			@param {String} [opts.charset] Charset attribute value for the script

		@returns {glow.net.Request}

		@example
			glow.net.loadScript("http://www.server.com/json/tvshows.php?jsoncallback={callback}", {
				onLoad: function(data) {
					alert("Data loaded");
				}
			});
		*/
		r.loadScript = function(url, opts) {
			//id of the request
			var newIndex = scriptElements.length,
				//script element that gets inserted on the page
				script,
				//generated name of the callback, may not be used
				callbackName = callbackPrefix + newIndex,
				opts = populateOptions(opts),
				request = new Request(newIndex, opts),
				url = opts.useCache ? url : noCacheUrl(url),
				//the global property used to hide callbacks
				globalObject = window[globalObjectName] || (window[globalObjectName] = {});

			//assign onload
			if (opts.onLoad != emptyFunc) {
				globalObject[callbackName] = function() {
					//clear the timeout
					request._timeout && clearTimeout(request._timeout);
					//set as completed
					request.completed = true;
					// call the user's callback
					opts.onLoad.apply(this, arguments);
					// cleanup references to prevent leaks
					request.destroy();
					script = globalObject[callbackName] = undefined;
					delete globalObject[callbackName];
				};
				url = glow.lang.interpolate(url, {callback: globalObjectName + "." + callbackName});
			}

			script = scriptElements[newIndex] = document.createElement("script");

			if (opts.charset) {
				script.charset = opts.charset;
			}

			//add abort event
			events.addListener(request, "abort", opts.onAbort);

			glow.ready(function() {
				//sort out the timeout
				if (opts.timeout) {
					request._timeout = setTimeout(function() {
						abortRequest(request);
						opts.onError();
					}, opts.timeout * 1000);
				}
				//using setTimeout to stop Opera 9.0 - 9.26 from running the loaded script before other code
				//in the current script block
				if (glow.env.opera) {
					setTimeout(function() {
						if (script) { //script may have been removed already
							script.src = url;
						}
					}, 0);
				} else {
					script.src = url;
				}
				//add script to page
				document.body.appendChild(script);
			});

			return request;
		}

		/**
		 *	@name glow.net.abortRequest
		 *	@private
		 *	@function
		 *	@description Aborts the request
		 *		Doesn't trigger any events
		 *
		 *	@param {glow.net.Request} req Request Object
		 *	@returns this
		 */
		function abortRequest(req) {
			var nativeReq = req.nativeRequest,
				callbackIndex = req._callbackIndex;

			//clear timeout
			req._timeout && clearTimeout(req._timeout);
			//different if request came from loadScript
			if (nativeReq) {
				//clear listeners
				// prevent parent scopes leaking (cross-page) in IE
				nativeReq.onreadystatechange = new Function();
				nativeReq.abort();
			} else if (callbackIndex) {
				//clear callback
				window[globalObjectName][callbackPrefix + callbackIndex] = emptyFunc;
				//remove script element
				glow.dom.get(scriptElements[callbackIndex]).destroy();
			}
		}

		/**
		 * @name glow.net.Request
		 * @class
		 * @description Returned by {@link glow.net.post post}, {@link glow.net.get get} async requests and {@link glow.net.loadScript loadScript}
		 * @glowPrivateConstructor There is no direct constructor, since {@link glow.net.post post} and {@link glow.net.get get} create the instances.
		 */
		 
		/**
		 * @name glow.net.Request#event:load
		 * @event
		 * @param {glow.events.Event} event Event Object
		 * @description Fired when the request is sucessful
		 *   For a get / post request, this will be fired when request returns
		 *   with an HTTP code of 2xx. loadScript requests will fire 'load' only
		 *   if {callback} is used in the URL.
		 */
		 
		/**
		 * @name glow.net.Request#event:abort
		 * @event
		 * @param {glow.events.Event} event Event Object
		 * @description Fired when the request is aborted
		 *   If you cancel the default (eg, by returning false) the request
		 *   will continue.
		 * @description Returned by {@link glow.net.post glow.net.post}, {@link glow.net.get glow.net.get} async requests and {@link glow.net.loadScript glow.net.loadScript}
		 * @see <a href="../furtherinfo/net/net.shtml">Using glow.net</a>
		 * @glowPrivateConstructor There is no direct constructor, since {@link glow.net.post glow.net.post} and {@link glow.net.get glow.net.get} create the instances.
		 */
		 
		/**
		 * @name glow.net.Request#event:error
		 * @event
		 * @param {glow.events.Event} event Event Object
		 * @description Fired when the request is unsucessful
		 *   For a get/post request, this will be fired when request returns
		 *   with an HTTP code which isn't 2xx or the request times out. loadScript
		 *   calls will fire 'error' only if the request times out.
		 */
		 
		 
		/*
		 We don't want users to create instances of this class, so the constructor is documented
		 out of view of jsdoc

		 @param {Object} requestObj
			Object which represents the request type.
			For XHR requests it should be an XmlHttpRequest object, for loadScript
			requests it should be a number, the Index of the callback in glow.net._jsonCbs
		 @param {Object} opts
			Zero or more of the following as properties of an object:
			@param {Function} [opts.onLoad] Called when the request is sucessful
			@param {Function} [opts.onError] Called when a request is unsucessful
			@param {Function} [opts.onAbort] Called when a request is aborted

		*/
		function Request(requestObj, opts) {
			/**
			 * @name glow.net.Request#_timeout
			 * @private
			 * @description timeout ID. This is set by makeXhrRequest or loadScript
			 * @type Number
			 */
			this._timeout = null;
			
			/*
			 @name glow.net.Request#_forceXml
			 @private
			 @type Boolean
			 @description Force the response to be treated as xml
			*/
			this._forceXml = opts.forceXml;
			
			// force the reponse to be treated as xml
			// IE doesn't support overrideMineType, we need to deal with that in {@link glow.net.Response#xml}
			if (opts.forceXml && requestObj.overrideMimeType) {
				requestObj.overrideMimeType('application/xml');
			}
			
			/**
			 * @name glow.net.Request#complete
			 * @description Boolean indicating whether the request has completed
			 * @example
				// request.complete with an asynchronous call
				var request = glow.net.get(
					"myFile.html", 
					{
						async: true,
						onload: function(response) {
							alert(request.complete); // returns true
						}
					}
				);
				alert(request.complete); // returns boolean depending on timing of asynchronous call

				// request.complete with a synchronous call
				var request = glow.net.get("myFile.html", {async: false;});
				alert(request.complete); // returns true
			 * @type Boolean
			 */
			this.complete = false;

			if (typeof requestObj == "number") {
				/**
				 * @name glow.net.Request#_callbackIndex
				 * @private
				 * @description Index of the callback in glow.net._jsonCbs
				 *   This is only relavent for requests made via loadscript using the
				 *   {callback} placeholder
				 * @type Number
				 */
				this._callbackIndex = requestObj;
			} else {
				/**
				 * @name glow.net.Request#nativeRequest
				 * @description The request object from the browser.
				 *   This may not have the same properties and methods across user agents.
				 *   Also, this will be undefined if the request originated from loadScript.
				 * @example
				var request = glow.net.get(
					"myFile.html", 
					{
						async: true,
						onload: function(response) {
							alert(request.NativeObject); // returns Object()
						}
					}
				);
				 * @type Object
				 */
				this.nativeRequest = requestObj;
			}

			//assign events
			var eventNames = ["Load", "Error", "Abort"], i=0;

			for (; i < 3; i++) {
				events.addListener(this, eventNames[i].toLowerCase(), opts["on" + eventNames[i]]);
			}

		}
		Request.prototype = {
			/**
			@name glow.net.Request#send
			@function
			@description Sends the request.
				This is done automatically unless the defer option is set
			@example
				var request = glow.net.get(
					"myFile.html", 
					{
						onload : function(response) {alert("Loaded");},
						defer: true
					}
				);
				request.send(); // returns "Loaded"
			@returns {Object}
				This for async requests or a response object for sync requests
			*/
			//this function is assigned by makeXhrRequest
			send: function() {},
			/**
			 *	@name glow.net.Request#abort
			 *	@function
			 *	@description Aborts an async request
			 *		The load & error events will not fire. If the request has been
			 *		made using {@link glow.net.loadScript loadScript}, the script
			 *		may still be loaded but	the callback will not be fired.
			 * @example
				var request = glow.net.get(
					"myFile.html", 
					{
						async: true,
						defer: true,
						onabort: function() {
							alert("Something bad happened.  The request was aborted.");
						}
					}
				);
				request.abort(); // returns "Something bad happened.  The request was aborted"
			 *	@returns this
			 */
			abort: function() {
				if (!this.completed && !events.fire(this, "abort").defaultPrevented()) {
					abortRequest(this);
				}
				return this;
			},
			/**
			 @name glow.net.Request#destroy
			 @function
			 @description Release memory from a {@link glow.net.loadScript} call.
				
				This is called automatically by {@link glow.net.loadScript loadScript}
				calls that have {callback} in the URL. However, if you are not using
				{callback}, you can use this method manually to release memory when
				the request has finished.
			 
			 @example
				var request = glow.net.loadScript('http://www.bbc.co.uk/whatever.js');
			
			 @returns this
			*/
			destroy: function() {
				var that = this;
				
				if (this._callbackIndex !== undefined) {
					// set timeout is used here to prevent a crash in IE7 (possibly other versions) when the script is from the filesystem
					setTimeout(function() {
						$( scriptElements[that._callbackIndex] ).destroy();
						scriptElements[that._callbackIndex] = undefined;
						delete scriptElements[that._callbackIndex];
					}, 0);
				}
				return this;
			}
		};

		/**
		@name glow.net.Response
		@class
		@description Provided in callbacks to {@link glow.net.post glow.net.post} and {@link glow.net.get glow.net.get}
		@see <a href="../furtherinfo/net/net.shtml">Using glow.net</a>

		@glowPrivateConstructor There is no direct constructor, since {@link glow.net.post glow.net.post} and {@link glow.net.get glow.net.get} create the instances.
		*/
		/*
		 These params are hidden as we don't want users to try and create instances of this...

		 @param {XMLHttpRequest} nativeResponse
		 @param {Boolean} [timedOut=false] Set to true if the response timed out
		 @param {glow.net.Request} [request] Original request object
		*/
		function Response(nativeResponse, timedOut, request) {
			//run Event constructor
			events.Event.call(this);
			
			/**
			@name glow.net.Response#_request
			@private
			@description Original request object
			@type glow.net.Request
			*/
			this._request = request;
			
			/**
			@name glow.net.Response#nativeResponse
			@description The response object from the browser.
				This may not have the same properties and methods across user agents.
			@type Object
			*/
			this.nativeResponse = nativeResponse;
			/**
			@name glow.net.Response#status
			@description HTTP status code of the response
			@type Number
			*/
			//IE reports status as 1223 rather than 204, for laffs
			this.status = timedOut ? 408 :
				nativeResponse.status == 1223 ? 204 : nativeResponse.status;

			/**
			 * @name glow.net.Response#timedOut
			 * @description Boolean indicating if the requests time out was reached.
			 * @type Boolean
			 */
			this.timedOut = !!timedOut;

			/**
			 * @name glow.net.Response#wasSuccessful
			 * @description  Boolean indicating if the request returned successfully.
			 * @type Boolean
			 */
			this.wasSuccessful = (this.status >= 200 && this.status < 300) ||
				//from cache
				this.status == 304 ||
				//watch our for requests from file://
				(this.status == 0 && nativeResponse.responseText);

		}
		
		/* (hidden from jsdoc as it appeared in output docs)
		@name glow.net-shouldParseAsXml
		@function
		@description Should the response be treated as xml? This function is used by IE only
			'this' is the response object
		@returns {Boolean}
		*/
		function shouldParseAsXml() {
			var contentType = this.header("Content-Type");
			// IE 6 & 7 fail to recognise Content-Types ending +xml (eg application/rss+xml)
			// Files from the filesystem don't have a content type, but could be xml files, parse them to be safe
			return endsPlusXml.test(contentType) || contentType === '';
		}
		
		//don't want to document this inheritance, it'll just confuse the user
		glow.lang.extend(Response, events.Event, {
			/**
			@name glow.net.Response#text
			@function
			@description Gets the body of the response as plain text
			@returns {String}
				Response as text
			*/
			text: function() {
				return this.nativeResponse.responseText;
			},
			/**
			@name glow.net.Response#xml
			@function
			@description Gets the body of the response as xml
			@returns {xml}
				Response as XML
			*/
			xml: function() {
				var nativeResponse = this.nativeResponse;
				
				if (
					// IE fails to recognise the doc as XML in some cases
					( glow.env.ie && shouldParseAsXml.call(this) )
					// If the _forceXml option is set, we need to turn the response text into xml
					|| ( this._request._forceXml && !this._request.nativeRequest.overrideMimeType && window.ActiveXObject )
				) {
					var doc = new ActiveXObject("Microsoft.XMLDOM");
					doc.loadXML( nativeResponse.responseText );
					return doc;
				}
				else {
					// check property exists
					if (!nativeResponse.responseXML) {
						throw new Error(STR.XML_ERR);
					}
					return nativeResponse.responseXML;
				}				
			},

			/**
			@name glow.net.Response#json
			@function
			@description Gets the body of the response as a json object

			@param {Boolean} [safeMode=false]
				If true, the response will be parsed using a string parser which
				will filter out non-JSON javascript, this will be slower but
				recommended if you do not trust the data source.

			@returns {Object}
			*/
			json: function(safe) {
				return glow.data.decodeJson(this.text(), {safeMode:safe});
			},

			/**
			@name glow.net.Response#header
			@function
			@description Gets a header from the response

			@param {String} name
				Header name

			@returns {String}
				Header value

			@example var contentType = myResponse.header("Content-Type");
			*/
			header: function(name) {
				return this.nativeResponse.getResponseHeader(name);
			},

			/**
			@name glow.net.Response#statusText
			@function
			@description Gets the meaning of {@link glow.net.Response#status myResponse.status}

			@returns {String}
			*/
			statusText: function() {
				return this.timedOut ? "Request Timeout" : this.nativeResponse.statusText;
			}
		})

		// Private (x-domain request)

		/**
		@name _XDomainRequest
		@private
		@class
		@description A request made via a form submission in a hidden iframe, with the result being communicated
					 via the name attribute of the iframe's window.

		@param {String} url
				the URL to post the data to.
		@param {Object} data
				the data to post. This should be keys with String values (or values that will be converted to
				strings) or Array values where more than one value should be sent for a single key.
		@param {Object} opts
				an Object containing the same options as passed to glow.net.xDomainPost.
		*/
		var _XDomainRequest = function (url, data, isGet, opts) {
			this.url  = url;
			this.data = data;
			this.isGet = isGet;
			this.opts = opts;
		};


		_XDomainRequest.prototype = {
			/**
			@name _XDomainRequest#send
			@private
			@function
			@description Send the request
			*/
			send: function () {
				this._addIframe();
				this._addForm();
				this._addTimeout();
				this.onLoad = this._handleResponse;
				this._submitForm();
			},

			/**
			@name _XDomainRequest#_addIframe
			@private
			@function
			@description Add a hidden iframe for posting the request
			*/
			_addIframe: function () {
				this.iframe = glow.dom.create(
					'<iframe style="visibility: hidden; position: absolute; height: 0;"></iframe>'
				);
				$('body').append(this.iframe);

				var iframe   = this.iframe[0],
                    request  = this,                    
                    callback = function () {
                        if (request.onLoad) request.onLoad();
                    };

                if (iframe.attachEvent) {
                    iframe.attachEvent('onload', callback);
                } else {
                    iframe.onload = callback;
                }
			},
		
			/**
			@name _XDomainRequest#_addForm
			@private
			@function
			@description Add the form to the iframe for posting the request
			*/
			_addForm: function () {
				var doc = this._window().document;

				// IE needs an empty document to be written to written to the iframe
				if (glow.env.ie) {
					doc.open();
					doc.write('<html><body></body></html>');
					doc.close();
				}

				var form = this.form = doc.createElement('form');
				form.setAttribute('action', this.url);
				form.setAttribute('method', this.isGet ? 'GET' : 'POST');

				var body = doc.getElementsByTagName('body')[0];
				body.appendChild(form);
				this._addFormData();
			},

			/**
			@name _XDomainRequest#_addFormData
			@private
			@function
			@description Add the data to the form
			*/
			_addFormData: function () {
				for (var i in this.data) {
					if (! this.data.hasOwnProperty(i)) continue;
					if (this.data[i] instanceof Array) {
						var l = this.data[i].length;
						for (var j = 0; j < l; j++) {
							this._addHiddenInput(i, this.data[i][j]);
						 }
					}
					else {
						this._addHiddenInput(i, this.data[i]);
					}
				}
			},

			/**
			@name _XDomainRequest#_addHiddenInput
			@private
			@function
			@description Add a hidden input to the form for a piece of data
			*/
			_addHiddenInput: function (name, value) {
				var input = this._window().document.createElement('input');
				input.type = 'hidden';
				input.name = name;
				input.value = value;
				this.form.appendChild(input);
			},

			/**
			@name _XDomainRequest#window
			@private
			@function
			@description Get the window for the hidden iframe
			*/
			_window: function () {
				var iframe = this.iframe[0];
				if (iframe.contentWindow)
					return iframe.contentWindow;
				throw new Error('could not get contentWindow from iframe');

				// this code was here to work around a browser quirk, but I don't know which for...
				// I have tested in recent Safari, Chrome, Firefox, Opera and IE 6, 7, 8
				// If the above error shows up, then this is the thing to try

				// if (iframe.contentDocument && iframe.contentDocument.parentWindow)
				//	return iframe.contentDocument.parentWindow;
			},

			/**
			@name _XDomainRequest#_addTimeout
			@private
			@function
			@description Add a timeout to cancel the request if it takes too long
			*/
			_addTimeout: function () {
				var request = this;
				this.timeout = setTimeout(function () {
					var err;
					if (request.opts.hasOwnProperty('onTimeout')) {
						try {
							request.opts.onTimeout();
						}
						catch (e) {
							err = e;
						}
					}
					request._cleanup();
					if (err) throw new Error('error in xDomainPost onTimeout callback: ' + err);
				}, (this.opts.timeout || 10) * 1000); /* 10 second default */
			},

			/**
			@name _XDomainRequest#_handleResponse
			@private
			@function
			@description Callback for load event in the hidden iframe
			*/
			_handleResponse: function () {
				var err, href, win = this._window();
				try {
					href = win.location.href;
				}
				catch (e) {
					err  = e;
				}
				if (href != 'about:blank' || err) {
					clearTimeout(this.timeout);
					this.onLoad = this._readHandler;
					// this is just here for the tests, normally always want it to be in the same origin
					if ('_fullBlankUrl' in this.opts) {
						win.location = this.opts._fullBlankUrl;
					}
					else {
						win.location = window.location.protocol + '//' + window.location.host + (this.opts.blankUrl || '/includes/blank/');
					}
				}
			},

			/**
			@name _XDomainRequest#_readHandler
			@private
			@function
			@description Callback for load event of blank page in same origin
			*/
			_readHandler: function () {
				var err;
				if (this.opts.hasOwnProperty('onLoad')) {
					try {
						this.opts.onLoad(this._window().name);
					}
					catch (e) {
						err = e;
					}
				}
				this._cleanup();
				if (err)
					throw new Error('error in xDomainPost onLoad callback: ' + err);
			},

			/**
			@name _XDomainRequest#_cleanup
			@private
			@function
			@description Removes the iframe and any event listeners
			*/
			_cleanup: function () {
				glow.events.removeListener(this.listener);
				this.iframe.remove();
			},

			/**
			@name _XDomainRequest#_submitForm
			@private
			@function
			@description Submit the form to make the post request
			*/
			_submitForm : function () {
				var request = this;
				// the set timeout is here to make the form submit in the context of the iframe
				this._window().setTimeout(function () { request.form.submit() }, 0);
			}
		};

		// public (x-domain request)

		/**
		@name glow.net.xDomainPost
		@function
		@description Send a post request via a form submission in a hidden iframe.
					 The result is returned by the recipient of the form submission setting the iframe's
					 window.name property.

					 The URL that's requested should respond with a blank html page containing JavaScript
					 that assigns the result to window.name as a string:

					 <script type="text/javascript">
					 window.name = '{ "success": true }';
					 </script>
		
		@param {String} url url to perform the request on
				the URL to post the data to.
		@param {Object} data
				the data to post. This should be keys with String values (or values that will be converted to
				strings) or Array values where more than one value should be sent for a single key.
		@param {Object} opts
				Zero or more of the following as properties of an object:
				@param {Function} [onLoad] callback called when the request completes
						a callback that is called when the response to the post is recieved. The function is passed
						a single parameter containing the value of window.name set by the response to the post.
				@param {Number} [timeout=10] request timeout
						the request timeout in seconds (default 10 seconds)
				@param {Function} [onTimeout] callback called when request times out
						a callback that is called when the requested url takes longer than the timeout to respond
				@param {String} [blankUrl='/includes/blank'] url to load after main request
						the path of a blank URL on the same domain as the caller (default '/includes/blank/')	   
		*/
		r.xDomainPost = function (url, data, opts) {
			var request = new _XDomainRequest(url, data, false, opts);
			request._send();
		};

		/**
		@name glow.net.xDomainGet
		@function
		@description Send a get request via a form submission in a hidden iframe.
					 The result is returned by the recipient of the form submission setting the iframe's
					 window.name property.

					 The URL that's requested should respond with a blank html page containing JavaScript
					 that assigns the result to window.name as a string:

					 <script type="text/javascript">
					 window.name = '{ "success": true }';
					 </script>
		
		@param {String} url url to perform the request on
				The address that the GET request should be sent to.
		@param {Object} opts
				Zero or more of the following as properties of an object:
				@param {Function} [onLoad] callback called when the request completes
						a callback that is called when the response to the post is recieved. The function is passed
						a single parameter containing the value of window.name set by the response to the post.
				@param {Number} [timeout=10] request timeout
						the request timeout in seconds (default 10 seconds)
				@param {Function} [onTimeout] callback called when request times out
						a callback that is called when the requested url takes longer than the timeout to respond
				@param {String} [blankUrl='/about/blank/'] url to load after main request
						the path of a blank URL on the same domain as the caller (default '/includes/blank/')	   
		*/
		r.xDomainGet = function (url, opts) {
			var request = new _XDomainRequest(url, {}, true, opts);
			request._send();
		};

		glow.net = r;
	}
});


