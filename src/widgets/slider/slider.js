(window.gloader || glow).module({
	// add the name of your new module
	name: "glow.widgets.Slider",
	library: ["glow", "@VERSION@"],
	depends: [[
		"glow", "@VERSION@",
		// add the names of modules this modules depends on here, eg:
		"glow.dom",
		"glow.events",
		"glow.dragdrop",
		"glow.anim",
		"glow.widgets"
	]],
	builder: function(glow) {
		
		// private vars
		var $ = glow.dom.get,
			events = glow.events,
			env = glow.env,
			// private reference to Ruler class
			Ruler,
			// private reference to the slider class
			Slider,
			// array of event names, used to apply event handlers passed in through opts
			eventNames = ["slideStart", "slideStop", "change"],
			// this holds the name of the last key to be pressed.
			// Keep this, because we only want to react to the keyup for the very last keydown
			// Also, if this is null we know there aren't any keys currently pressed
			lastKeyDown = null,
			//interval id for repeating nudges on buttons
			nudgeButtonRepeater,
			//interval id for repeating keyboard nav
			keyRepeater,
			//the os sliced to 3 chars
			os = navigator.platform.slice(0, 3),
			// this will store terms used which differ if the slider is horizontal or vertical
			vocabs = [
				{
					containerClassNamePart: "slider",
					length: "width",
					lengthUpper: "Width", 
					pos: "left",
					trackToChange: "_trackOnElm",
					axis: "x",
					keyIncrement: "RIGHT",
					keyDecrement: "LEFT",
					pagePos: "pageX"
				},
				{
					containerClassNamePart: "vSlider",
					length: "height",
					lengthUpper: "Height", 
					pos: "top",
					trackToChange: "_trackOffElm",
					axis: "y",
					keyIncrement: "UP",
					keyDecrement: "DOWN",
					pagePos: "pageY"
				}
			],
			/*
			 HTML for the slider 
			 This still needs to be wrapped in <div class="glowCSSVERSION-slider"> or
			 <div class="glowCSSVERSION-vSlider"> before it's created
			*/
			SLIDER_TEMPLATE = '' +
				'<div class="slider-theme">'+
					'<div class="slider-state">'+
						'<div class="slider-container">'+
							'<div class="slider-btn-bk"></div>'+
							'<div class="slider-track">'+
								'<div class="slider-trackOn"></div>'+
								'<div class="slider-trackOff"></div>'+
								'<div class="slider-handle"></div>'+
							'</div>'+
							'<div class="slider-labels"></div>'+
							'<div class="slider-btn-fwd"></div>'+
						'</div>'+
					'</div>'+
				'</div>';
		
		/*
			The below is a function that returns false, used in some listeners
		*/
		function returnFalse() {
			return false;
		}
		
		/*
			Returns the lowest common divisor for all the arguments. Ignores any
			zero params.
		*/
		function greatestCommonDivisor(/* numbers */) {
			var i = 0,
				len = arguments.length,
				r,
				b;
				
			// get first non-zero param
			while ( !(r = arguments[i++]) && (i < len) );
			
			for (; i < len; i++) {
				b = arguments[i];
				// ignore zeros
				if (!b) { continue; }
				
				while (1) {
					r = r % b;
					if (!r) {
						r = b;
						break;
					}
					b = b % r;
					if (!b) {
						break;
					}
				}
			}
			return r;
		}
				
		// closure for Ruler
		(function() {
			var vocabs = [
				{
					containerClassNamePart: "ruler",
					length: "width",
					pos: "left"
				},
				{
					containerClassNamePart: "vRuler",
					length: "height",
					pos: "top"
				}
			];
			
			
			
			/*
			  container - where to insert the ruler
			  opts.min - start val
			  opts.max - end val
			  opts.tickMajor - interval for major ticks
			  opts.tickMinor - interval for minor ticks
			  opts.labels - as with slider
			  opts.labelMapper - function which takes a label string and returns a new string. For adding stuff like % to the end
			  opts.vertical - vertical ruler
			  opts.reverse - makes the right / bottom of the ruler the start
			  opts.id - id on element
			  opts.className - additional class names for element
			*/
			Ruler = function(container, opts) {
				container = $(container);
				
				// assign default options
				opts = glow.lang.apply({
					size: 300,
					min: 0,
					max: 100
				}, opts);
				
				var vocab = vocabs[!!opts.vertical * 1],
					// major tick template, this should be cloned before use
					tickMajorElm = glow.dom.create('<div class="ruler-tickMajor"></div>'),
					// minor tick template, this should be cloned before use
					tickMinorElm = glow.dom.create('<div class="ruler-tickMinor"></div>'),
					// label template, this should be cloned before use
					labelElm = glow.dom.create('<div class="ruler-label"><span></span></div>'),
					// labels converted into a number. This will be NaN for objects
					labelInterval = Number(opts.labels),
					// this is the largest incement we can use to loop
					divisor = greatestCommonDivisor(opts.tickMajor, opts.tickMinor, labelInterval),
					// percent position
					percentPos,
					// tmp holder for an element
					tmpElm,
					// a couple of shortcuts
					reverse = opts.reverse,
					// difference between max & min
					size = opts.max - opts.min,
					// container element
					element,
					// labels container
					labelsElm,
					// a tmp clone of the label elm
					labelElmClone,
					// looping vars
					labelPos,
					i = opts.min;
				
				// create element
				this.element = element = glow.dom.create('<div role="presentation" class="glowCSSVERSION-' + vocab.containerClassNamePart + '"><div class="ruler-spacer"></div><div class="ruler-labels"></div></div>');
				labelsElm = element.get('div.ruler-labels');
				
				// add custom ID / Class names
				element[0].id = opts.id || "";
				element[0].className += " " + (opts.className || "");
				
				for (; i <= opts.max; i += divisor) {
					// work out which pixel position we're dealing with
					percentPos = ((i - opts.min) / size) * 100;
					percentPos = reverse ? 100 - percentPos : percentPos;
					
					// vocab.pos is top or left
					
					if ( opts.tickMajor && !((i - opts.min) % opts.tickMajor) ) {
						// place a major tick
						tickMajorElm.clone().css(vocab.pos, percentPos + "%").appendTo(element);
					} else if ( opts.tickMinor && !((i - opts.min) % opts.tickMinor) ) {
						// place a minor tick
						tickMinorElm.clone().css(vocab.pos, percentPos + "%").appendTo(element);
					}
					
					if (labelInterval && !((i - opts.min) % labelInterval)) {
						// place a label
						labelElmClone = labelElm.clone().css(vocab.pos, percentPos + "%");
						// set the value as a property of the element
						labelElmClone[0]._labelVal = i;
						// set the html of the inner span. We pass the label through labelMapper if it exists
						labelElmClone.get('span').html( opts.labelMapper ? opts.labelMapper(i) : i );
						// add to labels
						labelsElm.append(labelElmClone);
					}
				}
				
				// right, our labels are set per position
				if (!labelInterval) {
					for (labelPos in opts.labels) {
						// work out which pixel position we're dealing with
						percentPos = ((Number(labelPos) - opts.min) / size) * 100;
						percentPos = reverse ? 100 - percentPos : percentPos;
						
						if (percentPos <= 100) {
							// place a label
							labelElmClone = labelElm.clone().css(vocab.pos, percentPos + "%");
							// set the value as a property of the element
							labelElmClone[0]._labelVal = Number(labelPos);
							// set the html of the inner span. We pass the label through labelMapper if it exists
							labelElmClone.get('span').html( opts.labelMapper ? opts.labelMapper(opts.labels[labelPos]) : opts.labels[labelPos] );
							// add to labels
							labelsElm.append(labelElmClone);
						}						
					}
				}
				
				// place it in the document
				container.append(element);
			};
			
		})();
		
		/*
		  This returns either the horizontal or vertical vocab.
		  A lot of lines are the same for a horizonal & vertical sliders
		  aside from a couple of keywords. The vocabs cater for these
		  keywords.
		*/
		function getVocab(slider) {
			return vocabs[!!slider._opts.vertical * 1];
		}
		
		/*
		  This adjusts size the active / inactive part of the slider, according to the handle position
		*/
		function adjustTracks(slider) {
			var vocab = getVocab(slider);
			// size the active / inactive part of the slider
			// trackToChange is _trackOnElm or _trackOffElm, length is width or height
			slider[vocab.trackToChange][0].style[vocab.length] = parseInt(slider._handleElm[0].style[vocab.pos]) + (slider._handleSize / 2) + "px";
		}
		
		/*
		  This is called as the mouse moves when the slider is being dragged
		*/
		function handleMouseMove() {
			adjustTracks(this);
			if (this._opts.changeOnDrag) {
				var newVal = valueForHandlePos(this);
				change(this, newVal);
				(this._boundInput[0] || {}).value = newVal;
			}
		}
		
		/*
		  This is called when the user interacts with the slider using keyboard (keydown)
		*/
		function handleKeyNav(event) {

			var vocab = getVocab(this)
				that = this;

			if (lastKeyDown == "prevented") {
				// this is a repeat of a prevented slideStart, just exit
				return false;
			} else if (lastKeyDown != event.key) {
				// this isn't a repeating keydown event, it's a new slide
				
				// if lastKeyDown isn't null, key-sliding has changed direction but not actually restarting
				if (!lastKeyDown && slideStart(this).defaultPrevented()) {
					lastKeyDown = "prevented"; //this allows us to pick up repeats
					return false;
				}
				
				// set up repeating
				// cancel any existing repeating
				clearInterval(keyRepeater);
				
				keyRepeater = setTimeout(function() {
					keyRepeater = setInterval(function() {
						nudge(that, event.key == vocab.keyIncrement /* is true if the user pressed up / right */ ? 1 : -1 );
					}, 40);
				}, 500);
				
				// do the initial nudge
				nudge(that, event.key == vocab.keyIncrement /* is true if the user pressed up / right */ ? 1 : -1 );
				
				// we use this to know which keyup to react to
				lastKeyDown = event.key;
			}
			return false;
		}
		/*
		  This is called when the user stops interacting with keyboard (keyup)
		*/
		function handleKeyNavEnd(event) {
			if (lastKeyDown == event.key) {
				// if lastKeyDown != event.key, sliding hasn't actually finished
				lastKeyDown = null;
				// cancel any existing repeating
				clearInterval(keyRepeater);
				// stop sliding
				slideStop(this);
			}
		}
		
		/*
			Called when the back / fwd button is pressed down
		*/
		function handleButtonDown(event) {
			if ( !this._disabled && !slideStart(this).defaultPrevented() ) {
				//work out which button was pressed
				var nudgeAmount = event.attachedTo.className.indexOf("-fwd") != -1 ? 1 : -1,
					that = this;
				
				//nudge slider
				nudge(this, nudgeAmount);
				
				//set the action to repeat
				nudgeButtonRepeater = setTimeout(function() {
					nudgeButtonRepeater = setInterval(function() {
						nudge(that, nudgeAmount);
					}, 40);
				}, 500);
			}
			return false;
		}
		
		/*
			Called when the back / fwd button is released (or mouse out)
		*/
		function handleButtonUp(event) {
			if (nudgeButtonRepeater) {
				clearTimeout(nudgeButtonRepeater);
				clearInterval(nudgeButtonRepeater);
				nudgeButtonRepeater = null;
				slideStop(this);
			}
			return false;
		}
		
		/*
			Move the slider by a step. Used by the nudge buttons and keyboard events.
			stepsToNudge = number of steps to nudge
		*/
		function nudge(slider, stepsToNudge) {
			// if the step is zero, we step by a pixel
			var changeBy = (slider._opts.step || (1 / slider._pixelsPerVal)) * stepsToNudge;
			// update the view
			slider._nudgeVal = sanitiseVal(slider, slider._nudgeVal + changeBy);
			updateSliderUi(slider, slider._nudgeVal);
			if (slider._opts.changeOnDrag) {
				change(slider, slider._nudgeVal);
				(slider._boundInput[0] || {}).value = slider._val;
			}
		}
		
		/*
			Update the slider UI for 'val', or the current value. Expects val to
			be already sanitised.
		*/
		function updateSliderUi(slider, val) {
			var valueAsPixels,
				vocab = getVocab(slider),
				val = val === undefined ? slider._val : val;
				
			//calculate the top / left position of the slider handle
			valueAsPixels = slider._opts.vertical ?
				// TODO copy the horizontal calculation and do the flipping afterwards
				(slider._opts.max - val) * slider._pixelsPerVal : //vertical calculation
				(val - slider._opts.min) * slider._pixelsPerVal; //horizontal calculation
			
			// move the handle
			// vocab.pos = left or top
			slider._handleElm[0].style[vocab.pos] = valueAsPixels + "px";
			
			// change track sizes
			adjustTracks(slider);
		}
		
		/*
		  Generate value based on handle position.
		  This will calculate the value and round it to the
		  nearest valid value
		*/
		function valueForHandlePos(slider) {
			var vocab = getVocab(slider),
				//get the left or top value of the handle
				handlePos = parseInt(slider._handleElm[0].style[vocab.pos]),
				//calculate value
				newVal = slider._opts.vertical ?
					(slider._trackSize - slider._handleSize) - handlePos :
					handlePos;
					
			//we've got the value from the start position in pixels, now we need the
			//value in terms of the slider
			newVal = (newVal / slider._pixelsPerVal) + slider._opts.min;
			
			//round to nearest step
			return sanitiseVal(slider, newVal);
		}
		
		/*
		  Takes a value and rounds it to the nearest value in step / slider range.
		  
		  NaN values will be treated as 0
		*/
		function sanitiseVal(slider, val) {
			var step = slider._opts.step,
				min = slider._opts.min,
				max = slider._opts.max;
			
			val = Number(val) || 0;
			
			//obey boundaries
			if (val < min) {
				return min;
			}
			if (val > max) {
				// a little more maths this time, we need to work out the maximum value we can step to
				return max - ((max - min) % (step || 1));
			}
			
			// we don't need to calculate anything if step is zero
			if (step == 0) { return val; }
			// else round to step
			return Math.round( (val - min) / step ) * step + min;
		}
		
		/*
		  Update the bound form field & fires an onchange if necessary.
		  If newVal is undefined it will be looked up (but passing in the value is faster)
		*/
		function change(slider, newVal) {
			var currentVal = slider._val,
				//calculate value if needed
				newVal = (newVal === undefined) ? valueForHandlePos(slider) : newVal;
			
			//update value
			slider.element.attr("aria-valuenow", newVal);
			slider._val = newVal;
			
			//fire onchange if we have to
			if (newVal != currentVal) {
				events.fire(slider, "change");
			}		
		}
		
		/*
		  This is called when sliding starts. Fires the start event and returns an event object
		*/
		function slideStart(slider) {
			//capture current value in case we need to reset it
			slider._valBeforeSlide = slider._nudgeVal = slider._val;
			return events.fire(slider, "slideStart");
		}
		
		/*
		  This is called when sliding stops. Fires event and resets value if default cancelled
		*/
		function slideStop(slider) {
			var eventData = {
				// current value
				initialVal: slider._valBeforeSlide,
				//get new value
				currentVal: valueForHandlePos(slider)
			};
			
			if ( events.fire(slider, "slideStop", eventData).defaultPrevented() ) {
				change(slider, slider._valBeforeSlide);
				slider.val(slider._valBeforeSlide);
				return;
			}
			change(slider, eventData.currentVal);
			//if snaping ondrop is on, update handle position with val()
			if (slider._opts.snapOnDrop) {
				slider.val(eventData.currentVal);
			} else {
				(slider._boundInput[0] || {}).value = eventData.currentVal;
			}
		}
		
		/*
		  Works out how many pixels a value is, adjust the size so ticks land
		  on pixels
		*/
		function initUi(slider, ruler) {
			var opts = slider._opts,
				//get hold of the vocab we need to use
				vocab = getVocab(slider),
				//will hold a nodelist of the slider
				element = slider.element,
				//the height of the slider when the track is 0px. Basically any padding, margins and borders
				verticalPaddingHeight,
				//adjusted size after catering for fitting ticks and steps onto pixels
				adjustedSize,
				//value the slider should start on
				startVal,
				//we listen to the mouse moving while the handle is dragging
				mouseMoveListener,
				//glow.dragDrop.Draggable instance for handle
				handleDraggable,
				//draggable options
				draggableOpts,
				//get the smallest non-zero value for step (if we're snapping while dragging), labelMinor, labelMajor
				smallestStepingVal = greatestCommonDivisor( (opts.step * opts.snapOnDrag), opts.tickMinor, opts.tickMajor ),
				oldLengthStyle;

			
			if (opts.vertical) {
				verticalPaddingHeight = element.height();
				//apply height, we need to come up with a total of opts.size
				slider._trackOnElm.height(opts.size - verticalPaddingHeight);
			} else {
				//apply width
				element.width(opts.size);
			}
			
			//vocab.length holds 'width' or 'height'
			slider._trackSize = slider._trackElm[vocab.length]();
			// get the handle size
			// right, this gets complicated in IE if the handle element has a percentage legnth, the offset values come in too late
			oldLengthStyle = slider._handleElm[0].style[vocab.length];
			if (glow.env.ie < 8) {
				slider._handleElm[0].style[vocab.length] = slider._handleElm[0].currentStyle[vocab.length];
				slider._handleElm[0].style[vocab.length] = slider._handleElm[0].style["pixel" + vocab.lengthUpper];
			}
			slider._handleSize = slider._handleElm[0]["offset" + vocab.lengthUpper];
			slider._handleElm[0].style[vocab.length] = oldLengthStyle;

			
			
			//apply the start value
			if (opts.val != undefined) { //first use the option
				startVal = opts.val
			} else if (slider._boundInput[0] && slider._boundInput[0].value != "") { //then the form field
				startVal = slider._boundInput[0].value
			} else { //default to min val
				startVal = opts.min;
			}
			
			/*if (slider._handleElm.css("position") != "absolute") {
				// uh oh, our CSS hasn't loaded yet
				// put in a tmp value for _pixelsPerVal, to prevent errors
				slider._pixelsPerVal = 1;
				slider._val = startVal;
				slider._trackOnElm[0].style.height = "";
				// rerun this function later
				setTimeout(function() {
					initUi(slider, ruler);
				}, 0);
				return;
			}*/
			
			//adjust size so labels / ticks sit on pixels if we have to
			if (smallestStepingVal) {
				adjustedSize =
					// get the value of a pixel
					((slider._trackSize - slider._handleSize) / (opts.max - opts.min))
					// multiple by the smallest non-zero stepping value
					* smallestStepingVal;
				
				adjustedSize =
					(
						//floor the pixel step (we don't want fractions)
						//get the new value of a pixel and work out the draggable pixel range
						(Math.floor(adjustedSize) / smallestStepingVal) * (opts.max - opts.min)
					//add on the handle size to get the new size of the inner track
					) + slider._handleSize;
					
				//apply the new size
				if (opts.vertical) {
					//apply the new size to the track
					slider._trackOnElm.height(adjustedSize);
					if (ruler) {
						ruler.element.height(adjustedSize - slider._handleSize);
					}
				} else {
					//work out the difference between the old track size and the new track size
					//apply that difference to the element width
					element.width(opts.size - (slider._trackSize - adjustedSize));
				}
				slider._trackSize = slider._trackElm[vocab.length]();
			}
			slider._pixelsPerVal = ((slider._trackSize - slider._handleSize) / (opts.max - opts.min));
			//apply the start value
			slider.val(startVal);
			
			// ARIA - initial setup
			element.attr({
				"aria-valuenow": slider._val,
				"aria-valuemin": opts.min,
				"aria-valuemax": opts.max
			});
			
			//create draggable
			draggableOpts = {
				axis: vocab.axis,
				container: slider._trackElm,
				onDrag: function() {
					if (slider._disabled || slideStart(slider).defaultPrevented()) {
						return false;
					}
					slider._stateElm.addClass("slider-active");
					mouseMoveListener = events.addListener(document, "mousemove", handleMouseMove, slider);
				},
				onDrop: function() {
					slider._stateElm.removeClass("slider-active");
					events.removeListener(mouseMoveListener);
					slideStop(slider);
				}
			};
			
			if (opts.snapOnDrag) {
				draggableOpts.step = slider._pixelsPerVal * opts.step;
			}
			
			handleDraggable = new glow.dragdrop.Draggable(slider._handleElm, draggableOpts);
			
			// track clicking
			if (opts.jumpOnClick) {
				events.addListener(slider._trackElm, "mousedown", function(event) {
					if (slider._disabled || event.source == slider._handleElm[0]) {
						// don't react if slider is disabled or handle is being used
						return;
					}
					// vocab.pos is top / left, vocab.pagePos is pageX / pageY
					var vocab = getVocab(slider),
						oldPagePos = event[vocab.pagePos];
					
					// This is a bit cheeky...
					// We're tricking the draggable into thinking the mouse is in the centre of the handle.
					// This way, all the handling of stepping and bounds is handled by the draggable
					// TODO: Move this functionality into Draggable
					event[vocab.pagePos] = slider._handleElm.offset()[vocab.pos] + (slider._handleSize / 2);
					
					// so, make the draggable think the user has clicked in the centre of it
					if (handleDraggable._startDragMouse.call(handleDraggable, event) === false) {
						// now make it think the mouse has moved
						event[vocab.pagePos] = oldPagePos;
						handleDraggable._dragMouse.call(handleDraggable, event);
						adjustTracks(slider);
						// cancel default click
						return false;
					}
				});
			}
		}
		
		/**
		@name glow.widgets.Slider
		@class
		@description Form control for setting a numerical value within a range.	

		<div class="info">Widgets must be called in a <code>glow.ready()</code> call.</div>
		
		@param {glow.dom.NodeList | Selector | HTMLElement} container Container of Slider.
			The Slider will be appended to this element, retaining existing contents.
			
		@param {Object} [opts] Options object
			@param {Number} [opts.size=300] Pixel width / height of the slider
				The size may be automatically reduced so that stepping sits on absolute pixels.
			@param {glow.dom.NodeList | Selector | HTMLElement} [opts.bindTo] Form element to bind value to.
				Changes to this form element will also cause the Slider to update
			@param {Number} [opts.min=0] Minimum value for slider.
				Can be negative but must be smaller than opts.max.
			@param {Number} [opts.max=100] Maximum value for slider.
				Can be negative but must be greater than opts.min.
			@param {Number} [opts.step=1] Step between values.
				0 or fractional step values may result in fractional values.
			@param {Boolean} [opts.snapOnDrag=false] If true, the slide handle will snap to each step during drag.
				This is a visual effect, it will not impact the value of the slider.
			@param {Boolean} [opts.snapOnDrop=false] If true, the slide handle will snap to a step position on drop.
				This is a visual effect, it will not impact the value of the slider.
			@param {Number} [opts.val] Start value.
				By default, the value from the bound form element will be used. If none
				exists, the minimum value will be used.
			@param {Boolean} [opts.changeOnDrag=false] Fire the 'change' event during drag.
			@param {String} [opts.id] Value for Slider's ID attribute
			@param {String} [opts.className] Values for Slider's class attribute.
				Space separated values.
			@param {Object} [opts.labels] Labels for Slider values.
				For numerical labels, a Number can be provided for the interval between labels. Text labels can
				be specified in the form <code>{"value": "label"}</code>,
				eg <code>{"0": "Min", "50": "Medium", "100": "Maximum"}</code>. Labels may contain
				HTML, so images could be used.
			@param {Number} [opts.tickMajor] The interval between each major tick mark.
			@param {Number} [opts.tickMinor] The interval between each minor tick mark.
			@param {Boolean} [opts.vertical=false] Create a vertical slider?
			@param {String} [opts.theme="light"] Visual theme to use.
				Current themes are "light" and "dark".
			@param {Boolean} [opts.jumpOnClick=true] Does the track react to clicks?
				If true, when the user clicks on the slider track the handle
				will move to that position. Dragging can be initiated from anywhere
				on the track.
			@param {Boolean} [opts.buttons=true] Include fine-tuning buttons?
			@param {Function} [opts.onSlideStart] Event shortcut.
				See documentation below
			@param {Function} [opts.onSlideStop] Event shortcut.
				See documentation below
			@param {Function} [opts.onChange] Event shortcut.
				See documentation below
	
		@example
			var mySlider = new glow.widgets.Slider("#sliderContainer", {
				min: 5,
				max: 80,
				id: "ageSlider",
				tickMajor: 5,
				tickMinor: 1,
				labels: 5
			});
		
		@example
			var mySlider = new glow.widgets.Slider("#fishLevelSlider", {
				bindTo: 'numberOfFishInTheSea',
				buttons: false,
				className: 'deepBlue',
				onSlideStart: function() {
					glow.dom.get('img#fishes').toggleCss('moving');
				},
				onSlideStop: function() {
					glow.dom.get('img#fishes').toggleCss('moving');
				},
				size: '600',
			});
		
		@example
			var mySlider = new glow.widgets.Slider("#soundLevelHolder", {
				min: 1,
				max: 100,
				id: "soundLevel",
				onChange: function () {
					updateFlash('sound', this.val());
				}
				tickMajor: 10,
				tickMinor: 5,
				labels: 5,
				vertical: true
			});

		@see <a href="../furtherinfo/widgets/slider/">Slider user guide</a>
		@see <a href="../furtherinfo/widgets/slider/style.shtml">Restyling a Slider</a>
		@see <a href="../furtherinfo/widgets/slider/colourpicker.shtml">Slider Demo: Colour Picker</a>
		*/
		/**
			@name glow.widgets.Slider#event:slideStart
			@event
			@description Fired when the user starts moving the slider.

				Fired on both keyboard and mouse interaction. Preventing the
				default will prevent the user moving the slider.
			
			@param {glow.events.Event} event Event Object
		*/
		/**
			@name glow.widgets.Slider#event:slideStop
			@event
			@description Fired when the user stops moving the slider.

				Fired on both keyboard and mouse interaction. Preventing the
				default will return the slider to the position it was before
				the user started dragging.
				
				The event object contains properties 'initialVal' and
				'currentVal', which contain the value before dragging and the
				value about to be set respectively.
			
			@param {glow.events.Event} event Event Object
		*/
		/**
			@name glow.widgets.Slider#event:change
			@event
			@description Fired when the slider value changes.

				This is usually fired when the user drops the handle, but
				can be configured to fire as the user is dragging the slider,
				via the 'changeOnDrag' option. Change also occurs when the value
				in the bound form element is changed by the user.
				
				Change does not fire when the slider's value is set via
				<code>mySlider.val()</code>.
			
			@param {glow.events.Event} event Event Object
		*/

		Slider = glow.widgets.Slider = function(container, opts) {
			//private vars
			/**
			@name glow.widgets.Sliders#_boundInput
			@type glow.dom.NodeList
			@private
			@description Element the slider is bound to.
				Can be an empty NodeList if no input was specified by the user
			*/
			/**
			@name glow.widgets.Sliders#_stateElm
			@private
			@type glow.dom.NodeList
			@description Element to apply state-related class names to, like slider-disabled
			*/
			/**
			@name glow.widgets.Sliders#_trackElm
			@private
			@type glow.dom.NodeList
			@description Element to apply state-related class names to, like slider-disabled
			*/
			/**
			@name glow.widgets.Sliders#_trackOnElm
			@private
			@type glow.dom.NodeList
			@description Element containing the "on" state of the track
			*/
			/**
			@name glow.widgets.Sliders#_trackOffElm
			@private
			@type glow.dom.NodeList
			@description Element containing the "on" state of the track
			*/
			/**
			@name glow.widgets.Sliders#_handleElm
			@private
			@type glow.dom.NodeList
			@description The slider handle
			*/
			/**
			@name glow.widgets.Sliders#_trackSize
			@private
			@type Number
			@description Pixel width / height for track
			*/
			/**
			@name glow.widgets.Sliders#_handleSize
			@private
			@type Number
			@description Pixel width / height for handle
			*/
			/**
			@name glow.widgets.Sliders#_pixelsPerVal
			@private
			@type Number
			@description How much is each pixel movement of the handle worth?
			*/
			/**
			@name glow.widgets.Sliders#_val
			@private
			@type Number
			@description Current value of the slider. Set and read by val()
			*/
			/**
			@name glow.widgets.Sliders#_valBeforeSlide
			@private
			@type Number
			@description The value of the slider when sliding last began
			*/
			/**
			@name glow.widgets.Sliders#_nudgeVal
			@private
			@type Number
			@description Sometimes we need to hold the value of the slider as it's moving.
				We don't want to set the actual val, as the change isn't over yet
			*/
			/**
			@name glow.widgets.Sliders#_disabled
			@private
			@type Boolean
			@description Is the slider disabled
			*/
			this._disabled = false;
			
			//normalise container
			container = $(container);
			
			//set up the default options
			this._opts = opts = glow.lang.apply({
				min: 0,
				max: 100,
				step: 1,
				theme: "light",
				jumpOnClick: 1,
				buttons: 1,
				size: 300
			}, opts);
			
			var i,
				//tmp holder of converted event names
				onEventName,
				//get hold of the vocab we need to use
				vocab = getVocab(this),
				//will hold a nodelist of the slider
				element,
				//the height of the slider when the track is 0px. Basically any padding, margins and borders
				verticalPaddingHeight,
				//adjusted size after catering for fitting ticks and steps onto pixels
				adjustedSize,
				//key listeners for keyboard nav,
				keyListeners = [],
				//'that' for event listeners
				that = this,
				//nodelist to the back & fwd buttons
				buttonElms,
				//reference to the ticks & labels ruler used
				ruler,
				//get the smallest non-zero value for step (if we're snapping while dragging), labelMinor, labelMajor
				smallestStepingVal = greatestCommonDivisor( (opts.step * opts.snapOnDrag), opts.tickMinor, opts.tickMajor );
			
			//apply the listeners passed in through opts
			i = eventNames.length;
			while (i--) {
				//convert names. Eg "slideStart" to "onSlideStart"
				onEventName = "on" + eventNames[i].charAt(0).toUpperCase() + eventNames[i].slice(1);
				if (opts[onEventName]) {
					events.addListener(this, eventNames[i], opts[onEventName])
				}
			}
			
			// get bound input
			this._boundInput = opts.bindTo ? $(opts.bindTo) : new glow.dom.NodeList();
			
			/**
			@name glow.widgets.Slider#element
			@type glow.dom.NodeList
			@description Slider HTML Element.
				This can be used to perform DOM manipulation on the slider
			
			@example
				//get the offset of a slider
				mySlider.element.offset();
			*/
			// add in wrapping element
			this.element = element = glow.dom.create('<div class="glowCSSVERSION-' + vocab.containerClassNamePart + '" tabindex="0" role="slider" aria-disabled="false">' + SLIDER_TEMPLATE + '</div>');
			this._trackElm = element.get("div.slider-track");
			this._trackOnElm = element.get("div.slider-trackOn");
			this._trackOffElm = element.get("div.slider-trackOff");
			this._handleElm = this._trackElm.get("div.slider-handle");
			this._stateElm = element.get("div.slider-state")
			
			// add in the theme
			element.get("div.slider-theme").addClass("slider-" + opts.theme);
			
			// removes buttons if the user doesn't want them
			!opts.buttons && this._stateElm.addClass("slider-noButtons");
			
			// add custom ID / Class names
			element[0].id = opts.id || "";
			element[0].className += " " + (opts.className || "");
			
			// add Ruler (ticks and labels)
			if (opts.tickMajor || opts.tickMinor || opts.labels) {
				opts.reverse = opts.vertical;
				ruler = new Ruler(element.get("div.slider-labels"), opts);
			}
			
			//add to page
			this.element.appendTo(container);
			
			initUi(this, ruler);			
			
			if (this._boundInput[0]) {
				// listen for changes
				events.addListener(this._boundInput, "change", function() {
					var snappedValue = sanitiseVal(that, this.value);
					change(that, snappedValue);
					// using val() to do the UI & value updating results in sanitise being called twice, but saves code
					that.val(snappedValue);
				})
			}
			
			// keyboard nav
			events.addListener(this.element, "focus", function() {
				if ( !that._disabled ) {
					that._stateElm.addClass("slider-active");
					// vocab.keyIncrement is "RIGHT" or "UP"
					// vocab.keyDecrement is "LEFT" or "DOWN"
					keyListeners[0] = events.addKeyListener(vocab.keyIncrement, "down", handleKeyNav, that);
					keyListeners[1] = events.addKeyListener(vocab.keyDecrement, "down", handleKeyNav, that);
					keyListeners[2] = events.addKeyListener(vocab.keyIncrement, "up", handleKeyNavEnd, that);
					keyListeners[3] = events.addKeyListener(vocab.keyDecrement, "up", handleKeyNavEnd, that);
					// the following prevents the arrow keys scrolling in some browsers (such as Opera)
					keyListeners[4] = events.addKeyListener(vocab.keyIncrement, "press", returnFalse);
					keyListeners[5] = events.addKeyListener(vocab.keyDecrement, "press", returnFalse);
				}
			});
			
			events.addListener(this.element, "blur", function() {
				that._stateElm.removeClass("slider-active");
				var i = keyListeners.length;
				while (i--) { events.removeListener(keyListeners[i]) }
				keyListeners = [];
			});
			
			// nudge buttons
			buttonElms = this.element.get(".slider-btn-fwd, .slider-btn-bk");
			events.addListener(buttonElms, "mousedown", handleButtonDown, this);
			events.addListener(buttonElms, "mouseup", handleButtonUp, this);
			events.addListener(buttonElms, "mouseout", handleButtonUp, this);
			
			// label clicking
			if (ruler) {
				events.addListener(ruler.element, "mousedown", function(event) {
					// exit if slider disabled
					if (that._disabled) { return; }
					
					var labelElm = $(event.source),
						snappedValue;
					
					// right, we need to turn labelElm (currently the event source) into the label element
					while ( labelElm[0] != ruler.element[0] ) {
						if ( labelElm.hasClass("ruler-label") ) { // yey, we found the label
							// check the value is valid
							snappedValue = sanitiseVal(that, labelElm[0]._labelVal);
							change(that, snappedValue);
							// update UI
							that.val(snappedValue);
							return false;
						}
						labelElm = labelElm.parent();
					}
					// the user must have clicked outside a label
				});
			}
		};
		
		Slider.prototype = {
			/**
			@name glow.widgets.Slider#disabled
			@function
			@description Get / Set the disabled state of the slider
				Call without parameters to get the state, call with parameters
				to set the state.
				
				Disabling the slider will also disable the bound form element.
			
			@param {Boolean} [disable] Disable the slider?
				'false' will enable a disabled slider.
			
			@returns
				The slider instance when setting. Boolean when getting.
				
			@example
				// disabling a slider
				mySlider.disabled( true );
				
				// toggling a slider
				mySlider.disabled( !mySlider.disabled() )
			*/
			disabled: function(disable) {
				if (disable !== undefined) {
					// setting...
					
					// cast to boolean and set
					this._disabled = disable = !!disable;
					
					// ARIA update
					this.element.attr("aria-disabled", disable);
					
					// add / remove the disabled class
					this._stateElm[disable ? "addClass" : "removeClass"]("slider-disabled");
					
					//disable the bound form field, if it's there
					( this._boundInput[0] || {} ).disabled = disable;
					
					return this;
				} else {
					// getting...
					return this._disabled;
				}
			},
			/**
			@name glow.widgets.Slider#val
			@function
			@description Get / Set the value the slider
				Call without parameters to get the value, call with parameters
				to set the value.
			
			@param {Number} [newVal] New value for the slider
			
			@returns
				The slider instance when setting. Number when getting.
				
			@example
				// getting the current value
				var sliderVal = mySlider.val();
				
				// setting the value
				mySlider.val(50);
			*/
			/*
			This param is a possible future enhancment
			 
			@param {glow.anim.Animation | Boolean} [anim] Animate the slider to the new value.
				Ommiting this parameter will simply switch the slider to the new value.
				
				True will create a basic easing animation, or a custom animation can
				be provided.
				
				Animating to a new value simulates human interaction. The usual events
				will be fired along the way.
			*/
			val: function(newVal) {
				if (newVal != undefined) {
					//setting...
					
					//sanitise and set
					this._val = sanitiseVal(this, newVal);
					//update aria
					this.element.attr("aria-valuenow", this._val);
					//update form
					(this._boundInput[0] || {}).value = this._val;
					//update UI
					updateSliderUi(this);
					
					return this;
				} else {
					return this._val;
				}
			},
			/**
			@name glow.widgets.Slider#valToLabel
			@function
			@description Get the label for a value.
			
			@param {Number} [val] The value.
				If omitted, the current slider value is used.
			
			@returns {String}
				Label text.
				
			@example
				// find out the label the handle is nearest
				var label = mySlider.valToLabel();
			*/
			valToLabel: function(val) {
				// pick the value up from the slider if there are no params
				if (val === undefined) {
					val = this._val;
				}
				
				var labels = this._opts.labels,
					// the lowest difference between labels
					lowestDiff = Infinity,
					// the lowest different passed through Math.abs
					lowestDiffAbs = Infinity,
					// label that has the lowest differece
					currentLabel,
					// tmp value
					diffAbs,
					i;
				
				// return null if there are no labels
				if (labels === undefined) { return null; }
				
				// look out for interval labels
				if (typeof labels == 'number') {
					// round to the nearest interval label
					return Math.round(val / labels) * labels;
				}
				
				// deal with object labels
				// is the value the actual position of a label? If so return it
				if (labels[val]) {
					return labels[val];
				}
				
				// bah, we have to look for the closest label
				for (i in labels) {
					// get the difference between the label and value
					diffAbs = Math.abs(Number(i) - val);
					
					if (diffAbs < lowestDiffAbs) {
						// the difference is less than ones found previously, we have a new winner
						lowestDiffAbs = diffAbs;
						lowestDiff = Number(i) - val;
						currentLabel = labels[i];
					} else if (diffAbs == lowestDiffAbs) {
						// uh oh, we have two diffs the same. Round up!
						if (lowestDiff < 0) {
							lowestDiffAbs = diffAbs
							lowestDiff = Number(i) - val;
							currentLabel = labels[i];
						}
					}
				}
				return currentLabel;
			},
			/**
			@name glow.widgets.Slider#labelToVal
			@function
			@description Get the value for a particular label.
				If the label doesn't exist in the slider, null is returned
			
			@param {String} [label] A label used in the slider
			
			@returns {Number}
				Value.
				
			@example
				// find out that value of "Medium" on the slider
				var val = mySlider.labelToVal("Medium");
			*/
			labelToVal: function(label) {
				var i,
					labels = this._opts.labels;
				
				// return null if there are no labels
				if (labels === undefined) { return null; }
				
				// look out for interval labels
				if (typeof labels == 'number') {
					label = Number(label);
					
					// if the label is divisable by the interval, return it
					if ( !(Number(label) % labels) && !isNaN(label) ) {
						return label;
					}
					return null;
				}
				
				// loop through the objects until we find a match
				for (i in labels) {
					if (label == labels[i]) {
						return Number(i);
					}
				}
				return null;
			}
		};
	}
});
