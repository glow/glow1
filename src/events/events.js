/**
@name glow.events
@namespace
@description Native browser and custom events
@see <a href="../furtherinfo/events/">Using event listeners</a>
@see <a href="../furtherinfo/events/firing_events.shtml">Firing event listeners</a>
@see <a href="../furtherinfo/events/removing_event_listeners.shtml">Removing event listeners</a>
*/
(window.gloader || glow).module({
	name: "glow.events",
	library: ["glow", "@VERSION@"],
	depends: [["glow", "@VERSION@", 'glow.dom']],
	builder: function(glow) {
		
		var $ = glow.dom.get;
		var r = {};
		var eventid = 1;
		var objid = 1;
		// object (keyed by obj id), containing object (keyed by event name), containing arrays of listeners
		var listenersByObjId = {};
		// object (keyed by ident) containing listeners
		var listenersByEventId = {};
		var domListeners = {};
		var psuedoPrivateEventKey = '__eventId' + glow.UID;
		var psuedoPreventDefaultKey = psuedoPrivateEventKey + 'PreventDefault';
		var psuedoStopPropagationKey = psuedoPrivateEventKey + 'StopPropagation';

		var topKeyListeners = {};
		var keyListenerId = 1;
		var keyListeners = {};
		var keyTypes = {};

		var CTRL = 1;
		var ALT = 2;
		var SHIFT = 4;

		var specialPrintables = {
			TAB      : '\t',
			SPACE    : ' ',
			ENTER    : '\n',
			BACKTICK : '`'
		};

		var keyNameAliases = {
			'96' : 223
		};

		var keyNameToCode = {
			CAPSLOCK : 20, NUMLOCK : 144, SCROLLLOCK : 145, BREAK : 19,
			BACKTICK : 223, BACKSPACE : 8, PRINTSCREEN : 44, MENU : 93, SPACE : 32,
			SHIFT : 16,  CTRL : 17,  ALT : 18,
			ESC   : 27,  TAB  : 9,   META     : 91,  RIGHTMETA : 92, ENTER : 13,
			F1    : 112, F2   : 113, F3       : 114, F4        : 115,
			F5    : 116, F6   : 117, F7       : 118, F8        : 119,
			F9    : 120, F10  : 121, F11      : 122, F12       : 123,
			INS   : 45,  HOME : 36,  PAGEUP   : 33,
			DEL   : 46,  END  : 35,  PAGEDOWN : 34,
			LEFT  : 37,  UP   : 38,  RIGHT    : 39,  DOWN      : 40
		};
		var codeToKeyName = {};
		for (var i in keyNameToCode) {
			codeToKeyName['' + keyNameToCode[i]] = i;
		}

		var operaBrokenChars = '0123456789=;\'\\\/#,.-';

		/*
		PrivateMethod: removeKeyListener
			Removes a listener for a key combination.
		
		Arguments:
			ident - identifier returned from addKeyListener.
		*/

		function removeKeyListener (ident) {
			var keyType = keyTypes[ident];
			if (! keyType) { return false; }
			var listeners = keyListeners[keyType];
			if (! listeners) { return false; }
			for (var i = 0, len = listeners.length; i < len; i++) {
				if (listeners[i][0] == ident) {
					listeners.splice(i, 1);
					return true;
				}
			}
			return false;
		}

		/*
		PrivateMethod: initTopKeyListner
			Adds an event listener for keyboard events, for key listeners added by addKeyListener.

		Arguments:
			type - press|down|up - the type of key event.
		*/

		function initTopKeyListener (type) {
			topKeyListeners[type] = r.addListener(document, 'key' + type, function (e) {
				var mods = 0;
				if (e.ctrlKey) { mods += CTRL; }
				if (e.altKey) { mods += ALT; }
				if (e.shiftKey) { mods += SHIFT; }
				var keyType = e.chr ? e.chr.toLowerCase() : e.key ? e.key.toLowerCase() : e.keyCode;
				var eventType = mods + ':' + keyType + ':' + type;
				var listeners = keyListeners[eventType] ? keyListeners[eventType].slice(0) : [];
				// if the user pressed shift, but event didn't specify that, include it
				if (e.shiftKey) { // upper-case letter, should match regardless of shift
					var shiftEventType = (mods & ~ SHIFT) + ':' + keyType + ':' + type;
					if (keyListeners[shiftEventType]) {
						for (var i = 0, len = keyListeners[shiftEventType].length; i < len; i++) {
							listeners[listeners.length] = keyListeners[shiftEventType][i];
						}
					}
				}
				
				if (! listeners) { return; }
				
				for (var i = 0, len = listeners.length; i < len; i++) {
					//call listener and look out for preventing the default
					if (listeners[i][2].call(listeners[i][3] || this, e) === false) {
						e.preventDefault();
					}
				}
				return !e.defaultPrevented();
			});
		}
		
		/*
		PrivateMethod: clearEvents
			Removes all current listeners to avoid IE mem leakage
		*/
		function clearEvents() {
			var ident;
			for (ident in listenersByEventId) {
				r.removeListener(ident);
			}
		}

		// for opera madness
		var previousKeyDownKeyCode;

		var operaResizeListener,
			operaDocScrollListener;

		/*
		PrivateMethod: addDomListener
			Adds an event listener to a browser object. Manages differences with certain events.

		Arguments:
			attachTo - the browser object to attach the event to.
			name - the generic name of the event (inc. mousewheel)
		*/
		function addDomListener (attachTo, name, capturingMode) {
			var wheelEventName;

			capturingMode = !!capturingMode;
			
			if (glow.env.opera) {
				if (name.toLowerCase() == 'resize' && !operaResizeListener && attachTo == window) {
					operaResizeListener = r.addListener(window.document.body, 'resize', function (e) { r.fire(window, 'resize', e); });
				} else if (name.toLowerCase() == 'scroll' && !operaDocScrollListener && attachTo == window) {
					operaDocScrollListener = r.addListener(window.document, 'scroll', function (e) { r.fire(window, 'scroll', e); });
				}
			}
			
			var callback = function (e) {
				if (! e) { e = window.event; }
				var event = new r.Event(),
					lowerCaseName = name.toLowerCase();
				event.nativeEvent = e;
				event.source = e.target || e.srcElement;

				event.relatedTarget = e.relatedTarget || (lowerCaseName == "mouseover" ? e.fromElement : e.toElement);
			    event.button = glow.env.ie ? (e.button & 1 ? 0 : e.button & 2 ? 2 : 1) : e.button;
				if (e.pageX || e.pageY) {
					event.pageX = e.pageX;
					event.pageY = e.pageY;
				} else if (e.clientX || e.clientY) 	{
					event.pageX = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
					event.pageY = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
				}
				if (lowerCaseName == 'mousewheel') {
					// this works in latest opera, but have read that it needs to be switched in direction
					// if there was an opera bug, I can't find which version it was fixed in
					event.wheelDelta =
						e.wheelDelta ? e.wheelDelta / 120 :
						e.detail ? - e.detail / 3 :
							0;
					if (event.wheelDelta == 0) { return; }
				}
				if (lowerCaseName.indexOf("key") != -1) {
					event.altKey = !! e.altKey;
					event.ctrlKey = !! e.ctrlKey;
					event.shiftKey = !! e.shiftKey;

					if (name == 'keydown') {
						previousKeyDownKeyCode = e.keyCode;
					}

					event.charCode = e.keyCode && e.charCode !== 0 ? undefined : e.charCode;

					if (lowerCaseName == 'keypress') {
						if (typeof(event.charCode) == 'undefined') {
							event.charCode = e.keyCode;
						}

						if (glow.env.opera && event.charCode && event.charCode == previousKeyDownKeyCode &&
							operaBrokenChars.indexOf(String.fromCharCode(event.charCode)) == -1
						) {
							event.charCode = undefined;
							event.keyCode = previousKeyDownKeyCode;
						}
					}
					
					// make things a little more sane in opera
					if (event.charCode && event.charCode <= 49) { event.charCode = undefined; }

					if (event.charCode) {
						event.chr = String.fromCharCode(event.charCode);
					}
					else if (e.keyCode) {
						event.charCode = undefined;
						event.keyCode = keyNameAliases[e.keyCode.toString()] || e.keyCode;
						event.key = codeToKeyName[event.keyCode];
						if (specialPrintables[event.key]) {
							event.chr = specialPrintables[event.key];
							event.charCode = event.chr.charCodeAt(0);
						}
					}

					if (event.chr) {
						event.capsLock =
							event.chr.toUpperCase() != event.chr ? // is lower case
								event.shiftKey :
							event.chr.toLowerCase() != event.chr ? // is upper case
								! event.shiftKey :
								undefined; // can only tell for keys with case
					}
				}

				r.fire(this, name, event);
				if (event.defaultPrevented()) {
					return false;
				}
			};


			if (attachTo.addEventListener && (!glow.env.webkit || glow.env.webkit > 418)) {

				// This is to fix an issue between Opera and everything else.
				// Opera needs to have an empty eventListener attached to the parent
				// in order to fire a captured event (in our case we are using capture if
				// the event is focus/blur) on an element when the element is the eventTarget.
				//
				// It is only happening in Opera 9, Opera 10 doesn't show this behaviour.
				// It looks like Opera has a bug, but according to the W3C Opera is correct...
				//
				// "A capturing EventListener will not be triggered by events dispatched 
				// directly to the EventTarget upon which it is registered."
				// http://www.w3.org/TR/DOM-Level-2-Events/events.html#Events-flow-capture
				if (
					   (
							(name == 'focus')
							|| (name == 'blur')
						)
					&& (glow.env.opera)
				) {
					glow.dom.get(attachTo).parent()[0].addEventListener(name, function(){},true);
				}

				attachTo.addEventListener(name.toLowerCase() == 'mousewheel' && glow.env.gecko ? 'DOMMouseScroll' : name, callback, capturingMode);

			} else {

				var onName = 'on' + name;
				var existing = attachTo[onName];
				if (existing) {
					attachTo[onName] = function () {
						// we still need to return false if either the existing or new callback returns false
						var existingReturn = existing.apply(this, arguments),
							callbackReturn = callback.apply(this, arguments);
						
						return (existingReturn !== false) && (callbackReturn !== false);
					};
				} else {
					attachTo[onName] = callback;
				}

			}

			attachTo = null;

		}
		
		/**
		Add mouseEnter or mouseLeave 'event' to an element
		@private
		@param {HTMLElement} attachTo Element to create mouseenter / mouseleave for
		@param {Boolean} isLeave Create mouseleave or mouseenter?
		*/
		function addMouseEnterLeaveEvent(attachTo, isLeave) {
			var elm = $(attachTo),
				listenFor = isLeave ? "mouseout" : "mouseover",
				toFire = isLeave ? "mouseleave" : "mouseenter";
			
			r.addListener(attachTo, listenFor, function(e) {
				var relatedTarget = $(e.relatedTarget);
				// if the mouse has come from outside elm...
				if ( !relatedTarget.eq(elm) && !relatedTarget.isWithin(elm) ) {
					// return false if default is prevented by mouseEnter event
					return !r.fire(elm[0], toFire, e).defaultPrevented();
				}
			})
		}
		
		/**
		@name glow.events._copyListeners 
		@function
		@private
		@description Maps event listeners from one set of nodes to another in the order they appear in each NodeList.
			Note, it doesn't copy events from a node's children.
		
		
		@param {NodeList} from NodeList to copy events from
		@param {NodeList} to NodeList to copy events to
	
		@returns {Boolean}
		
		@example
			var listener = glow.events.addListener(...);
			glow.events.removeListener(listener);
		*/
		r._copyListeners = function(from, to) {
			// grab all the elements (including children)
			var i = from.length,
				// events attached to a particular element
				elementEvents,
				// name of the current event we're looking at
				eventName,
				// current listener index
				listenerIndex,
				// number of listeners to an event
				listenersLen,
				// listener definition from listenersByObjId
				listener;
			
			// loop through all items
			while(i--) {
				// has a glow event been assigned to this node?
				if ( from[i][psuedoPrivateEventKey] ) {
					// get listeners for that event
					elementEvents = listenersByObjId[ from[i][psuedoPrivateEventKey] ];
					// loop through event names
					for (eventName in elementEvents) {
						listenerIndex = 0;
						listenersLen = elementEvents[eventName].length;
						// loop through listeners to that event
						for (; listenerIndex < listenersLen; listenerIndex++) {
							listener = elementEvents[eventName][listenerIndex];
							// listen to them on the clone
							r.addListener(to[i], eventName, listener[2], listener[3]);
						}
					}
				}
			}
		}

		/**
		@name glow.events.addListener
		@function
		@description Adds an event listener to an object (e.g. a DOM Element or Glow widget).
		
			Some non-standard dom events are available:
			
			<dl>
				<dt>mouseenter</dt>
				<dd>Fires when the mouse enters this element specifically, does not bubble</dd>
				<dt>mouseleave/dt>
				<dd>Fires when the mouse leaves this element specifically, does not bubble</dd>
			</dl>
		
		@param {String | NodeList | Object} attachTo The object to attach the event listener to.
		
			If the parameter is a string, then it is treated as a CSS selector 
			and the listener is attached to all matching elements.
		   	
		   	If the parameter is a {@link glow.dom.NodeList}, then the listener 
		   	is attached to all elements in the NodeList.
		
		@param {String} name The event name. 
		
			Listeners for DOM events should not begin with 'on' (i.e. 'click' 
			rather than 'onclick')
				   
		@param {Function} callback The function to be called when the event fires.
			
		@param {Object} [context] The execution scope of the callback.
		
			If this parameter is not passed then the attachTo object will be the 
			scope of the callback.
		
		@returns {Number | Undefined}
		
			A unique identifier for the event suitable for passing to 
			{@link glow.events.removeListener}. If an empty NodeList or CSS 
			selector that returns no elements is passed, then undefined is returned.
		
		@example
			glow.events.addListener('#nav',	'click', function () {
				alert('nav clicked');
			});

			glow.events.addListener(myLightBox, 'close', this.showSurvey, this);
		*/
		r.addListener = function (attachTo, name, callback, context) {
			var capturingMode = false;
			if (! attachTo) { throw 'no attachTo paramter passed to addListener'; }

			if (typeof attachTo == 'string') {
				if (! glow.dom) { throw "glow.dom must be loaded to use a selector as the first argument to glow.events.addListener"; }
				attachTo = $(attachTo);
			}
			
			if (glow.dom && attachTo instanceof glow.dom.NodeList) {
				var listenerIds = [],
					i = attachTo.length;

				//attach the event for each element, return an array of listener ids
				while (i--) {
					listenerIds[i] = r.addListener(attachTo[i], name, callback, context);
				}
				
				return listenerIds;
			}
	
			var objIdent;
			if (! (objIdent = attachTo[psuedoPrivateEventKey])) {
				objIdent = attachTo[psuedoPrivateEventKey] = objid++;
			}
			var ident = eventid++;
			var listener = [ objIdent, name, callback, context, ident ];
			listenersByEventId[ident] = listener;

			var objListeners = listenersByObjId[objIdent];
			if (! objListeners) { objListeners = listenersByObjId[objIdent] = {}; }
			var objEventListeners = objListeners[name];
			if (! objEventListeners) { objEventListeners = objListeners[name] = []; }
			objEventListeners[objEventListeners.length] = listener;
			
			if ((attachTo.addEventListener || attachTo.attachEvent) && ! domListeners[objIdent + ':' + name]) {
				// handle 'special' dom events (ie, ones that aren't directly mapped to real dom events)
				// we don't actually add a dom listener for these event names
				switch (name) {
					case "mouseenter":
						addMouseEnterLeaveEvent(attachTo, false);
						return ident;
					case "mouseleave":
						addMouseEnterLeaveEvent(attachTo, true);
						return ident;

					// Focus and blur events:
					// Convert focus/blur events to use capturing.
					// This allows form elements to be used with event delegation.

					case "focus":
						// IE
						// If IE then change focus/blur events to focusin/focusout events.
						// This allows input elements to bubble, so form elements work with event delegation.
						if (glow.env.ie) {
							addFocusInOutEvent(attachTo, true);
							return ident;
						}
						// Everything else
						else {
							capturingMode = true
						}
						break;

					case "blur":
						// IE
						// If IE then change focus/blur events to focusin/focusout events.
						// This allows input elements to bubble, so form elements work with event delegation.
						if (glow.env.ie) {
							addFocusInOutEvent(attachTo, false);
							return ident;
						}
						// Everything else
						else {
							capturingMode = true
						}
						break;

				}
				
				addDomListener(attachTo, name, capturingMode);
				domListeners[objIdent + ':' + name] = true;
			}
			return ident;
		};

		/**
		Add focusIn or focusOut 'event' to an element
		@private
		@param {HTMLElement} attachTo Element to create focusIn / focusOut for
		@param {Boolean} event Create focusIn or focusOut?
		*/
		function addFocusInOutEvent(attachTo, event) {
			var listenFor = event ? 'focusin' : 'focusout',
				toFire    = event ? 'focus'   : 'blur';
			r.addListener($(attachTo), listenFor, function(e) {
				return !r.fire($(attachTo), toFire, e).defaultPrevented();
			});
		}

		/**
		@name glow.events.removeListener 
		@function
		@description Removes a listener created with addListener

		@param {Number} ident An identifier returned from {@link glow.events.addListener}.
	
		@returns {Boolean}
		
		@example
			var listener = glow.events.addListener(...);
			glow.events.removeListener(listener);
		*/
		r.removeListener = function (ident) {
			if (ident && ident.toString().indexOf('k:') != -1) {
				return removeKeyListener(ident);
			}
			if (ident instanceof Array) {
				//call removeListener for each array member
				var i = ident.length; while(i--) {
					r.removeListener(ident[i]);
				}
				return true;
			}
			var listener = listenersByEventId[ident];
			if (! listener) { return false; }
			delete listenersByEventId[ident];
			var listeners = listenersByObjId[listener[0]][listener[1]];
			for (var i = 0, len = listeners.length; i < len; i++) {
				if (listeners[i] == listener) {
					listeners.splice(i, 1);
					break;
				}
			}
			if (! listeners.length) {
				delete listenersByObjId[listener[0]][listener[1]];
			}
			var listenersLeft = false;
			for (var i in listenersByObjId[listener[0]]) { listenersLeft = true; break;	}
			if (! listenersLeft) {
				delete listenersByObjId[listener[0]];
			}
			return true;
		};
		
		/**
		@name glow.events.removeAllListeners 
		@function
		@description Removes all listeners attached to a given object

		@param {String | glow.dom.NodeList | Object | Object[] } detachFrom The object(s) to remove listeners from.
		
			If the parameter is a string, then it is treated as a CSS selector,
			listeners are removed from all nodes.
		
		@returns glow.events
		
		@example
			glow.events.removeAllListeners("#myDiv");
		*/
		r.removeAllListeners = function(obj) {
			var i,
				objId,
				listenerIds = [],
				listenerIdsLen = 0,
				eventName,
				events;
			
			// cater for selector
			if (typeof obj == "string") {
				// get nodes
				obj = $(obj);
			}
			// cater for arrays & nodelists
			if (obj instanceof Array || obj instanceof glow.dom.NodeList) {
				//call removeAllListeners for each array member
				i = obj.length; while(i--) {
					r.removeAllListeners(obj[i]);
				}
				return r;
			}
			
			// get the objects id
			objId = obj[psuedoPrivateEventKey];
			
			// if it doesn't have an id it doesn't have events... return
			if (!objId) {
				return r;
			}
			events = listenersByObjId[objId];
			for (eventName in events) {
				i = events[eventName].length; while(i--) {
					listenerIds[listenerIdsLen++] = events[eventName][i][4];
				}
			}
			// remove listeners for that object
			if (listenerIds.length) {
				r.removeListener( listenerIds );
			}
			return r;
		}

		/**
		@name glow.events.fire
		@function
		@description Fires an event on an object.

		@param {Object} attachedTo The object that the event is associated with.
		
		@param {String} name The name of the event.
		
			Event names should not start with the word 'on'.
			
		@param {Object | glow.events.Event} [event] An event object or properties to add to a default event object
		
			If not specified, a generic event object is created. If you provide a simple
			object, a default Event will be created with the properties from the provided object.
	
		@returns {Object}
		
			The event object.
		
		@example
			// firing a custom event
			Ball.prototype.move = function () {
				// move the ball...
				// check its position
				if (this._height == 0) {
					var event = glow.events.fire(this, 'bounce', {
						bounceCount: this._bounceCount
					});
					
					// handle what to do if a listener returned false
					if ( event.defaultPrevented() ) {
						this.stopMoving();
					}
				}
			};
			
		@example
			// listening to a custom event
			var myBall = new Ball();
			
			glow.events.addListener(myBall, "bounce", function(event) {
				if (event.bounceCount == 3) {
					// stop bouncing after 3 bounces
					return false;
				}
			});
		*/
		r.fire = function (attachedTo, name, e) {
   			if (! attachedTo) throw 'glow.events.fire: required parameter attachedTo not passed (name: ' + name + ')';
   			if (! name) throw 'glow.events.fire: required parameter name not passed';
			if (! e) { e = new r.Event(); }
			if ( e.constructor === Object ) { e = new r.Event( e ) }

			if (typeof attachedTo == 'string') {
				if (! glow.dom) { throw "glow.dom must be loaded to use a selector as the first argument to glow.events.addListener"; }
				attachedTo = $(attachedTo);
			}

			e.type = name;
			e.attachedTo = attachedTo;
			if (! e.source) { e.source = attachedTo; }

			if (attachedTo instanceof glow.dom.NodeList) {

				attachedTo.each(function(i){

					callListeners(attachedTo[i], e);

				});

			} else {

				callListeners(attachedTo, e);

			}

			return e;
		};

		function callListeners(attachedTo, e) {
			
			var objIdent,
				objListeners,
				objEventListeners = objListeners && objListeners[e.type];

			// 3 assignments, but stop assigning if any of them are false
			(objIdent = attachedTo[psuedoPrivateEventKey]) &&
			(objListeners = listenersByObjId[objIdent]) &&
			(objEventListeners = objListeners[e.type]);

			if (! objEventListeners) { return e; }

			var listener;
			var listeners = objEventListeners.slice(0);

			// we make a copy of the listeners before calling them, as the event handlers may
			// remove themselves (took me a while to track this one down)
			for (var i = 0, len = listeners.length; i < len; i++) {
				listener = listeners[i];
				if ( listener[2].call(listener[3] || attachedTo, e) === false ) {
					e.preventDefault();
				}
			}

		}

		/**
		@private
		@name glow.events.addKeyListener
		@deprecated
		@function
		@description Adds an event listener for a keyboard event HELLO.
		
			<p><em>Notes for Opera</em></p>
			
			It is currently impossible to differentiate certain key events in 
			Opera (for example the RIGHT (the right arrow key) and the 
			apostrope (') result in the same code). For this reason pressing 
			either of these keys will result in key listeners specified as 
			"RIGHT" and/or "'" to be fired.
			
			<p><em>Key Identifiers</em></p>
			
			The key param uses the following strings to refer to special keys, 
			i.e. non alpha-numeric keys.
			
			<ul>
			<li>CAPSLOCK</li>
			<li>NUMLOCK</li>
			<li>SCROLLLOCK</li>
			<li>BREAK</li>
			<li>BACKTICK</li>
			<li>BACKSPACE</li>
			<li>PRINTSCREEN</li>
			<li>MENU</li>
			<li>SPACE</li>
			<li>ESC</li>
			<li>TAB</li>
			<li>META</li>
			<li>RIGHTMETA</li>
			<li>ENTER</li>
			<li>F1</li>
			<li>F2</li>
			<li>F3</li>
			<li>F4</li>
			<li>F5</li>
			<li>F6</li>
			<li>F7</li>
			<li>F8</li>
			<li>F9</li>
			<li>F10</li>
			<li>F11</li>
			<li>F12</li>
			<li>INS</li>
			<li>HOME</li>
			<li>PAGEUP</li>
			<li>DEL</li>
			<li>END</li>
			<li>PAGEDOWN</li>
			<li>LEFT</li>
			<li>UP</li>
			<li>RIGHT</li>
			<li>DOWN</li>
			</ul>

		@param {String} key The key or key combination to listen to. 
		
			This parameter starts with modifier keys 'CTRL', 'ALT' and 
			'SHIFT'. Modifiers can appear in any combination and order and are 
			separated by a '+'.
			
			Following any modifiers is the key character. To specify a 
			character code, use the appropriate escape sequence (e.g. 
			"CTRL+\u0065" = CTRL+e"). 
			
			To specify a special key, the key character should be replaced with 
			a key identifier, see description below (e.g. "RIGHT" specifies the 
			right arrow key).
			
		@param {String} type The type of key press to listen to.
			
			Possible values for this parameter are:
			
			<dl>
			<dt>press</dt><dd>the key is pressed (comparable to a mouse click)</dd>
			<dt>down</dt><dd>the key is pushed down</dd>
			<dt>up</dt><dd>the key is released</dd>
			</dl>
		
		@param {Function} callback The function to be called when the event fires.
			
		@param {Object} [context] The execution scope of the callback.
	
			If this parameter is not passed then the attachTo object will be the 
			context of the callback.
	
		@returns {Number}
		
			A unique identifier for the event suitable for passing to 
			{@link glow.events.removeListener}.
		
		@example
			glow.events.addKeyListener("CTRL+ALT+a", "press",
		        function () { alert("CTRL+ALT+a pressed"); }
		    );
			glow.events.addKeyListener("SHIFT+\u00A9", "down",
				function () { alert("SHIFT+© pushed") }
			);
		*/
		var keyRegex = /^((?:(?:ctrl|alt|shift)\+)*)(?:(\w+|.)|[\n\r])$/i;
		r.addKeyListener = function (key, type, callback, context) {
			type.replace(/^key/i, "");
			type = type.toLowerCase();
			if (! (type == 'press' || type == 'down' || type == 'up')) {
				throw 'event type must be press, down or up';
			}
			if (! topKeyListeners[type]) { initTopKeyListener(type); }
			var res = key.match(keyRegex),
				mods = 0,
				charCode;
			if (! res) { throw 'key format not recognised'; }
			if (res[1].toLowerCase().indexOf('ctrl') != -1)  { mods += CTRL;  }
			if (res[1].toLowerCase().indexOf('alt') != -1)   { mods += ALT;   }
			if (res[1].toLowerCase().indexOf('shift') != -1) { mods += SHIFT; }
			var eventKey = mods + ':' + (res[2] ? res[2].toLowerCase() : '\n') + ':' + type;
			var ident = 'k:' + keyListenerId++;
			keyTypes[ident] = eventKey;
			var listeners = keyListeners[eventKey];
			if (! listeners) { listeners = keyListeners[eventKey] = []; }
			listeners[listeners.length] = [ident, type, callback, context];
			return ident;
		};

		/**
		@name  glow.events.Event
		@class
		@param {Object} [properties] Properties to add to the Event instance.
			Each key-value pair in the object will be added to the Event as
			properties
		@description Object passed into all events
			
			Some of the properties described below are only available for 
			certain event types. These are listed in the property descriptions 
			where applicable.
			
			<p><em>Notes for Opera</em></p>
			
			The information returned from Opera about key events does not allow 
			certain keys to be differentiated. This mainly applies to special 
			keys, such as the arrow keys, function keys, etc. which conflict 
			with some printable characters.
			
		*/
		r.Event = function ( obj ) {
			if( obj ) {
				glow.lang.apply( this, obj );
			}
		};
		
		/**
		@name glow.events.Event#attachedTo
		@type Object | Element
		@description The object/element that the listener is attached to.
		
			See the description for 'source' for more details.
		*/
		
		/**
		@name glow.events.Event#source
		@type Element
		@description The actual object/element that the event originated from.
			
			For example, you could attach a listener to an 'ol' element to 
			listen for clicks. If the user clicked on an 'li' the source property 
			would be the 'li' element, and 'attachedTo' would be the 'ol'.
		*/
		
		/**
		@name glow.events.Event#pageX
		@type Number
		@description The horizontal position of the mouse pointer in the page in pixels.
		
			<p><em>Only available for mouse events.</em></p>
		*/
		
		/**
		@name glow.events.Event#pageY
		@type Number
		@description The vertical position of the mouse pointer in the page in pixels.
		
			<p><em>Only available for mouse events.</em></p>
		*/
		
		/**
		@name glow.events.Event#button
		@type Number
		@description  A number representing which button was pressed.
		
			<p><em>Only available for mouse events.</em></p>
			
			0 for the left button, 1 for the middle button or 2 for the right button.
		*/

		/**
		@name glow.events.Event#relatedTarget
		@type Element
		@description The element that the mouse has come from or is going to.
		
			<p><em>Only available for mouse over/out events.</em></p>
		*/
		
		/**
		@name glow.events.Event#wheelDelta
		@type Number
		@description The number of clicks up (positive) or down (negative) that the user moved the wheel.
		
			<p><em>Only available for mouse wheel events.</em></p>
		*/
		
		/**
		@name glow.events.Event#ctrlKey
		@type Boolean
		@description Whether the ctrl key was pressed during the key event.
		
			<p><em>Only available for keyboard events.</em></p>
		*/
		
		/**
		@name glow.events.Event#shiftKey
		@type Boolean
		@description  Whether the shift key was pressed during the key event.
		
			<p><em>Only available for keyboard events.</em></p>
		*/
		
		/**
		@name glow.events.Event#altKey
		@type Boolean
		@description Whether the alt key was pressed during the key event.
		
			<p><em>Only available for keyboard events.</em></p>
		*/
		
		/**
		@name glow.events.Event#capsLock 			
		@type Boolean | Undefined
		@description Whether caps-lock was on during the key event
		
			<p><em>Only available for keyboard events.</em></p>
		
			If the key is not alphabetic, this property will be undefined 
			as it is not possible to tell if caps-lock is on in this scenario.
		*/
		
		/**
		@name glow.events.Event#keyCode
		@type Number
		@description An integer number represention of the keyboard key that was pressed.
		
			<p><em>Only available for keyboard events.</em></p>
		*/
		
		/**
		@name glow.events.Event#key
		@type String | Undefined
		@description  A short identifier for the key for special keys.
		
			<p><em>Only available for keyboard events.</em></p>
			
			If the key was not a special key this property will be undefined.
			
			See the list of key identifiers in {@link glow.events.addKeyListener}
		*/
		
		/**
		@name glow.events.Event#charCode
		@type Number | Undefined
		@description The unicode character code for a printable character.
		
			<p><em>Only available for keyboard events.</em></p>
			
			This will be undefined if the key was not a printable character.
		*/
		
		/**
		@name glow.events.Event#chr
		@type String
		@description A printable character string.
		
			<p><em>Only available for keyboard events.</em></p>
			
			The string of the key that was pressed, for example 'j' or 's'.
			
			This will be undefined if the key was not a printable character.
		*/
		

		/**
		@name glow.events.Event#preventDefault
		@function
		@description Prevent the default action for events. 
		
			This can also be achieved by returning false from an event callback
		
		*/
		r.Event.prototype.preventDefault = function () {
			if (this[psuedoPreventDefaultKey]) { return; }
			this[psuedoPreventDefaultKey] = true;
			if (this.nativeEvent && this.nativeEvent.preventDefault) {
				this.nativeEvent.preventDefault();
				this.nativeEvent.returnValue = false;
			}
		};

		/**
		@name glow.events.Event#defaultPrevented
		@function
		@description Test if the default action has been prevented.
		
		@returns {Boolean}
		
			True if the default action has been prevented.
		*/
		r.Event.prototype.defaultPrevented = function () {
			return !! this[psuedoPreventDefaultKey];
		};

		/**
		@name glow.events.Event#stopPropagation
		@function
		@description Stops the event propagating. 
		
			For DOM events, this stops the event bubbling up through event 
			listeners added to parent elements. The event object is marked as
			having had propagation stopped (see 
			{@link glow.events.Event#propagationStopped propagationStopped}).
		
		@example
			// catch all click events that are not links
			glow.events.addListener(
				document,
				'click',
				function () { alert('document clicked'); }
			);

			glow.events.addListener(
				'a',
				'click',
				function (e) { e.stopPropagation(); }
			);
		*/
		r.Event.prototype.stopPropagation = function () {
			if (this[psuedoStopPropagationKey]) { return; }
			this[psuedoStopPropagationKey] = true;
			var e = this.nativeEvent;
			if (e) {
				e.cancelBubble = true;
				if (e.stopPropagation) { e.stopPropagation(); }
			}
		};

		/**
		@name glow.events.Event#propagationStopped
		@function
		@description Tests if propagation has been stopped for this event.
		
		@returns {Boolean}
		
			True if event propagation has been prevented.

		*/
		r.Event.prototype.propagationStopped = function () {
			return !! this[psuedoStopPropagationKey];
		};
		
		//cleanup to avoid mem leaks in IE
		if (glow.env.ie < 8 || glow.env.webkit < 500) {
			r.addListener(window, "unload", clearEvents);
		}

		glow.events = r;
		glow.events.listenersByObjId = listenersByObjId;
	}
});