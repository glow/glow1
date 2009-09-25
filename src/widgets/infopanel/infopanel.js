(window.gloader || glow).module({
	name: "glow.widgets.InfoPanel",
	library: ["glow", "@VERSION@"],
	depends: [[
		"glow", "@VERSION@",
		'glow.dom',
		'glow.events',
		'glow.widgets.Panel'
	]],
	builder: function(glow) {
		var dom = glow.dom,
			$ = dom.get,
			events = glow.events,
			widgets = glow.widgets,
			lang = glow.lang,
			env = glow.env,
			win,
			positionRegex = /glowCSSVERSION\-infoPanel\-point[TRBL]/,
			offsetInContextDefaults = {
				T: {x:"50%", y:"100%"},
				R: {x:0, y:"50%"},
				B: {x:"50%", y:0},
				L: {x:"100%", y:"50%"}
			};

		glow.ready(function() {
			win = $(window);
		});

		/*
		PrivateMethod: resolveRelative
			will work out x & y pixel values for percentage values within a context element.
			Non percentage values will just be passed back
		*/
		function resolveRelative(point, context) {
			var vals = [point.x, point.y],
				axis = ["x", "y"],
				sides = ["Width", "Height"],
				i = 0;

			//calculate for x & y
			for (; i < 2; i++) {
				if (vals[i].slice) {
					vals[i] = parseFloat(point[axis[i]]);
					if (point[axis[i]].slice(-1) == "%") {
						vals[i] = context[0]["offset" + sides[i]] * (vals[i]/100);
					}
				}
			}
			return {x: vals[0], y: vals[1]};
		}

		/*
		PrivateMethod: calculateBestPointerSide
			works out which side the pointer should appear on
		*/
		function calculateBestPointerSide(contextPos, contextSize) {
			//right, we need to work out where to put the box ourselves
			var scrollPos = widgets._scrollPos(),
				winSize = {x: win.width(), y:win.height()},
				//let's see how much free space there is around the context
				freeSpace = {
					T: winSize.y - contextPos.top - contextSize.y + scrollPos.y,
					R: contextPos.left - scrollPos.x,
					B: contextPos.top - scrollPos.y,
					L: winSize.x - contextPos.left - contextSize.x + scrollPos.x
				},
				preferenceOrder = ["T", "R", "B", "L"];

			preferenceOrder.sort(function(a, b) {
				return freeSpace[b] - freeSpace[a];
			});

			//could this be made clevererer? (which is why I did the preferenceOrder thing, the first may not always be best)
			return preferenceOrder[0];
		}
		/**
		@name glow.widgets.InfoPanel
		@class
		@description A panel with content directed at a particular point on the page.
		@augments glow.widgets.Panel
		@see <a href="../furtherinfo/widgets/infopanel/">InfoPanel user guide</a>

		@param {selector|Element|glow.dom.NodeList} content
			the element that contains the contents of the Panel. If this is
			in the document it will be moved to document.body. If your content node has a child element with class "hd"
			it will be added to the header of the panel. Similarly, an element with class "ft" will be added to the
			footer of the panel.

		@param {Object} opts
			Zero or more of the following as properties of an object:
			@param {String|Element|glow.dom.NodeList} [opts.context] Element to point at.
				If no context is provided then the panel must be positioned manually using
				the container property.
			@param {String} [opts.pointerPosition] Restrict the point to a particular side.
				The default is dependant on the context's position on the page.
				The panel will try to be where it is most visible to the user. To restrict the position,
				set this property to "t"/"r"/"b"/"l"; top / left / bottom / right respectively.
			@param {String} [opts.theme="light"] Visual theme
				Only applies when using the default template. Currently supported themes are "dark" and "light".
			@param {Object} [opts.offsetInContext] Position of the pointer within the context.
				In the format {x: 24, y: "50%"}. The default points to an edge of
				the context, depending on the position of the pointer.
			@param {Object} [opts.pointerRegisters] Identify the position of the point within pointer elements.
				Only required for custom templates.
			@param {Boolean} [opts.modal=false] is the overlay modal?
				If true then a default Mask will be created if one is not provided.
			@param {String} [opts.ariaRole="tooltip"] The aria role of the panel.
				This is used for accessibility purposes,
				the default is acceptable for panels which provide descriptive
				content for a page element
			@param {selector|Element|glow.dom.NodeList} [opts.returnTo] Element to give focus to when the overlay closes
				By default, this is the context element if focusOnShow is true.
				
				For accessibility purposes you may want to set an element to give focus to when the overlay closes.
				This means devices which present data to the user by the cursor position (such as screen readers)
				will be sent somewhere useful.
		*/
		function InfoPanel(content, opts) {
			opts = opts || {};

			if (opts.template) {
				var customTemplate = true;
			}

			opts = glow.lang.apply({
				modal: false,
				theme: "light",
				autoPosition: !!opts.context,
				pointerRegisters: {
					t: {x: "50%", y: 0},
					r: {x: "100%", y: "50%"},
					b: {x: "50%", y: "100%"},
					l: {x: 0, y: "50%"}
				},
				ariaRole: "tooltip",
				focusOnShow: true
				// the default for opts.returnTo is set below
			}, opts);
			
			if (opts.focusOnShow && opts.returnTo === undefined) {
				opts.returnTo = opts.context;
			}

			//deal with context if it's a selector
			opts.context = opts.context && $(opts.context);

			widgets.Panel.call(this, content, opts);

			//add describedby aria bit
			opts.context && opts.context.attr("aria-describedby", this.container[0].id);

			if (!customTemplate) {
				this.content.addClass("glowCSSVERSION-infoPanel");
			}

			this.content.addClass("glowCSSVERSION-infoPanel-point" + (opts.pointerPosition || "t").slice(0,1).toUpperCase());
		}
		lang.extend(InfoPanel, widgets.Panel);

		lang.apply(InfoPanel.prototype, {
			/**
			@name glow.widgets.InfoPanel#setPosition
			@function
			@description Change or recalculate the position of the InfoPanel
				Call with parameters to
				change the position of the InfoPanel or call without parameters to simply
				reposition. You may need to call this without parameters if the element
				the Panel is pointing at changes position.

			@param {Number|String} [x]
				Pixel distance from the left of the document to point at.
			@param {Number|String} [y]
				Pixel distance from the top of the document to point at.

			@returns this
			*/
			setPosition: function(x, y) {
				//don't use set position if autoPosition is false
				var valsPassed = (x !== undefined && !(x.source)),
					// a quick and dirty way to find out if the element is visible
					isCurrentlyHidden = !this.container[0].offsetHeight;

				if (!(this.autoPosition || valsPassed)) {
					return this;
				} else if (valsPassed) {
					this.autoPosition = false;
				}

				if ( isCurrentlyHidden ) {
					// Remove display:none; so container will render and
					// we can find offSets
					this.container.css("display","block");
				}

				var opts = this.opts,
					contentNode = this.content[0],
					pointerPosition = (opts.pointerPosition || "").slice(0,1),
					context = opts.context,
					container = this.container,
					//here's what we need to position the pointer
					pointerElm,
					//this will hold the point the user passed, or the context's offset
					contextOffset = valsPassed ? {left:x, top:y} : context.offset(),
					contextSize = valsPassed ? {x:0, y:0} : {x:context[0].offsetWidth, y:context[0].offsetHeight},
					offsetInContext,
					pointOffsetInPanel,
					pointerInnerOffset,
					panelOffset = container.offset(),
					pointerOffset,
					lastPointerPosition;

				if (!pointerPosition) {
					//right, we need to work out where to put the box ourselves
					pointerPosition = calculateBestPointerSide(contextOffset, contextSize);
					if (lastPointerPosition != pointerPosition) {
						lastPointerPosition = pointerPosition;
						contentNode.className = contentNode.className.replace(positionRegex, "glowCSSVERSION-infoPanel-point" + pointerPosition);
						pointerElm = container.get(".infoPanel-pointer" + pointerPosition);
					}
				} else {
					pointerPosition = pointerPosition.toUpperCase();
				}

				if (!pointerElm) {
					pointerElm = container.get(".infoPanel-pointer" + pointerPosition);
				}

				//get default offset if there isn't one
				offsetInContext = valsPassed ? {x:0, y:0} : resolveRelative(opts.offsetInContext || offsetInContextDefaults[pointerPosition], context);
				pointerInnerOffset = resolveRelative(opts.pointerRegisters[pointerPosition.toLowerCase()], pointerElm);
				pointerOffset = pointerElm.offset();
				pointOffsetInPanel = {left: pointerOffset.left - panelOffset.left + pointerInnerOffset.x, top: pointerOffset.top - panelOffset.top + pointerInnerOffset.y};

				if ( isCurrentlyHidden )	{
					// Leave things as we found them
					this.container.css("display","none");
				}

				container.css("left", contextOffset.left + offsetInContext.x - pointOffsetInPanel.left + "px").
						  css("top", contextOffset.top + offsetInContext.y - pointOffsetInPanel.top + "px");

				if (env.ie < 7 && !opts.modal) {
					var overlayStyle = container[0].style;
					this._iframe.css("top", overlayStyle.top).
								 css("left", overlayStyle.left).
								 css("width", container[0].offsetWidth + "px").
								 css("height", container[0].offsetHeight + "px");
				}
				return this;
			},
			/**
			@name glow.widgets.InfoPanel#setContext
			@function
			@description Change element to point at.
				If no context is provided then the panel must be positioned manually using
				the container property.

			@param {String|HTMLElement|glow.dom.NodeList} context
				Element to point at

			@returns this
			*/
			setContext: function(context) {
				var currentContext = this.opts.context;
				if (currentContext) {
					//remove aria from current context
					currentContext.removeAttr("aria-describedby");
					//change the returnTo value if it's currently refering to the context
	
					if ($(this.returnTo)[0] == currentContext[0]) {
						this.returnTo = context;
					}
				}
				
				//add aria to new context
				this.opts.context = $(context).attr("aria-describedby", this.container[0].id);
				if (!this.returnTo) {
					this.returnTo = this.opts.context;
				}
				this.autoPosition = true;
				if (this.container[0].style.display == "block") {
					this.setPosition();
				}
				return this;
			}
		});

		glow.widgets.InfoPanel = InfoPanel;
	}
});
