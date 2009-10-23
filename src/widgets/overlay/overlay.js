(window.gloader || glow).module({
	name: "glow.widgets.Overlay",
	library: ["glow", "@VERSION@"],
	depends: [[
		"glow", "@VERSION@",
		'glow.dom',
		'glow.events',
		'glow.anim',
		'glow.widgets',
		'glow.widgets.Mask'
	]],
	builder: function(glow) {
		var dom = glow.dom,
			$ = dom.get,
			events = glow.events,
			widgets = glow.widgets,
			env = glow.env,
			anim = glow.anim,
			tweens = glow.tweens,
			/*
			  includes focus hook for the user / other widgets to assign focus to. Tried assigning focus to whole container
			  but that selected all the text in opera 9.5
			*/
			overlayHtml = '<div class="glowCSSVERSION-overlay glowNoMask"><div class="overlay-focalPoint" tabindex="-1"></div></div>',
			overlayCount = 0, //number of overlays on the page, this is used to generate unique IDs
			//this iframe code is duplicated in mask... shall we sort that out?
			// javascript:false stops IE complaining over SSL
			iframeSrc = '<iframe class="glowNoMask" src="javascript:false" style="display:none;margin:0;padding:0;position:absolute;filter:alpha(opacity=0)"></iframe>',
			flashUrlTest = /.swf($|\?)/i,
			wmodeTest = /<param\s+(?:[^>]*(?:name=["'?]\bwmode["'?][\s\/>]|\bvalue=["'?](?:opaque|transparent)["'?][\s\/>])[^>]*){2}/i,
			//fixed positioning isn't supported in IE6 (or quirks mode). Also, Safari 2 does some mental stuff with position:fixed so best to just avoid it
			useFixed = (!env.ie && !(env.webkit < 522)) || (env.ie > 6 && env.standardsMode);

		/**
		 * @name glow.widgets.Overlay.hideElms
		 * @private
		 * @function
		 * @description Hides elements as the overlay shows
		 *
		 * @param {Overlay} overlay
		 */
		function hideElms(overlay) {
			//return if elements have already been hidden, saves time
			if (overlay._hiddenElements[0]) { return; }

			var thingsToHide = new glow.dom.NodeList(),
				hideWhileShown = overlay.opts.hideWhileShown,
				hideFilter = overlay.opts.hideFilter,
				i = 0,
				thingsToHideLen;

			//gather windowed flash
			if (overlay.opts.hideWindowedFlash) {
				thingsToHide.push(
					$("object, embed").filter(function() {
						return isWindowedFlash.call(this, overlay);
					})
				);
			}
			//gather other things to hide
			if (hideWhileShown) {
				thingsToHide.push( $(hideWhileShown) );
			}
			// filter out the elements that are inside the overlay
			thingsToHide = thingsToHide.filter(function() {
				return !$(this).isWithin(overlay.content);
			});
			//get rid of stuff the user doesn't want hidden
			if (hideFilter) { thingsToHide = thingsToHide.filter(hideFilter); }
			
			overlay._hiddenElements = thingsToHide;
			
			for (var i = 0, thingsToHideLen = thingsToHide.length; i < thingsToHideLen; i++) {
				// update how many times this item has been hidden by a glow overlay
				// this lets multiple overlays hide the same element 
				thingsToHide[i].__glowOverlayHideCount = (Number(thingsToHide[i].__glowOverlayHideCount) || 0) + 1;
				
				if (thingsToHide[i].__glowOverlayHideCount == 1) {
					// this is the first attempt to hide the element, so we need to actually hide it
					// also store the current value for visibility
					thingsToHide[i].__glowOverlayInitVis = thingsToHide[i].style.visibility;
					thingsToHide[i].style.visibility = "hidden";
				}
			}
		}

		/**
		 * @name glow.widgets.Overlay.isWindowedFlash
		 * @private
		 * @function
		 * @description Is 'this' a windowed Flash element
		 *   As in, will it show on top of everything. Called from glow.widgets.Overlay.hideElms
		 *   as a filter function
		 *
		 */
		function isWindowedFlash(overlay) {
			var that = this, wmode;
			//we need to use getAttribute here because Opera & Safari don't copy the data to properties
			if (
				(that.getAttribute("type") == "application/x-shockwave-flash" ||
				flashUrlTest.test(that.getAttribute("data") || that.getAttribute("src") || "") ||
				(that.getAttribute("classid") || "").toLowerCase() == "clsid:d27cdb6e-ae6d-11cf-96b8-444553540000")
			) {
				wmode = that.getAttribute("wmode");

				return (that.nodeName == "OBJECT" && !wmodeTest.test(that.innerHTML)) ||
					(that.nodeName != "OBJECT" && wmode != "transparent" && wmode != "opaque");

			}
			return false;
		}

		/**
		 * @name glow.widgets.Overlay.revertHiddenElms
		 * @private
		 * @function
		 * @description Revert items which were hidden when the overlay was shown
		 *
		 */
		function revertHiddenElms(overlay) {
			var hiddenElements = overlay._hiddenElements,
				i = 0,
				len = hiddenElements.length;
			
			for (; i < len; i++) {
				// only show the element again if its hide count reaches zero
				if ( --hiddenElements[i].__glowOverlayHideCount == 0 ) {
					hiddenElements[i].style.visibility = hiddenElements[i].__glowOverlayInitVis;
				}
			}
			overlay._hiddenElements = [];
		}

		/*
		PrivateMethod: generatePresetAnimation
			Generates an animation / timeline object from one of the presets

		Arguments:
			overlay - reference to the overlay
			preset - name of the preset animation
			show - true for 'show' animation. Otherwise 'hide'.
		*/
		function generatePresetAnimation(overlay, show) {
			var channels = [],
				channel = [],
				chanLen = 0,
				chansLen = 0,
				preset = overlay.opts.anim,
				mask = overlay.opts.mask,
				container = overlay.container,
				maskOpacity,
				finalHeight = 0;

			if (preset == "fade") {
				container.css("opacity", (show ? 0 : 1));
				channels[chansLen++] = [
					anim.css(container, 0.3, {
							opacity: {
								from: (show ? 0 : 1),
								to: (show ? 1 : 0)
							}
						}
					)
				];
				if (show) {
					channels[chansLen - 1][1] = function() { container.css("opacity", "") };
				}
				channels[chansLen++] = [generateMaskAnimation(overlay, show)];
			} else if (preset == "roll" || preset == "slide") {
				if (show) {
					container.css("height", "");
					finalHeight = container.height();
					container.css("height", "0");
				}

				channels[chansLen++] = [
					function() {
						/*
							safari doesn't properly recognise switches between 'hidden'
							and 'auto'
						*/
						if (env.webkit < 522 && show) {
							container.css("display", "none");
							setTimeout(function() {
								container.css("overflow", "hidden").css("display", "block");
							}, 0);
						} 
						else {
							container.css("overflow", "hidden");
						}
					},
					anim.css(container, 0.3, {
						height: {to: finalHeight}
					}, {tween: show ? tweens.easeOut() : tweens.easeIn() }),
					function() {
						if (!show) {
							container.css("visibility", "hidden");
						}
						container.css("height", "");
						container.css("overflow", "");
					}
				];
				channels[chansLen++] = [generateMaskAnimation(overlay, show)];
			}
			return new anim.Timeline(channels);
		}

		/*
		PrivateMethod: generateMaskAnimation
			generates an animation for the mask of an overlay to go in a timeline
		*/
		function generateMaskAnimation(overlay, show) {
			if (! overlay.opts.modal) { return 0; }

			var mask = overlay.opts.mask,
				maskOpacity = mask.opts.opacity,
				maskElement = mask.maskElement;

			maskElement.css("opacity", (show ? 0 : maskOpacity));
			return anim.css(maskElement, 0.1, {
					opacity: {
						from: (show ? 0 : maskOpacity),
						to: (show ? maskOpacity : 0)
					}
				}
			)
		}

		/*
		PrivateMethod: closeOverlay
			Hides the overlay. Separated out so this part can happen asyncronously (like after an animation)
		*/
		function closeOverlay(overlay) {
			revertHiddenElms(overlay);
			overlay.container.css("visibility", "").css("display", "");
			if (overlay.opts.modal) {
				overlay.opts.mask.remove();
			} else if (glow.env.ie < 7) {
				overlay._iframe.css("display", "none");
			}
			events.removeListener(overlay._scrollEvt);
			events.removeListener(overlay._resizeEvt);
		}

		/**
		@name glow.widgets.Overlay
		@class
		@description A container element displayed on top of the other page content

		<div class="info">Widgets must be called in a <code>glow.ready()</code> call.</div>
		@see <a href="../furtherinfo/widgets/overlay/">Overlay user guide</a>

		@param {selector|Element|glow.dom.NodeList} content
			the element that contains the contents of the overlay. If this is
			in the document it will be moved to document.body.

		@param {Object} opts
			Zero or more of the following as properties of an object:
			@param {Boolean} [opts.modal="false"] Is the overlay modal?
				If true then a default Mask will be created if one is not provided.
			@param {glow.widgets.Mask} [opts.mask] Mask to use for modal overlays
				used to indicate to the user that the overlay is modal. If provided then the modal property is set to true.
			@param {Boolean} [opts.closeOnMaskClick="true"] if true then listens for a click event on the mask and hides when it fires
			@param {String|Function} [opts.anim="null"] A transition for showing / hiding the panel
				Can be "fade" or "slide", or a function which returns a glow.anim.Animation or glow.anim.Timeline.
				The function is passed the overlay as the first parameter, and 'true' if the overlay is showing, 'false' if it's hiding.
			@param {Number} [opts.zIndex="9991"] The z-index to set on the overlay
				If the overlay is modal, the zIndex of the mask will be set to one less than the value of this attribute.
			@param {Boolean} [opts.autoPosition="true"] Position the overlay relative to the viewport
				If true, the overlay will be positioned to the viewport according to the x & y
				options. If false, you will have to set the position manually by setting the left / top css styles of the
				container property.
			@param {Number|String} [opts.x="50%"] Distance of overlay from the left of the viewport
				If the unit is a percentage	then 0% is aligned to the left of
				the viewport, 100% is aligned to the right of viewport and 50%
				is centered.
			@param {Number|String} [opts.y="50%"] Distance of overlay from the top of the viewport
				If the unit is a percentage	then 0% is aligned to the left of
				the viewport, 100% is aligned to the right of viewport and 50%
				is centered.
			@param {String} [opts.ariaRole] The aria role of the overlay.
				This is used for accessibility purposes. No role is defined by default.
			@param {Object} [opts.ariaProperties] Key-value pairs of aria properties and values
				These are applied to the overlay container for accessibility purposes.
				By default the overlay is a polite live area.
			@param {selector|Element|glow.dom.NodeList} [opts.returnTo] Element to give focus to when the overlay closes
				For accessibility purposes you may want to set an element to give focus to when the overlay closes.
				This meanss devices which present data to the user by the cursor position (such as screen readers)
				will be sent somewhere useful.
			@param {Boolean} [opts.hideWindowedFlash=true] Hide windowed Flash movies?
				When set to true, any Flash movie without wmode "transparent" or "opaque" will be hidden when
				the overlay shows. This is because they always appear on top of other elements on the page. Flash
				movies inside the overlay are excluded from hiding.
			@param {selector|Element|glow.dom.NodeList} [opts.hideWhileShown] Elements to hide while the overlay is shown
				This is useful for hiding page elements which always appear on top of other page elements.
				Flash movies can be handled easier using the hideWindowedFlash option.
			@param {Function} [opts.hideFilter] Exclude elements from hiding
				When provided this function is run for every element that may be hidden. This includes windowed
				Flash movies if 'hideWindowedFlash' is true, and any matches for 'hideWhileShown'. In the function,
				'this' refers to the element. Return false to prevent this element being hidden.
			@param {Boolean} [opts.focusOnShow=false] Give the overlay keyboard focus when it appears?
				Use 'returnTo' to specify where to send focus when the overlay closes
			@param {String} [opts.id] Value for the Overlay container's ID attribute
			@param {String} [opts.className] Values for the Overlay container's class attribute.
			@param {Boolean} [opts.closeOnEsc=false] Close the overlay when the ESC key is pressed
				The overlay needs to have focus for the ESC key to close.

		@example
			var overlay = new glow.widgets.Overlay(
				glow.dom.create(
					'<div>' +
					'  <p>Your Story has been saved.</p>' +
					'</div>'
				)
			);
			overlay.show();
		*/
		/**
			@name glow.widgets.Overlay#event:show
			@event
			@description Fired when the overlay is about to appear on the screen, before any animation.

				At this	point you can access the content of the overlay and make changes 
				before it is shown to the user. If you prevent the default action of this
				event (by returning false or calling event.preventDefault) the overlay 
				will not show.
			
			@param {glow.events.Event} event Event Object
		*/
		/**
			@name glow.widgets.Overlay#event:afterShow
			@event
			@description Fired when the overlay is visible to the user and any 'show' animation is complete

				This event is ideal to assign focus to a particular part of	the overlay.
				If you want to change content of the overlay before it appears, see the 
				'show' event.
			
			@param {glow.events.Event} event Event Object
		*/
		/**
			@name glow.widgets.Overlay#event:hide
			@event
			@description Fired when the overlay is about to hide

				If you prevent the default action of this event (by returning false or 
				calling event.preventDefault) the overlay will not hide.
			
			@param {glow.events.Event} event Event Object
		*/
		/**
			@name glow.widgets.Overlay#event:afterHide
			@event
			@description Fired when the overlay has fully hidden, after any hiding animation has completed
			@param {glow.events.Event} event Event Object
		*/
		function Overlay(content, opts) {
			opts = opts || {};
			//assume modal if mask provided
			if (opts.mask) { opts.modal = true; }

			this.opts = opts = glow.lang.apply({
				modal: false,
				closeOnMaskClick: true,
				zIndex: 9990,
				autoPosition: true,
				x: "50%",
				y: "50%",
				ariaRole: "",
				ariaProperties: {
					live: "polite"
				},
				hideWindowedFlash: true,
				focusOnShow: false,
				id: "glowCSSVERSIONOverlay" + (++overlayCount),
				closeOnEsc: false
			}, opts);
			
			// generate a default mask if needed
			if (opts.modal && !opts.mask) {
				opts.mask = new glow.widgets.Mask(opts.zIndex ? {zIndex: opts.zIndex-1} : {});
			}

			/**
			@name glow.widgets.Overlay#content
			@description The content of the overlay
			@type glow.dom.NodeList
			*/
			var contentNode = this.content = $(content),
				that = this,
				/**
				@name glow.widgets.Overlay#container
				@description The overlay's container.
					Use this to alter the width of the overlay. You can also
					manually position the overlay using this node when autoPosition is false.
				@type glow.dom.NodeList
				*/
				overlayNode = this.container = dom.create(overlayHtml).css("z-index", opts.zIndex).attr("aria-hidden", "true"),
				docBody = document.body,
				i;

			/**
			@name glow.widgets.Overlay#_focalPoint
			@private
			@description Dummy element at the start of the overlay to send focus to
			@type glow.dom.NodeList
			*/
			this._focalPoint = overlayNode.get("div.overlay-focalPoint");
			
			/**
			@name glow.widgets.Overlay#_hiddenElements
			@private
			@description Stores elements hidden by this overlay
			@type Node[]
			*/
			this._hiddenElements = [];
			
			/**
			@name glow.widgets.Overlay#_blockScrollRepos
			@private
			@description Don't move the panel along with scrolling
				This is used in setPosition to allow the user to scroll to
				the rest of the content even if autoPosition is on
			@type Object
			*/
			//created on show

			// ensure the overlay has a unique ID, this is used by aria to point at this overlay
			overlayNode[0].id = opts.id;
			
			// add any class names from the user
			overlayNode[0].className += " " + (opts.className || "");

			/**
			@name glow.widgets.Overlay#autoPosition
			@description Position the overlay relative to the viewport
				If true, the overlay will be positioned to the viewport according to the x & y
				options. If false, you will have to set the position manually by setting the left / top css styles of the
				container property.
			@type Boolean
			*/
			this.autoPosition = opts.autoPosition;

			/**
			@name glow.widgets.Overlay#isShown
			@description True if the overlay is showing
			@type Boolean
			*/
			this.isShown = false;

			/**
			 * @name glow.widgets.Overlay#returnTo
			 * @description Element to give focus to when the overlay closes
			 *   For accessibility purposes you may want to set an element to give focus to when the overlay closes.
			 *   This meanss devices which present data to the user by the cursor position (such as screen readers)
			 *   will be sent somewhere useful.
			 * @type selector|Element|glow.dom.NodeList
			 */
			this.returnTo = opts.returnTo;

			//this is used to prevent show / hide commands while animations are underway
			this._blockActions = false;

			//add the content to the page
			overlayNode.append(contentNode).appendTo(docBody);

			//add close event to mask if needed
			if (opts.closeOnMaskClick && opts.mask) {
				events.addListener(opts.mask, "click", function() {
					that.hide();
				});
			}

			//add IE iframe hack if needed
			if (glow.env.ie < 7 && !opts.modal) {
				this._iframe = dom.create(iframeSrc).css("z-index", opts.zIndex - 1).appendTo(docBody);
			}

			//apply aria role
			if (opts.ariaRole) {
				overlayNode.attr("role", opts.ariaRole);
			}

			//apply aria properties
			for (i in opts.ariaProperties) {
				overlayNode.attr("aria-" + i, opts.ariaProperties[i]);
			}

			//closeOnEsc
			if (this.opts.closeOnEsc)
			{
				// If we are going to close the overlay when the user presses the ESC key, we need
				// the overlay to be able to gain focus, so it can capture any events on itself.
				overlayNode.attr("tabIndex", "0");

				// keypress + ESC key not being recognised in webkit, so use keyup instead.
				// However, keyup + Opera doesn't recognise the ESC key, so use keypress as 
				// default for all other browsers.
				// https://bugs.webkit.org/show_bug.cgi?id=25147
				// http://code.google.com/p/chromium/issues/detail?id=9061#c2
				var escKeyEvent = (glow.env.webkit) ? "keyup" : "keypress";

				// When the user presses the ESC key hide the overlay.
				glow.events.addListener(overlayNode, escKeyEvent, function(e){
					if (e.key == "ESC")
					{
						that.hide();
					}
				});
				
			}
		}

		Overlay.prototype = {
			/**
			@name glow.widgets.Overlay#setPosition
			@function
			@description Change or recalculate the position of the overlay
				Call with parameters to
				change the position of the overlay or call without parameters to recalculate
				the position of the overlay. You may need to call this without parameters
				if relative positions become invalid.

			@param {Number|String} [x]
				distance of overlay from the left of the viewport. If the unit is a percentage
				then 0% is aligned to the left of the viewport, 100% is aligned to the right of viewport and 50% is centered.
			@param {Number|String} [y]
				distance of overlay from the top of the viewport. If the unit is a percentage
				then 0% is aligned to the left of the viewport, 100% is aligned to the right of viewport and 50% is centered.

			@returns this
			*/
			setPosition: function(x, y) {
				var container = this.container;
				//don't use set position if autoPosition is false
				if (this.autoPosition) {
					//if values have been provided, set them. Make sure we're not being passed an event object!
					if (x !== undefined && !(x.source)) {
						this.opts.x = x;
						this.opts.y = y;
					}
					var win = $(window),
						x = this.opts.x,
						y = this.opts.y,
						xVal = parseFloat(this.opts.x),
						yVal = parseFloat(this.opts.y),
						blockScrollPos = this._blockScrollRepos,
						useFixedThisTime = useFixed && (!blockScrollPos.x) && (!blockScrollPos.y),
						extraOffset = ((this.opts.mask && this.opts.mask.opts.disableScroll) || useFixedThisTime) ? {x:0,y:0} : widgets._scrollPos(),
						//these are only set if % are involved
						winWidth,
						winHeight,
						containerWidth,
						containerHeight;

					useFixedThisTime && container.css("position", "fixed");

					if (typeof x == "string" && x.indexOf("%") != -1) {
						winWidth = win.width();
						containerWidth = container[0].offsetWidth;

						//what if there's more panel than view?
						if (containerWidth > winWidth) {
							if (!blockScrollPos.x) { //set up the initial position
								container.css("left", widgets._scrollPos().x + "px").css("position", "absolute");
								blockScrollPos.x = true;
							} else if (this.opts.modal && $(document).width() < containerWidth) { //does the mask need to extend further?
								this.opts.mask.maskElement.css("width", containerWidth + "px");
							}
						} 
						else {
							blockScrollPos.x = false;
							container.css("left", Math.max(((winWidth - containerWidth) * (xVal/100)) + extraOffset.x, extraOffset.x) + "px");
						}
					} 
					else {
						container.css("left", xVal + extraOffset.x + "px");
					}

					if (typeof y == "string" && y.indexOf("%") != -1) {
						winHeight = win.height();
						containerHeight = container[0].offsetHeight;

						//what if there's more panel than view?
						if (containerHeight > winHeight) {
							if (!blockScrollPos.y) { //set up the initial position
								container.css("top", widgets._scrollPos().y + "px").css("position", "absolute");
								blockScrollPos.y = true;
							} else if (this.opts.modal && $(document).height() < containerHeight) {
								this.opts.mask.maskElement.css("height", containerHeight + "px");
							}
						} 
						else {
							blockScrollPos.y = false;
							container.css("top", Math.max(((winHeight - containerHeight) * (yVal/100)) + extraOffset.y, extraOffset.y) + "px");
						}
					} 
					else {
						container.css("top", yVal + extraOffset.y + "px");
					}
				}

				if (glow.env.ie < 7 && !this.opts.modal) {
					var overlayStyle = container[0].style;
					this._iframe.css("top", overlayStyle.top).
								 css("left", overlayStyle.left).
								 css("width", container[0].offsetWidth + "px").
								 css("height", container[0].offsetHeight + "px");
				}
				return this;
			},
			/**
			@name glow.widgets.Overlay#show
			@function
			@description Displays the overlay

			@returns this
			*/
			show: function() {
				var that = this,
					showAnim,
					animOpt = that.opts.anim;

				if (that._blockActions || that.isShown) { return that; }

				if (events.fire(that, "show").defaultPrevented()) {
					return that;
				}

				//reset scroll blocking
				this._blockScrollRepos = {x:false, y:false};

				hideElms(that);
				that.container.css("display", "block");
				if (that.opts.modal) {
					that.opts.mask.add();
				} else if (glow.env.ie < 7) {
					that._iframe.css("display", "block");
				}
				that._scrollEvt = events.addListener(window, "scroll", that.setPosition, that);
				that._resizeEvt = events.addListener(window, "resize", that.setPosition, that);

				that.setPosition();

				//run the appropiate animation
				if (typeof animOpt == "string") {
					showAnim = generatePresetAnimation(that, true);
				} else if (typeof animOpt == "function") {
					showAnim = animOpt(that, true);
				} else if (animOpt) {
					showAnim = animOpt.show;
				}
				if (showAnim) {
					if (! showAnim._overlayEvtAttached) {
						events.addListener(showAnim, "complete", function() {
							that._blockActions = false;
							that.isShown = true;
							that.container.attr("aria-hidden", "false");
							events.fire(that, "afterShow");
						});
						showAnim._overlayEvtAttached = true;
					}
					that._blockActions = true;
					showAnim.start();
					that.container.css("visibility", "visible");
				} 
				else {
					that.container.css("visibility", "visible");
					that.isShown = true;
					that.container.attr("aria-hidden", "false");
					events.fire(that, "afterShow");
				}

				//send keyboard focus
				if (that.opts.focusOnShow) {
					that._focalPoint[0].focus();
				}
				
				if (that.opts.modal) { addModalBehaviour.call(that); }
				
				return that;
			},
			/**
			@name glow.widgets.Overlay#hide
			@function
			@description Hides the overlay

			@returns this
			*/
			hide: function() {
				var that = this,
					hideAnim,
					animOpt = that.opts.anim,
					returnTo = that.returnTo ? $(that.returnTo) : new glow.dom.NodeList(),
					returnNodeName;

				if (this._blockActions || !that.isShown) { return that; }
				
				if (events.fire(that, "hide").defaultPrevented()) {
					return that;
				}
				
				if (that.opts.modal) { removeModalBehaviour.call(that); }
				
				//run the appropiate animation
				if (typeof animOpt == "string") {
					hideAnim = generatePresetAnimation(that, false);
				} else if (typeof animOpt == "function") {
					hideAnim = animOpt(that, false);
				} else if (animOpt) {
					hideAnim = animOpt.hide;
				}
				if (hideAnim) {
					if (! hideAnim._overlayEvtAttached) {
						events.addListener(hideAnim, "complete", function() {
							closeOverlay(that);
							that._blockActions = false;
							that.isShown = false;
							events.fire(that, "afterHide");
						});
						hideAnim._overlayEvtAttached = true;
					}
					that._blockActions = true;
					hideAnim.start();
				} 
				else {
					closeOverlay(that);
					that.isShown = false;
					events.fire(that, "afterHide");
				}


				//update aria state
				that.container.attr("aria-hidden", "true");
				//move the focus if applicable
				if (returnTo[0]) {
					returnNodeName = returnTo[0].nodeName.toLowerCase();

					//give the element a tab index if it needs one
					if (returnTo[0].tabindex == undefined ||
						returnNodeName != "input" ||
						returnNodeName != "select" ||
						returnNodeName != "textarea" ||
						returnNodeName != "a") {

						returnTo.attr("tabindex", "-1");
					}
					
					returnTo[0].focus();
				}

				// Fix for trac 170 - Overlay: In IE, flash continues to play when overlay is hidden
				// If flash content detected then reinsert the element into its existing position within the DOM.
				// This causes IE to stop the flash movie playing without removing it from the DOM (which would leave us open to JS errors)
				if (glow.env.ie) {
					that.content.get("object").each(function(i) {

						if (
							(this.getAttribute("type") == "application/x-shockwave-flash" ||
							flashUrlTest.test(this.getAttribute("data") || this.getAttribute("src") || "") ||
							(this.getAttribute("classid") || "").toLowerCase() == "clsid:d27cdb6e-ae6d-11cf-96b8-444553540000")
						) {
							this.parentNode.insertBefore(this, this.nextSibling);
						}

					});
				}

				return that;
			}
		};
		
		/** 
			@private
			@description Enforce requirement that focus to stay within the topmost overlay.
			@this {glow.widgets.Overlay}
		 */
		function addModalBehaviour() {
			if (this._keepfocusEventId !== undefined) { return; } // already added this requirement
			
			var overlay = this,   // this overlay
			overlayZindex = null; // the z-index of this overlay
			
			overlayZindex = overlay.container.css('z-index'); // to be closured
			
			this._keepfocusEventId = events.addListener($('body'), 'focus', function(e) {
				var parent = null,   // the parent element of the source element that is a child of the body
				parentZindex = null; // the zindex of that parent
				
				// calculate the zindex of the source elements parent
				parent = e.source.parentNode;				
				while (parent) {
					if (parent.parentNode == document.body) { break; }
					parent = parent.parentNode;
				}
				parentZindex = $(parent).css('z-index');
				
				// when the source element's zindex is less than ours, we take focus back
				if (!parentZindex || parentZindex == "auto" || parentZindex < overlayZindex) {
					overlay._focalPoint && overlay._focalPoint[0].focus();
					return false;
				}
			});
		}
		
		/** 
			@private
			@description Leave environment clean of all changes made by addModalbehaviour().
			@this {glow.widgets.Overlay}
		 */
		function removeModalBehaviour() {
			if (this._keepfocusEventId === undefined) { return; } // already removed this requirement
			events.removeListener(this._keepfocusEventId);
			delete this._keepfocusEventId;
		}
		
		glow.widgets.Overlay = Overlay;
	}
});
