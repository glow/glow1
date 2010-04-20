/**
@name glow.anim
@namespace
@description Simple and powerful animations.
@requires glow, glow.tweens, glow.events, glow.dom
@see <a href="../furtherinfo/tweens/">What are tweens?</a>
@see <a href="../furtherinfo/anim/">Guide to creating animations, with interactive examples</a>
*/
(window.gloader || glow).module({
	name: "glow.anim",
	library: ["glow", "@VERSION@"],
	depends: [["glow", "@VERSION@", "glow.tweens", "glow.events", "glow.dom"]],
	builder: function(glow) {
		//private
		var $ = glow.dom.get,
			manager,
			events = glow.events,
			dom = glow.dom,
			get = dom.get,
			hasUnits = /width|height|top$|bottom$|left$|right$|spacing$|indent$|font-size/,
			noNegatives = /width|height|padding|opacity/,
			usesYAxis = /height|top/,
			getUnit = /(\D+)$/,
			testElement = dom.create('<div style="position:absolute;visibility:hidden"></div>');
		
		/*
		  Converts event shortcuts in an options object to real events
		  instance - the object to add events to
		  opts - the options object containing the listener functions
		  eventProps - an array of property names of potential listeners, eg ['onFrame', 'onComplete']
		*/
		function addEventsFromOpts(instance, opts, eventProps) {
			for (var i = 0, len = eventProps.length; i < len; i++) {
				// does opts.onWhatever exist?
				if (opts[ eventProps[i] ]) {
					events.addListener(
						instance,
						// convert "onWhatever" to "whatever"
						eventProps[i].slice(2).toLowerCase(),
						opts[ eventProps[i] ]
					);
				}
			}
		}
		
		(function() {
			var queue = [], //running animations
				queueLen = 0,
				intervalTime = 13, //ms between intervals
				interval; //holds the number for the interval
				
			manager = {
				/**
				@name glow.anim-manager.addToQueue
				@private
				@function
				@description Adds an animation to the queue.
				*/
				addToQueue: function(anim) {
					//add the item to the queue
					queue[queueLen++] = anim;
					anim._playing = true;
					anim._timeAnchor = anim._timeAnchor || new Date().valueOf();
					if (!interval) {
						this.startInterval();
					}
				},
				/**
				@name glow.anim-manager.removeFromQueue
				@private
				@function
				@description Removes an animation from the queue.
				*/
				removeFromQueue: function(anim) {
					for (var i = 0; i < queueLen; i++) {
						if (queue[i] == anim) {
							queue.splice(i, 1);
							anim._timeAnchor = null;
							anim._playing = false;
							//stop the queue if there's nothing in it anymore
							if (--queueLen == 0) {
								this.stopInterval();
							}
							return;
						}
					}
				},
				/**
				@name glow.anim-manager.startInterval
				@private
				@function
				@description Start processing the queue every interval.
				*/
				startInterval: function() {
					interval = window.setInterval(this.processQueue, intervalTime);
				},
				/**
				@name glow.anim-manager.stopInterval
				@private
				@function
				@description Stop processing the queue.
				*/
				stopInterval: function() {
					window.clearInterval(interval);
					interval = null;
				},
				/**
				@name glow.anim-manager.processQueue
				@private
				@function
				@description Animate each animation in the queue.
				*/
				processQueue: function() {
					var anim, i, now = new Date().valueOf();
					for (i = 0; i < queueLen; i++) {
						anim = queue[i];
						if (anim.position == anim.duration) {
							manager.removeFromQueue(anim);
							//need to decrement the index because we've just removed an item from the queue
							i--;
							events.fire(anim, "complete");
							if (anim._opts.destroyOnComplete) {
								anim.destroy();
							}
							continue;
						}
						if (anim.useSeconds) {
							anim.position = (now - anim._timeAnchor) / 1000;
							if (anim.position > anim.duration) {
								anim.position = anim.duration;
							}
						} else {
							anim.position++;
						}
						anim.value = anim.tween(anim.position / anim.duration);
						events.fire(anim, "frame");
					}
				}
			};
		})();

		/**
		@name glow.anim.convertCssUnit
		@private
		@function
		@param {nodelist} element
		@param {string|number} fromValue Assumed pixels.
		@param {string} toUnit (em|%|pt...)
		@param {string} axis (x|y)
		@description Converts a css unit.

		We need to know the axis for calculating relative values, since they're
		relative to the width / height of the parent element depending
		on the situation.

		*/
		function convertCssUnit(element, fromValue, toUnit, axis) {
			var elmStyle = testElement[0].style,
				axisProp = (axis == "x") ? "width" : "height",
				startPixelValue,
				toUnitPixelValue;
			//reset stuff that may affect the width / height
			elmStyle.margin = elmStyle.padding = elmStyle.border = "0";
			startPixelValue = testElement.css(axisProp, fromValue).insertAfter(element)[axisProp]();
			//using 10 of the unit then dividing by 10 to increase accuracy
			toUnitPixelValue = testElement.css(axisProp, 10 + toUnit)[axisProp]() / 10;
			testElement.remove();
			return startPixelValue / toUnitPixelValue;
		}

		/**
		@name glow.anim.keepWithinRange
		@private
		@function
		@param num
		@param [start]
		@param [end]
		@description
		Takes a number then an (optional) lower range and an (optional) upper range. If the number
		is outside the range the nearest range boundary is returned, else the number is returned.
		*/
		function keepWithinRange(num, start, end) {
			if (start !== undefined && num < start) {
				return start;
			}
			if (end !== undefined && num > end) {
				return end;
			}
			return num;
		}

		/**
		@name glow.anim.buildAnimFunction
		@private
		@function
		@param element
		@param spec
		@description Builds a function for an animation.
		*/
		function buildAnimFunction(element, spec) {
			var cssProp,
				r = ["a=(function(){"],
				rLen = 1,
				fromUnit,
				unitDefault = [0,"px"],
				to,
				from,
				unit,
				a;

			for (cssProp in spec) {
				r[rLen++] = 'element.css("' + cssProp + '", ';
				//fill in the blanks
				if (typeof spec[cssProp] != "object") {
					to = spec[cssProp];
				} else {
					to = spec[cssProp].to;
				}
				if ((from = spec[cssProp].from) === undefined) {
					if (cssProp == "font-size" || cssProp == "background-position") {
						throw new Error("From value must be set for " + cssProp);
					}
					from = element.css(cssProp);
				}
				//TODO help some multi value things?
				if (hasUnits.test(cssProp)) {
					//normalise the units for unit-ed values
					unit = (getUnit.exec(to) || unitDefault)[1];
					fromUnit = (getUnit.exec(from) || unitDefault)[1];
					//make them numbers, we have the units seperate
					from = parseFloat(from) || 0;
					to = parseFloat(to) || 0;
					//if the units don't match, we need to have a play
					if (from && unit != fromUnit) {
						if (cssProp == "font-size") {
							throw new Error("Units must be the same for font-size");
						}
						from = convertCssUnit(element, from + fromUnit, unit, usesYAxis.test(cssProp) ? "y" : "x");
					}
					if (noNegatives.test(cssProp)) {
						r[rLen++] = 'keepWithinRange((' + (to - from) + ' * this.value) + ' + from + ', 0) + "' + unit + '"';
					} else {
						r[rLen++] = '(' + (to - from) + ' * this.value) + ' + from + ' + "' + unit + '"';
					}
				} else if (! (isNaN(from) || isNaN(to))) { //both pure numbers
					from = Number(from);
					to = Number(to);
					r[rLen++] = '(' + (to - from) + ' * this.value) + ' + from;
				} else if (cssProp.indexOf("color") != -1) {
					to = dom.parseCssColor(to);
					if (! glow.lang.hasOwnProperty(from, "r")) {
						from = dom.parseCssColor(from);
					}
					r[rLen++] = '"rgb(" + keepWithinRange(Math.round(' + (to.r - from.r) + ' * this.value + ' + from.r +
						'), 0, 255) + "," + keepWithinRange(Math.round(' + (to.g - from.g) + ' * this.value + ' + from.g +
						'), 0, 255) + "," + keepWithinRange(Math.round(' + (to.b - from.b) + ' * this.value + ' + from.b +
						'), 0, 255) + ")"';
				} else if (cssProp == "background-position") {
					var vals = {},
						fromTo = ["from", "to"],
						unit = (getUnit.exec(from) || unitDefault)[1];
					vals.fromOrig = from.toString().split(/\s/);
					vals.toOrig = to.toString().split(/\s/);

					if (vals.fromOrig[1] === undefined) {
						vals.fromOrig[1] = "50%";
					}
					if (vals.toOrig[1] === undefined) {
						vals.toOrig[1] = "50%";
					}

					for (var i = 0; i < 2; i++) {
						vals[fromTo[i] + "X"] = parseFloat(vals[fromTo[i] + "Orig"][0]);
						vals[fromTo[i] + "Y"] = parseFloat(vals[fromTo[i] + "Orig"][1]);
						vals[fromTo[i] + "XUnit"] = (getUnit.exec(vals[fromTo[i] + "Orig"][0]) || unitDefault)[1];
						vals[fromTo[i] + "YUnit"] = (getUnit.exec(vals[fromTo[i] + "Orig"][1]) || unitDefault)[1];
					}

					if ((vals.fromXUnit !== vals.toXUnit) || (vals.fromYUnit !== vals.toYUnit)) {
						throw new Error("Mismatched axis units cannot be used for " + cssProp);
					}

					r[rLen++] = '(' + (vals.toX - vals.fromX) + ' * this.value + ' + vals.fromX + ') + "' + vals.fromXUnit + ' " + (' +
								(vals.toY - vals.fromY) + ' * this.value + ' + vals.fromY + ') + "' + vals.fromYUnit + '"';
				}
				r[rLen++] = ');';
			}
			r[rLen++] = "})";
			return eval(r.join(""));
		}

		//public
		var r = {}; //return object

		/**
		@name glow.anim.css
		@function
		@description Animates CSS properties of an element.
		@param {String | glow.dom.NodeList | Element} element Element to animate.

			This can be a CSS selector (first match will be used),
			{@link glow.dom.NodeList} (first node will be used), or a DOM element.

		@param {Number} duration Animation duration, in seconds by default.

		@param {Object} spec An object describing the properties to animate.

			This object should consist of property names corresponding to the
			CSS properties you wish to animate, and values which are objects
			with 'from' and 'to' properties with the values to animate between
			or a number/string representing the value to animate to.

			If the 'from' property is absent, the elements current CSS value
			will be used instead.

			See the spec example below for more information.

		@param {Object} opts Optional options object.

		@param {Boolean} [opts.useSeconds=true] Specifies whether duration should be in seconds rather than frames.

		@param {Function} [opts.tween=linear tween] The way the value moves through time. See {@link glow.tweens}.
		
		@param {Boolean} [opts.destroyOnComplete=false] Destroy the animation once it completes?
			This will free any DOM references the animation may have created. Once
			the animation completes, you won't be able to start it again.
			
		@param {Function} [opts.onStart] Shortcut for adding a "start" event listener
		@param {Function} [opts.onFrame] Shortcut for adding a "frame" event listener
		@param {Function} [opts.onStop] Shortcut for adding a "stop" event listener
		@param {Function} [opts.onComplete] Shortcut for adding a "complete" event listener
		@param {Function} [opts.onResume] Shortcut for adding a "resume" event listener
		
		@example
		// an example of an spec object
		{
			"height": {from: "10px", to: "100px"},
			"width": "100px",
			"font-size": {from: "0.5em", to: "1.3em"}
		}

		@example
		// animate an elements height and opacity to 0 from current values over 1 second
		glow.anim.css("#myElement", 1, {
			"height" : 0,
			"opacity" : 0
		}).start();

		@returns {glow.anim.Animation}
		*/
		r.css = function(element, duration, spec, opts) {

			element = get(element);

			var anim = new r.Animation(duration, opts);

			// Fix for trac 156 - glow.anim.css should fail better if the element doesn't exist
			if (element[0]) {
				events.addListener(anim, "frame", buildAnimFunction(element, spec));
			}
			return anim;
		};
		
		/**
		@name glow.anim-slideElement
		@private
		@function
		@param {String | glow.dom.NodeList} element Element to animate. CSS Selector can be used.
		@param {Number} duration Animation duration in seconds.
		@param {String} action Either "down", "up" or "toggle" for the direction of the slide
		@param {Object} [opts] Options object
		@param {Function} [opts.tween=easeBoth tween] The way the value moves through time. See {@link glow.tweens}.
		@param {Function} [opts.onStart] The function to be called when the first element in the NodeList starts the animation.  
		@param {Function} [opts.onComplete] The function to be called when the first element in the NodeList completes the animation.
		@description Builds a function for an animation.
		*/
		slideElement = function slideElement(element, duration, action, opts) {
			duration = duration || 0.5;
			// normalise 'element' to NodeList
			element = $(element);
			
			opts = glow.lang.apply({
				tween: glow.tweens.easeBoth(),
				onStart: function(){},
				onComplete: function(){}
			}, opts);
			
			var i = 0,
				thatlength = element.length,
				completeHeight,
				fromHeight,
				channels = [],
				timeline;
			
			for(; i < thatlength; i++) {
				if (action == "up" || (action == "toggle" && element.slice(i, i+1).height() > 0)) {
					element[i].style.overflow = 'hidden';
					// give the element layout in IE
					if (glow.env.ie < 8) {
						element[i].style.zoom = 1;
					}
					completeHeight = 0;
					fromHeight = element.slice(i, i+1).height();
				} else if (action == "down" || (action == "toggle" && element.slice(i, i+1).height() == 0)) {
					fromHeight = element.slice(i, i+1).height();
					element[i].style.height = '';
					completeHeight = element.slice(i, i+1).height();
					// what if the height is set to 0 in the CSS?
					if (completeHeight === 0) {
						element[i].style.height = 'auto';
						completeHeight = element.slice(i, i+1).height();
					}
					element[i].style.height = fromHeight + "px";
				}

				channels[i] = [
					glow.anim.css(element[i], duration, {
						'height': {from: fromHeight, to: completeHeight}
					}, { tween: opts.tween })
				];

			}
			
			timeline = new glow.anim.Timeline(channels, {
				destroyOnComplete: true
			});
			
			events.addListener(timeline, "complete", function() {
				// return heights to "auto" for slide down
				element.each(function() {
					if (this.style.height.slice(0,1) != "0") {
						this.style.height = '';
						if ( glow.dom.get(this).height() === 0 ) {
							this.style.height = 'auto';
						}
					}
				})
			});
			
			events.addListener(timeline, "start", opts.onStart);
			events.addListener(timeline, "complete", opts.onComplete);
			
			// return & start our new timeline
			return timeline.start();
		};

		/**
		@name glow.anim.slideDown
		@function
		@description Slide a NodeList down from a height of 0 
		
		@param {String | glow.dom.NodeList} element Element to animate. CSS Selector can be used.
		
		@param {Number} duration Animation duration in seconds.
		
		@param {Function} opts Object
		 
		@param {Function} [opts.tween=easeBoth tween] The way the value moves through time. See {@link glow.tweens}.
		  
		@param {Function} [opts.onStart] The function to be called when the first element in the NodeList starts the animation.  
		 
		@param {Function} [opts.onComplete] The function to be called when the first element in the NodeList completes the animation.
		
		@returns {glow.anim.Timeline}
		
			A started timeline
		
		@example
		
			glow.anim.slideDown("#menu", 1);
		 		 
		**/	
		r.slideDown = function(element, duration, opts) {
			return slideElement(element, duration, 'down', opts);
		};

		/**
		@name glow.anim.slideUp
		@function
		@description Slide a NodeList up to a height of 0 
		
		@param {String | glow.dom.NodeList} element Element to animate. CSS Selector can be used.
		
		@param {Number} duration Animation duration in seconds.
		
		@param {Function} opts Object
		 
		@param {Function} [opts.tween=easeBoth tween] The way the value moves through time. See {@link glow.tweens}.
		  
		@param {Function} [opts.onStart] The function to be called when the first element in the NodeList starts the animation.  
		 
		@param {Function} [opts.onComplete] The function to be called when the first element in the NodeList completes the animation.
		
		@returns {glow.anim.Timeline}
		
			A started timeline
		
		@example
		  		
			glow.anim.slideUp("#menu", 1);
		 		 
		**/		
		r.slideUp = function(element, duration, opts) {
			return slideElement(element, duration, 'up', opts);
		};
		
		/**
		@name glow.anim.slideToggle
		@function
		@description Toggle a NodeList Up or Down depending on it's present state. 
		
		@param {String | glow.dom.NodeList} element Element to animate. CSS Selector can be used.
		
		@param {Number} duration Animation duration in seconds.
		
		@param {Function} opts Object
		 
		@param {Function} [opts.tween=easeBoth tween] The way the value moves through time. See {@link glow.tweens}.
		  
		@param {Function} [opts.onStart] The function to be called when the first element in the NodeList starts the animation.  
		 
		@param {Function} [opts.onComplete] The function to be called when the first element in the NodeList completes the animation.
		
		@returns {glow.anim.Timeline}
		
			A started timeline
		
		@example
		  		
			glow.anim.slideToggle("#menu", 1);
		 		 
		**/			
		r.slideToggle = function(element, duration, opts) {
			return slideElement(element, duration, 'toggle', opts);
		};


		/**
		@name glow.anim.fadeOut
		@function
		@description Fade out a set of elements 
		
		@param {String | glow.dom.NodeList} element Element to animate. CSS Selector can be used.
		
		@param {Number} duration Animation duration in seconds.
		
		@param {Function} opts Object
		 
		@param {Function} [opts.tween=easeBoth tween] The way the value moves through time. See {@link glow.tweens}.
		  
		@param {Function} [opts.onStart] The function to be called when the first element in the NodeList starts the animation.  
		 
		@param {Function} [opts.onComplete] The function to be called when the first element in the NodeList completes the animation.
		
		@returns {glow.anim.Timeline}
		
			A started timeline
		
		@example
		  		
			glow.anim.fadeOut("#menu", 1);
		 		 
		**/
		r.fadeOut = function(element, duration, opts) {
			return r.fadeTo(element, 0, duration, opts)
        };
		
		/**
		@name glow.anim.fadeIn
		@function
		@description Fade in a set of elements 
		 
		@param {String | glow.dom.NodeList} element Element to animate. CSS Selector can be used.
		
		@param {Number} duration Animation duration in seconds.
		  
		@param {Function} opts Object
		 
		@param {Function} [opts.tween=easeBoth tween] The way the value moves through time. See {@link glow.tweens}.
		  
		@param {Function} [opts.onStart] The function to be called when the first element in the NodeList starts the animation.  
		 
		@param {Function} [opts.onComplete] The function to be called when the first element in the NodeList completes the animation.
		
		@returns {glow.anim.Timeline}
		
			A started timeline
		
		@example
		  		
			glow.anim.fadeIn("#menu", 1);
		 		 
		**/
		r.fadeIn = function(element, duration, opts){
			return r.fadeTo(element, 1, duration, opts);
        };
		
		/**
		@name glow.anim.fadeTo
		@function
		@description Fade a set of elements to a given opacity
		 
		@param {String | glow.dom.NodeList} element Element to animate. CSS Selector can be used.
		 
		@param {Number} opacity fade to opacity level between 0 & 1. 
		 
		@param {Number} duration Animation duration in seconds.
		  
		@param {Function} opts Object
		 
		@param {Function} [opts.tween=easeBoth tween] The way the value moves through time. See {@link glow.tweens}.
		  
		@param {Function} [opts.onStart] The function to be called when the first element in the NodeList starts the animation.  
		 
		@param {Function} [opts.onComplete] The function to be called when the first element in the NodeList completes the animation.
		
		@returns {glow.anim.Timeline}
		
			A started timeline
		
		@example
		  		
			glow.anim.fadeTo("#menu", 0.5, 1);
		 		 
		**/
		r.fadeTo = function(element, opacity, duration, opts){
			duration = duration || 0.5;
			// normalise 'element' to NodeList
			element = $(element);
			
			opts = glow.lang.apply({
				tween: glow.tweens.easeBoth(),
				onStart: function(){},
				onComplete: function(){}
			}, opts);
			
			var i = 0,
				thatlength = element.length,
				channels = [],
				timeline;
			
			for(; i < thatlength; i++) {
				channels[i] = [
					glow.anim.css(element[i], duration, {
						'opacity': opacity
					}, { tween: opts.tween })
				];
			}
			
			timeline = new glow.anim.Timeline(channels, {
				destroyOnComplete: true
			});
			
			events.addListener(timeline, "start", opts.onStart);
			events.addListener(timeline, "complete", opts.onComplete);
			
			// return & start our new timeline
			return timeline.start();
        };
        

		/**
		@name glow.anim.highlight
		@function
		@description	Highlight an element by fading the background colour
		 
		@param {String | glow.dom.NodeList} element Element to animate. CSS Selector can be used.
		
		@param {String} highlightColour highlight colour in hex, "rgb(r, g, b)" or css colour name. 
		 
		@param {Number} duration Animation duration in seconds.
		  
		@param {Function} opts Object
		 
		@param {Function} [opts.completeColour] The background colour of the element once the highlight is complete.
		
		 				  If none supplied Glow assumes the element's existing background color (e.g. #336699),
		 				  if the element has no background color specified (e.g. Transparent)
		 				  the highlight will transition to white.
		
		@param {Function} [opts.tween=easeBoth tween] The way the value moves through time. See {@link glow.tweens}.
		  
		@param {Function} [opts.onStart] The function to be called when the first element in the NodeList starts the animation.  
		 
		@param {Function} [opts.onComplete] The function to be called when the first element in the NodeList completes the animation.
		
		@returns {glow.anim.Timeline}
		
			A started timeline
		
		@example
		  		
			glow.anim.highlight("#textInput", "#ff0", 1);
		**/
		r.highlight = function(element, highlightColour, duration, opts){
			// normalise element
			element = $(element);
			
			duration = duration || 1;
			highlightColour = highlightColour || '#ffff99';
			
			opts = glow.lang.apply({
				tween: glow.tweens.easeBoth(),
				onStart: function(){},
				onComplete: function(){}
			}, opts);
			
			var i = 0, 
				transArray = [],
				elmsLength = element.length,
				completeColour,
				channels = [],
				timeline;
			
			for(; i < elmsLength; i++) {
				
				completeColour = opts.completeColour || element.slice(i, i+1).css("background-color");

				if (completeColour == "transparent" || completeColour == "") { 
					completeColour = "#fff";
				}
				channels[i] = [
					r.css(element[i], duration, {
						"background-color" : {from:highlightColour, to:completeColour}
					}, {tween: opts.tween})
				];
			}
			
			timeline = new glow.anim.Timeline(channels, {
				destroyOnComplete: true
			});
			
			events.addListener(timeline, "start", opts.onStart);
			events.addListener(timeline, "complete", opts.onComplete);
			return timeline.start();
        };

		/**
		@name glow.anim.Animation
		@class
		@description Controls modifying values over time.

			You can create an animation instance using the constructor, or use
			one of the helper methods in {@link glow.anim}.

			Once you have created your animation instance, you can use
			events such as "frame" to change values over time.

		@param {Number} duration Length of the animation in seconds / frames.

			Animations which are given a duration in seconds may drop frames to
			finish in the given time.

		@param {Object} opts Object of options.

		@param {Boolean} [opts.useSeconds=true] Specifies whether duration should be in seconds rather than frames.

		@param {Function} [opts.tween=linear tween] The way the value moves through time.

			See {@link glow.tweens}.
			
		@param {Boolean} [opts.destroyOnComplete=false] Destroy the animation once it completes?
			This will free any DOM references the animation may have created. Once
			the animation completes, you won't be able to start it again.
			
		@param {Function} [opts.onStart] Shortcut for adding a "start" event listener
		@param {Function} [opts.onFrame] Shortcut for adding a "frame" event listener
		@param {Function} [opts.onStop] Shortcut for adding a "stop" event listener
		@param {Function} [opts.onComplete] Shortcut for adding a "complete" event listener
		@param {Function} [opts.onResume] Shortcut for adding a "resume" event listener

		@example
			var myAnim = new glow.anim.Animation(5, {
				tween:glow.tweens.easeBoth()
			});

		*/

		/**
		@name glow.anim.Animation#event:start
		@event
		@description Fired when the animation is started from the beginning.
		@param {glow.events.Event} event Event Object
		@example
			var myAnim = new glow.anim.Animation(5, {
				tween:glow.tweens.easeBoth()
			});
			glow.events.addListener(myAnim, "start", function() {
				alert("Started animation which lasts " + this.duration + " seconds");
			});
			myAnim.start();
		*/

		/**
		@name glow.anim.Animation#event:frame
		@event
		@description Fired in each frame of the animation.

			This is where you'll specify what your animation does.
		
		@param {glow.events.Event} event Event Object
		@example
			var myAnim = new glow.anim.Animation(5, {
				tween:glow.tweens.easeBoth()
			});
			
			var myDiv = glow.dom.get("#myDiv"),
			    divStartHeight = myDiv.height(),
			    divEndHeight = 500,
			    divHeightChange = divEndHeight - divStartHeight;

			glow.events.addListener(myAnim, "frame", function() {
				myDiv.height(divStartHeight + (divHeightChange * this.value));
			});
			myAnim.start();
		*/

		/**
		@name glow.anim.Animation#event:stop
		@event
		@description Fired when the animation is stopped before its end.

			If your listener prevents the default action (for instance,
			by returning false) the animation will not be stopped.
		
		@param {glow.events.Event} event Event Object
		*/

		/**
		@name glow.anim.Animation#event:complete
		@event
		@description Fired when the animation ends.
		@param {glow.events.Event} event Event Object
		*/

		/**
		@name glow.anim.Animation#event:resume
		@event
		@description Fired when the animation resumes after being stopped.

			If your listener prevents the default action (for instance, by
			returning false) the animation will not be resumed.

		@param {glow.events.Event} event Event Object
		*/
		// constructor items that relate to events
		var animationEventConstructorNames = ["onStart", "onStop", "onComplete", "onResume", "onFrame"];
		
		r.Animation = function(duration, opts) {
			this._opts = opts = glow.lang.apply({
				useSeconds: true,
				tween: glow.tweens.linear(),
				destroyOnComplete: false,
				onStart: null,
				onStop: null,
				onComplete: null,
				onResume: null,
				onFrame: null
			}, opts);

			/**
			@name glow.anim.Animation#_playing
			@type Boolean
			@private
			@default false
			@description Indicates whether the animation is playing.
			*/
			this._playing = false;

			/**
			@name glow.anim.Animation#_timeAnchor
			@type Number
			@private
			@default null
			@description A timestamp used to keep the animation in the right position.
			*/
			this._timeAnchor = null;

			/**
			@name glow.anim.Animation#duration
			@type Number
			@description Length of the animation in seconds / frames.
			*/
			this.duration = duration;

			/**
			@name glow.anim.Animation#useSeconds
			@type Boolean
			@description Indicates whether duration is in seconds rather than frames.
			*/
			this.useSeconds = opts.useSeconds;

			/**
			@name glow.anim.Animation#tween
			@type Function
			@description The tween used by the animation.
			*/
			this.tween = opts.tween;

			/**
			@name glow.anim.Animation#position
			@type Number
			@default 0
			@description Seconds since starting, or current frame.
			*/
			this.position = 0;

			/**
			@name glow.anim.Animation#value
			@type Number
			@default 0
			@description Current tweened value of the animation, usually between 0 & 1.
				The value may become greater than 1 or less than 0 depending
				on the tween used.
				
				{@link glow.tweens.elasticOut} for instance will result
				in values higher than 1, but will still end at 1.
			*/
			this.value = 0;
			
			// add events from constructor opts
			addEventsFromOpts(this, opts, animationEventConstructorNames);
		};
		r.Animation.prototype = {

			/**
			@name glow.anim.Animation#start
			@function
			@description Starts playing the animation from the beginning.
			@example
				var myAnim = new glow.anim.Animation(5, {
					tween:glow.tweens.easeBoth()
				});
				//attach events here
				myAnim.start();
			@returns {glow.anim.Animation}
			*/
			start: function() {
				if (this._playing) {
					this.stop();
				}
				var e = events.fire(this, "start");
				if (e.defaultPrevented()) { return this; }
				this._timeAnchor = null;
				this.position = 0;
				manager.addToQueue(this);

				return this;
			},

			/**
			@name glow.anim.Animation#stop
			@function
			@description Stops the animation playing.
			@returns {glow.anim.Animation}
			*/
			stop: function() {
				if (this._playing) {
					var e = events.fire(this, "stop");
					if (e.defaultPrevented()) { return this; }
					manager.removeFromQueue(this);
				}
				return this;
			},
			
			/**
			@name glow.anim.Animation#destroy
			@function
			@description Destroys the animation & detaches references to DOM nodes
				Call this on animations you no longer need to free memory.
			@returns {glow.anim.Animation}
			*/
			destroy: function() {
				// stop the animation in case it's still playing
				this.stop();
				events.removeAllListeners(this);
				return this;
			},

			/**
			@name glow.anim.Animation#resume
			@function
			@description Resumes the animation from where it was stopped.
			@returns {glow.anim.Animation}
			*/
			resume: function() {
				if (! this._playing) {
					var e = events.fire(this, "resume");
					if (e.defaultPrevented()) { return this; }
					//set the start time to cater for the pause
					this._timeAnchor = new Date().valueOf() - (this.position * 1000);
					manager.addToQueue(this);
				}
				return this;
			},

			/**
			@name glow.anim.Animation#isPlaying
			@function
			@description Returns true if the animation is playing.
			@returns {Boolean}
			*/
			isPlaying: function() {
				return this._playing;
			},
			/**
			@name glow.anim.Animation#goTo
			@function
			@description Goes to a specific point in the animation.
			@param {Number} pos Position in the animation to go to.

				This should be in the same units as the duration of your
				animation (seconds or frames).

			@example
				var myAnim = new glow.anim.Animation(5, {
					tween:glow.tweens.easeBoth()
				});
				//attach events here
				//start the animation from half way through
				myAnim.goTo(2.5).resume();
			@returns this
			*/
			goTo: function(pos) {
				this._timeAnchor = new Date().valueOf() - ((this.position = pos) * 1000);
				this.value = this.tween(this.duration && this.position / this.duration);
				events.fire(this, "frame");
				return this;
			}
		};

		/**
		@name glow.anim.Timeline
		@class
		@description Synchronises and chains animations.
		@param {Array | Array[]} channels An array of channels or a single channel.

			A channel is defined as an array containing numbers, animations and
			functions.

			Numbers indicate a number of seconds to wait before proceeding to
			the next item. Animations will be played, when the animation is
			complete the next item is processed. Functions will be called, then
			the next item is processed.

		@param {Object} opts An object of options.
		@param {Boolean} [opts.loop=false] Specifies whether the timeline loops.

			The "complete" event does not fire for looping animations.
			
		@param {Boolean} [opts.destroyOnComplete=false] Destroy the animation once it completes?
			This will free any DOM references the animation may have created. Once
			the animation completes, you won't be able to start it again.
			
		@param {Function} [opts.onStart] Shortcut for adding a "start" event listener
		@param {Function} [opts.onStop] Shortcut for adding a "stop" event listener
		@param {Function} [opts.onComplete] Shortcut for adding a "complete" event listener
		@param {Function} [opts.onResume] Shortcut for adding a "resume" event listener

		@example
			// in the simplest form, a timeline can be used to
			// string multiple animations together:
			

			// make our animations
			var moveUp = glow.anim.css(myDiv, 2, {
				"top": {to:"0"}
			});
			var moveDown = glow.anim.css(myDiv, 1, {
				"top": {to:"100px"}
			});
			// string them together
			new glow.anim.Timeline([moveUp, moveDown]).start();

		@example
			// if you wanted a one second gap between the animations, the last line would be:
			new glow.anim.Timeline([moveUp, 1, moveDown]).start();

		@example
			// you can run animations simutainiously with multiple channels.
			new glow.anim.Timeline([
				[moveDivUp, 1, moveDivDown],
				[moveListDown, 1, moveListUp]
			]).start();
		@see <a href="../furtherinfo/animtimeline/">Creating a mexican wave with an animation timeline</a>
		*/
		/**
		@name glow.anim.Timeline#event:start
		@event
		@description Fired when the timeline is started from the beginning.

			This event will also trigger during each loop of a looping animation.
			If your listener prevents the default action (for instance, by
			returning false) the timeline will not start.
		
		@param {glow.events.Event} event Event Object
		@example
			var myTimeline = new glow.anim.Timeline([anim1, anim2]);
			glow.events.addListener(myTimeline, "start", function() {
				alert("Started timeline");
			});
			myTimeline.start();
		*/
		/**
		@name glow.anim.Timeline#event:stop
		@event
		@description Fired when the timeline is stopped before its end.

			If your listener prevents the default action (for instance, by
			returning false) the timeline will not stop.
		
		@param {glow.events.Event} event Event Object
		*/
		/**
		@name glow.anim.Timeline#event:complete
		@event
		@description Fired when the timeline ends.

			This event does not fire on looping timelines.
		
		@param {glow.events.Event} event Event Object
		*/
		/**
		@name glow.anim.Timeline#event:resume
		@event
		@description Fired when the timeline resumes after being stopped.

			If your listener prevents the default action (for instance, by
			returning false) the timeline will not resume.
		
		@param {glow.events.Event} event Event Object
		*/
		var timelineEventConstructorNames = ["onStart", "onStop", "onComplete", "onResume"];
		r.Timeline = function(channels, opts) {
			this._opts = opts = glow.lang.apply({
				loop: false,
				destroyOnComplete: false,
				onStart: null,
				onStop: null,
				onComplete: null,
				onResume: null
			}, opts);
			/*
			PrivateProperty: _channels
				Array of channels
			*/
			//normalise channels so it's always an array of array(s)
			this._channels = (channels[0] && channels[0].push) ? channels : [channels];
			/*
			PrivateProperty: _channelPos
				index of each currently playing animation
			*/
			this._channelPos = [];
			/*
			PrivateProperty: _playing
				Is the timeline playing?
			*/
			this._playing = false;

			/**
			@name glow.anim.Timeline#loop
			@type Boolean
			@description Inidcates whether the timeline loops.

				The "complete" event does not fire for looping animations.
				This can be set while a timeline is playing.
			*/
			this.loop = opts.loop;

			var i, j, iLen, jLen,
				channel,
				allChannels = this._channels,
				totalDuration = 0,
				channelDuration;

			//process channels
			for (i = 0, iLen = allChannels.length; i < iLen; i++) {
				channel = allChannels[i];
				channelDuration = 0;
				for (j = 0, jLen = channel.length; j < jLen; j++) {
					//create a blank animation for time waiting
					if (typeof channel[j] == "number") {
						channel[j] = new r.Animation(channel[j]);
					}
					if (channel[j] instanceof r.Animation) {
						if (! channel[j].useSeconds) {
							throw new Error("Timelined animations must be timed in seconds");
						}
						channel[j]._timelineOffset = channelDuration * 1000;
						channelDuration += channel[j].duration;
						channel[j]._channelIndex = i;
					}
				}
				/**
				@name glow.anim.Timeline#duration
				@type Number
				@description Length of the animation in seconds
				*/
				this.duration = totalDuration = Math.max(channelDuration, totalDuration);
			}
			/*
			PrivateProperty: _controlAnim
				This is used to keep the animation in time
			*/
			this._controlAnim = new r.Animation(totalDuration);
			events.addListener(this._controlAnim, "frame", this._processFrame, this);
			events.addListener(this._controlAnim, "complete", this._complete, this);
			
			// add events from constructor
			addEventsFromOpts(this, opts, timelineEventConstructorNames);
		};
		r.Timeline.prototype = {
			/*
			PrivateMethod: _advanceChannel
				Move to the next position in a particular channel
			*/
			_advanceChannel: function(i) {
				//is there a next animation in the channel?
				var currentAnim = this._channels[i][this._channelPos[i]],
					nextAnim = this._channels[i][++this._channelPos[i]];

				if (currentAnim && currentAnim._playing) {
					currentAnim._playing = false;
					events.fire(currentAnim, "complete");
					if (currentAnim._opts.destroyOnComplete) {
						currentAnim.destroy();
					}
				}
				if ((nextAnim) !== undefined) {
					if (typeof nextAnim == "function") {
						nextAnim();
						this._advanceChannel(i);
					} else {
						nextAnim.position = 0;
						nextAnim._channelIndex = i;
						events.fire(nextAnim, "start");
						nextAnim._playing = true;
					}
				}
			},
			_complete: function() {
				if (this.loop) {
					this.start();
					return;
				}
				this._playing = false;
				events.fire(this, "complete");
				if (this._opts.destroyOnComplete) {
					this.destroy();
				}
			},
			_processFrame: function() {
				var i, len, anim, controlAnim = this._controlAnim,
					msFromStart = (new Date().valueOf()) - controlAnim._timeAnchor;

				for (i = 0, len = this._channels.length; i < len; i++) {
					if (! (anim = this._channels[i][this._channelPos[i]])) { continue; }
					anim.position = (msFromStart - anim._timelineOffset) / 1000;
					if (anim.position > anim.duration) {
						anim.position = anim.duration;
					}
					anim.value = anim.tween(anim.position / anim.duration);
					events.fire(anim, "frame");
					if (anim.position == anim.duration) {
						this._advanceChannel(i);
					}
				}
			},

			/**
			@name glow.anim.Timeline#start
			@function
			@description Starts playing the timeline from the beginning.
			@returns this
			*/
			start: function() {
				var e = events.fire(this, "start");
				if (e.defaultPrevented()) { return this; }
				var i, iLen, j, jLen, anim;
				this._playing = true;
				for (i = 0, iLen = this._channels.length; i < iLen; i++) {
					this._channelPos[i] = -1;
					this._advanceChannel(i);
					for (j = this._channels[i].length; j; j--) {
						anim = this._channels[i][j];
						if (anim instanceof r.Animation) {
							anim.goTo(0);
						}
					}
				}
				this._controlAnim.start();
				return this;
			},

			/**
			@name glow.anim.Timeline#stop
			@function
			@description Stops the timeline.
			@returns this
			*/
			stop: function() {
				if (this._playing) {
					var e = events.fire(this, "stop");
					if (e.defaultPrevented()) { return this; }
					this._playing = false;
					var anim;
					for (var i = 0, len = this._channels.length; i<len; i++) {
						anim = this._channels[i][this._channelPos[i]];
						if (anim instanceof r.Animation && anim._playing) {
							events.fire(anim, "stop");
							anim._playing = false;
						}
					}
					this._controlAnim.stop();
				}
				return this;
			},
			
			/**
			@name glow.anim.Timeline#destroy
			@function
			@description Destroys the timeline & animations within it
				Call this on timeline you no longer need to free memory.
			@returns this
			*/
			destroy: function() {
				var i, j;
				// stop the animation in case it's still playing
				this.stop();
				events.removeAllListeners(this);
				this._controlAnim.destroy();
				
				// loop through all the channels
				i = this._channels.length; while (i--) {
					// loop through all the animations
					j = this._channels[i].length; while (j--) {
						// check it has a destroy method (making sure it's an animation & not a function)
						if (this._channels[i][j].destroy) {
							// DESTROYYYYY!
							this._channels[i][j].destroy();
						}
					}
				}
				return this;
			},

			/**
			@name glow.anim.Timeline#resume
			@function
			@description Resumes the timeline from wherever it was stopped.
			@returns this
			*/
			resume: function() {
				if (! this._playing) {
					var e = events.fire(this, "resume");
					if (e.defaultPrevented()) { return this; }
					this._playing = true;
					var anim;
					for (var i = 0, len = this._channels.length; i<len; i++) {
						anim = this._channels[i][ this._channelPos[i] ];
						if (anim instanceof r.Animation && !anim._playing) {
							events.fire(anim, "resume");
							anim._playing = true;
						}
					}
					this._controlAnim.resume();
				}
				return this;
			},

			/**
			@name glow.anim.Timeline#isPlaying
			@function
			@returns {Boolean}
			@description Returns true if the timeline is playing.
			*/
			isPlaying: function() {
				return this._playing;
			},
			
			/**
			@name glow.anim.Timeline#goTo
			@function
			@returns this
			@description Go to a specific point in the timeline
			@param {Number|glow.anim.Animation} pos Position in the timeline to go to.

				You can go to a specific point in time (in seconds) or provide
				a reference to a particular animation to begin at.

			@example
				var myTimeline = new glow.anim.Timeline([anim1, anim2]);
				
				//start the Timeline 2.5 seconds in
				myTimeline.goTo(2.5).resume();
				
			@example
				var myTimeline = new glow.anim.Timeline([anim1, anim2]);
				
				//start the Timeline from anim2
				myTimeline.goTo(anim2).resume();
			*/
			goTo: function(pos) {
				var i,
					j,
					k,
					channelsLen = this._channels.length,
					channelLen,
					// holding var for an anim
					anim,
					runningDuration;
				
				if (typeof pos == "number") {
					
					if (pos > this.duration) {
						// if the position is greater than the total, 'loop' the value
						if (this.loop) {
							pos = pos % this.duration;
						} else {
							pos = this.duration;
						}
					}
					
					// advance the control anim
					this._controlAnim.goTo(pos);
					
					// loop through the animations in all the channels, find out which
					// one to start playing from
					for (i = 0; i < channelsLen; i++) {

						runningDuration = 0;
						// go through animations in that channel
						for (j = 0, channelLen = this._channels[i].length; j < channelLen; j++) {
							anim = this._channels[i][j];
							
							if (anim instanceof r.Animation) {
								// we found an animation we should be playing
								if ( (runningDuration + anim.duration) > pos) {
									// record its position and leave the loop
									this._channelPos[i] = j;
									anim.goTo(pos - runningDuration);
									break;
								}
								// we're moving to a position where this animation has
								// finished playing, need to fire its final frame
								anim.goTo(anim.duration);
								// add that anim to the running total
								runningDuration += anim.duration;
							}
							
						}
						// right, now we need to move all animations after this
						// one to the start...
						for (k = channelLen; k > j; k--) {
							anim.goTo(0);
						}
					}
				} else {
					// ok, we've been provided with an object rather than a number of seconds
					// Let's convert it to seconds and rerun this function
					for (i = 0; i < channelsLen; i++) {
						// let's count this to find out what "time" the item the user wants to play is at
						runningDuration = 0;
						
						// let's loop through animations in that channel
						for (j = 0, channelLen = this._channels[i].length; j < channelLen; j++) {
							anim = this._channels[i][j];
							
							if (anim === pos) {
								// oh! We've found the thing they want to play
								return this.goTo(runningDuration);
							}
							if (anim instanceof r.Animation) {
								// add that anim to the running total
								runningDuration += anim.duration;
							}
						}
					}
					throw "Animation not found in animation channels";
				}
				return this;
			}
		};
		glow.anim = r;
	}
});
