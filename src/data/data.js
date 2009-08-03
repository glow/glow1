/**
@name glow.data
@namespace
@description Serialising and de-serialising data
@see <a href="../furtherinfo/data/data.shtml">Using glow.data</a>
*/
(window.gloader || glow).module({
	name: "glow.data",
	library: ["glow", "@VERSION@"],
	depends: [["glow", "@VERSION@", "glow.dom"]],
	builder: function(glow) {
		//private

		/*
		PrivateProperty: TYPES
			hash of strings representing data types
		*/
		var TYPES = {
			UNDEFINED : "undefined",
			OBJECT    : "object",
			NUMBER    : "number",
			BOOLEAN   : "boolean",
			STRING    : "string",
			ARRAY     : "array",
			FUNCTION  : "function",
			NULL      : "null"
		}

		/*
		PrivateProperty: TEXT
			hash of strings used in encoding/decoding
		*/
		var TEXT = {
			AT    : "@",
			EQ    : "=",
			DOT   : ".",
			EMPTY : "",
			AND   : "&",
			OPEN  : "(",
			CLOSE : ")"
		}

		/*
		PrivateProperty: JSON
			nested hash of strings and regular expressions used in encoding/decoding Json
		*/
		var JSON = {
			HASH : {
				START     : "{",
				END       : "}",
				SHOW_KEYS : true
			},

			ARRAY : {
				START     : "[",
				END       : "]",
				SHOW_KEYS : false
			},

			DATA_SEPARATOR   : ",",
			KEY_SEPARATOR    : ":",
			KEY_DELIMITER    : "\"",
			STRING_DELIMITER : "\"",

			SAFE_PT1 : /^[\],:{}\s]*$/,
			SAFE_PT2 : /\\./g,
			SAFE_PT3 : /\"[^\"\\\n\r]*\"|true|false|null|-?\d+(?:\.\d*)?(:?[eE][+\-]?\d+)?/g,
			SAFE_PT4 : /(?:^|:|,)(?:\s*\[)+/g
		}

		/*
		PrivateProperty: SLASHES
			hash of strings and regular expressions used in encoding strings
		*/
		var SLASHES = {
			TEST : /[\b\n\r\t\\\f\"]/g,
			B : {PLAIN : "\b", ESC : "\\b"},
			N : {PLAIN : "\n", ESC : "\\n"},
			R : {PLAIN : "\r", ESC : "\\r"},
			T : {PLAIN : "\t", ESC : "\\t"},
			F : {PLAIN : "\f", ESC : "\\f"},
			SL : {PLAIN : "\\", ESC : "\\\\"},
			QU : {PLAIN : "\"", ESC : "\\\""}
		}

		/*
		PrivateMethod: _replaceSlashes
			Callback function for glow.lang.replace to escape appropriate characters

		Arguments:
			s - the regex match to be tested

		Returns:
			The escaped version of the input.
		*/
		function _replaceSlashes(s) {
			switch (s) {
				case SLASHES.B.PLAIN: return SLASHES.B.ESC;
				case SLASHES.N.PLAIN: return SLASHES.N.ESC;
				case SLASHES.R.PLAIN: return SLASHES.R.ESC;
				case SLASHES.T.PLAIN: return SLASHES.T.ESC;
				case SLASHES.F.PLAIN: return SLASHES.F.ESC;
				case SLASHES.SL.PLAIN: return SLASHES.SL.ESC;
				case SLASHES.QU.PLAIN: return SLASHES.QU.ESC;
				default: return s;
			}
		}

		/*
		PrivateMethod: _getType
			Returns the data type of the object

		Arguments:
			object - the object to be tested

		Returns:
			A one of the TYPES constant properties that represents the data type of the object.
		*/
		function _getType(object) {
			if((typeof object) == TYPES.OBJECT) {
				if (object == null) {
					return TYPES.NULL;
				} else {
					return (object instanceof Array)?TYPES.ARRAY:TYPES.OBJECT;
				}
			} else {
				return (typeof object);
			}
		}

		//public
		glow.data = {
			/**
			@name glow.data.encodeUrl
			@function
			@description Encodes an object for use as a query string.
			
				Returns a string representing the object suitable for use 
				as a query string, with all values suitably escaped.
				It does not include the initial question mark. Where the 
				input field was an array, the key is repeated in the output.
			
			@param {Object} object The object to be encoded.
			
				This must be a hash whose values can only be primitives or 
				arrays of primitives.
			
			@returns {String}
			
			@example
				var getRef = glow.data.encodeUrl({foo: "Foo", bar: ["Bar 1", "Bar2"]});
				// will return "foo=Foo&bar=Bar%201&bar=Bar2"
			*/
			encodeUrl : function (object) {
				var objectType = _getType(object);
				var paramsList = [];
				var listLength = 0;

				if (objectType != TYPES.OBJECT) {
					throw new Error("glow.data.encodeUrl: cannot encode item");
				} else {
					for (var key in object) {
						switch(_getType(object[key])) {
							case TYPES.FUNCTION:
							case TYPES.OBJECT:
								throw new Error("glow.data.encodeUrl: cannot encode item");
								break;
							case TYPES.ARRAY:
								for(var i = 0, l = object[key].length; i < l; i++) {
									switch(_getType(object[key])[i]) {
										case TYPES.FUNCTION:
										case TYPES.OBJECT:
										case TYPES.ARRAY:
											throw new Error("glow.data.encodeUrl: cannot encode item");
											break;
										default:
											paramsList[listLength++] = key + TEXT.EQ + encodeURIComponent(object[key][i]);
									}
								}
								break;
							default:
								paramsList[listLength++] = key + TEXT.EQ + encodeURIComponent(object[key]);
						}
					}

					return paramsList.join(TEXT.AND);
				}
			},
			/**
			@name glow.data.decodeUrl
			@function
			@description Decodes a query string into an object.
			
				Returns an object representing the data given by the query 
				string, with all values suitably unescaped. All keys in the 
				query string are keys of the object. Repeated keys result 
				in an array.
			
			@param {String} string The query string to be decoded.
			
				It should not include the initial question mark.
			
			@returns {Object}
			
			@example
				var getRef = glow.data.decodeUrl("foo=Foo&bar=Bar%201&bar=Bar2");
				// will return the object {foo: "Foo", bar: ["Bar 1", "Bar2"]}
			*/
			decodeUrl : function (text) {
				if(_getType(text) != TYPES.STRING) {
					throw new Error("glow.data.decodeUrl: cannot decode item");
				} else if (text === "") {
					return {};
				}

				var result = {};
				var keyValues = text.split(/[&;]/);

				var thisPair, key, value;

				for(var i = 0, l = keyValues.length; i < l; i++) {
					thisPair = keyValues[i].split(TEXT.EQ);
					if(thisPair.length != 2) {
						throw new Error("glow.data.decodeUrl: cannot decode item");
					} else {
						key   = glow.lang.trim( decodeURIComponent(thisPair[0]) );
						value = glow.lang.trim( decodeURIComponent(thisPair[1]) );

						switch (_getType(result[key])) {
							case TYPES.ARRAY:
								result[key][result[key].length] = value;
								break;
							case TYPES.UNDEFINED:
								result[key] = value;
								break;
							default:
								result[key] = [result[key], value];
						}
					}
				}

				return result;
			},
			/**
			@name glow.data.encodeJson
			@function
			@description Encodes an object into a string JSON representation.
			
				Returns a string representing the object as JSON.
			
			@param {Object} object The object to be encoded.
			 
				This can be arbitrarily nested, but must not contain 
				functions or cyclical structures.
			
			@returns {Object}
			
			@example
				var myObj = {foo: "Foo", bar: ["Bar 1", "Bar2"]};
				var getRef = glow.data.encodeJson(myObj);
				// will return '{"foo": "Foo", "bar": ["Bar 1", "Bar2"]}'
			*/
			encodeJson : function (object, options) {
				function _encode(object, options)
				{
					if(_getType(object) == TYPES.ARRAY) {
						var type = JSON.ARRAY;
					} else {
						var type = JSON.HASH;
					}

					var serial = [type.START];
					var len = 1;
					var dataType;
					var notFirst = false;

					for(var key in object) {
						dataType = _getType(object[key]);

						if(dataType != TYPES.UNDEFINED) { /* ignore undefined data */
							if(notFirst) {
								serial[len++] = JSON.DATA_SEPARATOR;
							}
							notFirst = true;

							if(type.SHOW_KEYS) {
								serial[len++] = JSON.KEY_DELIMITER;
								serial[len++] = key;
								serial[len++] = JSON.KEY_DELIMITER;
								serial[len++] = JSON.KEY_SEPARATOR;
							}

							switch(dataType) {
								case TYPES.FUNCTION:
									throw new Error("glow.data.encodeJson: cannot encode item");
									break;
								case TYPES.STRING:
								default:
									serial[len++] = JSON.STRING_DELIMITER;
									serial[len++] = glow.lang.replace(object[key], SLASHES.TEST, _replaceSlashes);
									serial[len++] = JSON.STRING_DELIMITER;
									break;
								case TYPES.NUMBER:
								case TYPES.BOOLEAN:
									serial[len++] = object[key];
									break;
								case TYPES.OBJECT:
								case TYPES.ARRAY:
									serial[len++] = _encode(object[key], options);
									break;
								case TYPES.NULL:
									serial[len++] = TYPES.NULL;
									break;
							}
						}
					}
					serial[len++] = type.END;

					return serial.join(TEXT.EMPTY);
				}

				options = options || {};
				var type = _getType(object);

				if((type == TYPES.OBJECT) || (type == TYPES.ARRAY)) {
					return _encode(object, options);
				} else {
					throw new Error("glow.data.encodeJson: cannot encode item");
				}
			},
			/**
			@name glow.data.decodeJson
			@function
			@description Decodes a string JSON representation into an object.
				
				Returns a JavaScript object that mirrors the data given.
			
			@param {String} string The string to be decoded.
				Must be valid JSON. 
			
			@param {Object} opts
			
					Zero or more of the following as properties of an object:
					@param {Boolean} [opts.safeMode=false] Whether the string should only be decoded if it is  deemed "safe". 
					The json.org regular expression checks are used. 
			
			@returns {Object}
			
			@example
				var getRef = glow.data.decodeJson('{foo: "Foo", bar: ["Bar 1", "Bar2"]}');
				// will return {foo: "Foo", bar: ["Bar 1", "Bar2"]}
			
				var getRef = glow.data.decodeJson('foobar', {safeMode: true});
				// will throw an error
			*/
			decodeJson : function (text, options) {
				if(_getType(text) != TYPES.STRING) {
					throw new Error("glow.data.decodeJson: cannot decode item");
				}

				options = options || {};
				options.safeMode = options.safeMode || false;

				var canEval = true;

				if(options.safeMode) {
					canEval = (JSON.SAFE_PT1.test(text.replace(JSON.SAFE_PT2, TEXT.AT).replace(JSON.SAFE_PT3, JSON.ARRAY.END).replace(JSON.SAFE_PT4, TEXT.EMPTY)));
				}

				if(canEval) {
					try {
						return eval(TEXT.OPEN + text + TEXT.CLOSE);
					}
					catch(e) {/* continue to error */}
				}

				throw new Error("glow.data.decodeJson: cannot decode item");
			},
			/**
			@name glow.data.escapeHTML
			@function
			@description Escape HTML entities.
			
				Returns a string with HTML entities escaped.
			
			@param {String} string The string to be escaped.
			
			@returns {String}
			
			@example
				// useful for protecting against XSS attacks:
				var fieldName = '" onclick="alert(\'hacked\')" name="';
			
				// but should be used in all cases like this:
				glow.dom.create('<input name="' + glow.data.escapeHTML(untrustedString) + '"/>');
			 */
			escapeHTML : function (html) {
				return glow.dom.create('<div></div>').text(html).html();
			}		   
		};
	}
});
