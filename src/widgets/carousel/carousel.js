(window.gloader || glow).module({
	name: "glow.widgets.Carousel",
	library: ["glow", "@VERSION@"],
	depends: [[
		"glow", "@VERSION@",
		"glow.dom",
		"glow.events",
		"glow.anim",
		"glow.widgets",
		'glow.i18n'
	]],
	builder: function(glow) {
		var $      = glow.dom.get,
		    events = glow.events,
		       dom = glow.dom,
   			$i18n  = glow.i18n;
		
		$i18n.addLocaleModule("GLOW_WIDGETS_CAROUSEL", "en", {
			PREVIOUS : "previous",
			NEXT : "next"
		});
		
		/**
			@name glow.widgets.Carousel
			@class
			@description Scroll through a list of items

			<div class="info">Widgets must be called in a <code>glow.ready()</code> call.</div>
	
			@param {glow.dom.NodeList} container The container of items to display as a carousel.
			@param {Object} opts Options object
				@param {Boolean} [opts.loop=false] True if the carousel should loop when it gets to the end.
					When using the loop option, it is good practice to indicate to the user how far they have scrolled through the carousel.  We recommend the use of the pageNav parameter when allowing the user the loop to the begining of the carousel.
				@param {Number} [opts.animDuration=0.2] Duration of animation in seconds.
				@param {Function} [opts.animTween=glow.tweens.easeBoth()] A Glow tween function to animate scrolling.
				@param {Number|String} [opts.step=1] Number of items to scroll by. When the string 'page' is passed in the carousel will be set to scroll by the number of viewable items.
				@param {Function} [opts.onAddItem] Event shortcut.
				{@link glow.widgets.Carousel.AddItem See documentation below}
				@param {Function} [opts.onRemoveItem] Event shortcut.
				{@link glow.widgets.Carousel.RemoveItem See documentation below}
				@param {Function} [opts.onScroll] Event shortcut.
				{@link glow.widgets.Carousel.onScroll See documentation below}
				@param {Function} [opts.onAddItem] Event shortcut.
				{@link glow.widgets.Carousel.AddItem See documentation below}
				@param {Function} [opts.onAfterScroll] Event shortcut.
				{@link glow.widgets.Carousel.AfterScroll See documentation below}
				@param {Function} [opts.onItemClick] Event shortcut.
				{@link glow.widgets.Carousel.ItemClick See documentation below}
				@param {Boolean} [opts.vertical=false] Used to create a vertical oriented carousel
				@param {Number} [opts.size] Number of items the carousel displays at any one time
					By default, the carousel will fill all available horizontal (or vertical) space.
				@param {Boolean} [opts.scrollOnHold=true] Continue to scroll while button is held down.
				@param {Boolean} [opts.slideOnScroll=false] Use sliding animation when scrolling continuously.
				@param {String} [opts.theme="light"] Visual Theme
					Only applies when using the default template.  Currently supported themes are "dark" and "light".
				@param {Boolean} [opts.pageNav=false] Display navigational control next to the carousel.
				@param {String} [opts.id] An ID to apply to the container element.
				@param {String} [opts.className] List of additional space separated class names to apply to the container.
					Space separated values.
	
			@example
				var myCarousel = new glow.widgets.Carousel("#carouselContainer", {
					loop: true,
					size: 4,
					step: 4
				});
	
			@see <a href="../furtherinfo/widgets/carousel/">Carousel user guide</a>
		*/
		/**
			@name glow.widgets.Carousel#event:addItem
			@event
			@description One or more items about to be added to the carousel.
		
					Canceling this event stops the items being added.
			
			@param {glow.events.Event} event Event Object
			@param {glow.dom.NodeList} event.items NodeList of items being added
		*/
		/**
			@name glow.widgets.Carousel#event:removeItem
			@event
			@description Item about to be removed.

				Canceling this event results in the item not being removed.
			
			@param {glow.events.Event} event Event Object
			@param {glow.dom.NodeList} event.item Represents the item to be removed
			@param {Number} event.itemIndex Index of the item to be removed
		*/
		/**
			@name glow.widgets.Carousel#event:scroll
			@event
			@description Fired before scrolling.
			
			@param {glow.events.Event} event Event Object
			@param {Number} event.currentPosition Carousel's current position
		*/
		/**
			@name glow.widgets.Carousel#event:afterScroll
			@event
			@description Fired after scrolling animation is complete.
			
			@param {glow.events.Event} event Event Object
			@param {Number} event.position The carousel's new position
		*/
		/**
			@name glow.widgets.Carousel#event:itemClick
			@event
			@description Fired when an item within the carousel is clicked.

				The event contains properties 'item' an html element
				representing the clicked item, and 'itemIndex', the index of the item
				clicked.
			
			@param {glow.events.Event} event Event Object
			@param {HTMLElement} event.item Represents the item clicked.
				Conver this to a nodelist using {@link glow.dom.get}.
			@param {Number} event.itemIndex Index of the item clicked
			
		*/

		/* Public Properties */

		/**
			@name glow.widgets.Carousel#element
			@type glow.dom.NodeList
			@description Carousel HTML Element.
			@example
				var myCarousel = new glow.widgets.Carousel("#carouselContainer");
				glow.events.addListener(myCarousel, "itemClick", function(e) {
					alert(this.element) // returns the HTML element "#carouselContainer"
				});
		*/

		/**
			@name glow.widgets.Carousel#items
			@type glow.dom.NodeList
			@description NodeList of the items within the carousel.
			@example
				var myCarousel = new glow.widgets.Carousel("ul#carouselContainer");
				glow.events.addListener(myCarousel, "itemClick", function(e) {
					alert(this.items) // returns an array of &lt;li /&gt; elements in "ul#carouselContainer"
				});
		*/
		function Carousel(container, opts) {
			var localeModule = $i18n.getLocaleModule("GLOW_WIDGETS_CAROUSEL");
						
			opts = opts || {}; // prevent errors when trying to read properties of undefined opts
			
			// create carousel content
			this._content = $(container);
			
			this._startContentHeight = this._content[0].offsetHeight;

			this._content.addClass("carousel-content") // add a css selector hook 
				.css("zoom", "1"); // hack: adds "haslayout" on ie
			
			this.items = this._content.children();
			
			// set option defaults
			opts = this._opts = glow.lang.apply(
				{
					animDuration: 0.4,
					animTween: glow.tweens.easeBoth(),
					loop: false,
					step: 1,
					vertical: false,
					scrollOnHold: true,
					slideOnScroll: false,
					theme: "light",
					pageNav: false
				},
				opts
			);
			
			// cast the integers
			opts.animDuration = Number(opts.animDuration);
			opts.size = Number(opts.size);
			

			// build HTML
			this.element =
				dom.create("<div"
					+ (this._opts.id? " id=\"" + this._opts.id + "\"" : "")
					+ " class=\"" + (this._opts.vertical? "glowCSSVERSION-vCarousel" : "glowCSSVERSION-carousel")
					+ (this._opts.className? " " + this._opts.className : "")
					+ "\"></div>"
				);
			var themeWrapper = dom.create("<div class=\"carousel-"+this._opts.theme+"\"><\/div>");
			this._viewWindow = dom.create("<div class=\"carousel-window\"><\/div>");
						
			// move the carousel items into the carousel view window, themewrapper, and carousel content
			this._content.before(this.element);
			themeWrapper.prependTo(this.element);
			this._viewWindow.prependTo(themeWrapper);
			this._content.prependTo(this._viewWindow);
			
			// add selector hooks
			if (this._opts.vertical) {
				this.element.addClass("glowCSSVERSION-vCarousel");
			}
			else {
				this.element.addClass("glowCSSVERSION-carousel");
			}
			
			// create the navigational buttons
			if (!this._opts.pageNav) {
				this._navPrev = dom.create("<a class=\"carousel-nav carousel-prev\" href=\"#\"><span class=\"carousel-label\">{PREVIOUS}</span><span class=\"carousel-background\"></span><span class=\"carousel-top\"></span><span class=\"carousel-bottom\"></span><span class=\"carousel-arrow\"></span></a>", {interpolate: localeModule}).insertBefore(this._viewWindow);
				this._navNext = dom.create("<a class=\"carousel-nav carousel-next\" href=\"#\"><span class=\"carousel-label\">{NEXT}</span><span class=\"carousel-background\"></span><span class=\"carousel-top\"></span><span class=\"carousel-bottom\"></span><span class=\"carousel-arrow\"></span></a>", {interpolate: localeModule}).insertAfter(this._viewWindow);
			}
			
			init.apply(this, [container, opts]);
		}
		
		/**
			Runs only once, during construction phase.
			@private
		 */
		function init(container, opts) {
			var that = this; // used in callbacks to refer to myself
			
			if (this.items.length == 0) { return; }
			// calculate the view size if it isn't given, and size the view window
			// we absolutely position the item for a moment so it shrinks to fit
			var oldPositionVal = this.items[0].style.position;
			this.items[0].style.position = "absolute";
			this._itemWidth  = this.items[0].offsetWidth  + parseInt( $(this.items[0]).css(["margin-left", "margin-right"]) );
			this._itemHeight = this.items[0].offsetHeight + parseInt( $(this.items[0]).css(["margin-top", "margin-bottom"]) );
			this.items[0].style.position = oldPositionVal;
			// Is there a fraction of an item hanging off the end of the carousel?
			// This can only happen if opts.size is false
			this._itemHangingOffEnd = false;
			if (!opts.size) { // you really should just give me the size, don't you think? yes, I know it's optional but is that really too much to ask for considering everything? really?
				var itemsInView;
				
				if (opts.vertical) {
					
					this._sizeView = this._startContentHeight;
					if (!this._opts.pageNav) this._sizeView -= this._navPrev[0].offsetHeight + this._navNext[0].offsetHeight;
					
					this._viewWindow.css("width", this._itemWidth + "px");
					this._viewWindow.css("height", this._sizeView + "px");
					
					itemsInView = this._sizeView / this._itemHeight;
					this._opts.size = Math.floor(itemsInView);
					// do we have an item hanging off the end?
					this._itemHangingOffEnd = (itemsInView != this._opts.size);
					
					// now fix the size to prevent wrapping if the browser is resized
					this.element.css("height", this._sizeView + (this._opts.pageNav? 0 : this._navPrev[0].offsetHeight + this._navNext[0].offsetHeight) + "px");
				}
				else {
					this._sizeView = this.element[0].offsetWidth;
					if (!this._opts.pageNav) this._sizeView -= this._navPrev[0].offsetWidth + this._navNext[0].offsetWidth;

					this._viewWindow.css("width", this._sizeView + "px");
					this._viewWindow.css("height", this._itemHeight + "px");
					
					itemsInView = this._sizeView / this._itemWidth;
					this._opts.size = Math.floor(itemsInView);
					// do we have an item hanging off the end?
					this._itemHangingOffEnd = (itemsInView != this._opts.size);
					
					
					this.element.css("width", this._sizeView + (this._opts.pageNav? 0 : this._navPrev[0].offsetWidth + this._navNext[0].offsetWidth) + "px");
				}
			}
			else {
				if (this._opts.vertical) {
					this._viewWindow.css("width", this._itemWidth + "px");
					this._viewWindow.css("height", this._opts.size * this._itemHeight + "px");
				}
				else {
					this._viewWindow.css("width", this._opts.size * this._itemWidth + "px");
					this._viewWindow.css("height", this._itemHeight + "px");
				}
			}

			// Change for trac 151
			// If step set to page then set the carousel to step through the items by the number of viewable items
			if (this._opts.step == "page")
			{
				this._opts.step = this._opts.size;
			}

			// check that options are sane
			if (this._opts.size < this._opts.step) {
				throw new Error("Carousel opts.step ("+this._opts.step+") cannot be larger than carousel size ("+this._opts.size+").");
			}
			
			// install listeners for optional event handlers
			var eventNames = ["addItem","removeItem","scroll","afterScroll","itemClick"],
				i = eventNames.length,
				onEventName;
			while(i--) {
				// convert names from event to onEvent
				onEventName = "on" + eventNames[i].charAt(0).toUpperCase() + eventNames[i].slice(1);
				if (opts[onEventName]) {
					events.addListener(that,eventNames[i],opts[onEventName]);
				}
			}
			
			// have the nav items already got a width / height set on the style attribute?
			this._customButtonDimentions = (this._navPrev && this._navNext) && (
				this._navPrev[0].style.width
				|| this._navPrev[0].style.height
				|| this._navNext[0].style.width
				|| this._navNext[0].style.height
			);
			
			this._originalOptsLoop = this._opts.loop; // Added for bug fix trac 152 ***

			rebuild.apply(this);
			
			// apply events
			addMouseNavEvents.call(this);
			addKeyboardNavEvents.call(this);
			addItemClickEvent.call(this);
			
			this._ready = true;
		}
		
		/**
			Deal with delegation for the itemClick event
			@private
		*/
		function addItemClickEvent() {
			// set up item events
			var that = this;
			
			glow.events.addListener(that._content, "click", function(e) { /*debug*///console.log("item clicked "+e.source);
				var el = $(e.source),
					event;
				
				for (; el[0] != that.element[0]; el = el.parent()) { // climb up the dom tree
					if (el.hasClass("carousel-item")) {
						if (!el.hasClass("carousel-pad")) {
							event = glow.events.fire(that, "itemClick", {
								item: el[0],
								itemIndex: el[0]["_index"+glow.UID] % that._countReal
							});
							return !event.defaultPrevented();
						}
						break;
					}
				}
			});
		}
		
		// add events for mouse navigation
		function addMouseNavEvents() {
			var that = this,
				bothNavElms = $(this._navPrev).push(this._navNext);
				
			// add navigational events
			events.addListener(bothNavElms, "click", function(e) {
				return false;
			});
			events.addListener(bothNavElms, "mouseup", function(e) {
				stopRepeatOrSlide.call(that);
				return false;
			});
			events.addListener(bothNavElms, "mouseleave",  function(e){
				stopRepeatOrSlide.call(that);
			});
			events.addListener(this._navPrev, "mousedown", function(e) {
				that.prev();
				startRepeatOrSlide.call(that, true);
				return false;
			});
			events.addListener(this._navNext, "mousedown", function(e){
				that.next();
				startRepeatOrSlide.call(that);
				return false;
			});
		}
		
		/**
			Add the events needed for keboard navigation
			@private
		*/
		function addKeyboardNavEvents() {
			// keyboard nav
			var currentKeyDown,
				that = this;
				
			events.addListener(this.element, "keydown", function(e) {
				if (currentKeyDown) {
					return false;
				}
				switch (e.key) {
					case "UP":
					case "LEFT":
						currentKeyDown = e.key
						if ( !that._isPlaying() ) {
							that.prev();
							startRepeatOrSlide.call(that, true);
						}
						return false;
					case "DOWN":
					case "RIGHT":
						currentKeyDown = e.key
						if ( !that._isPlaying() ) {
							that.next();
							startRepeatOrSlide.call(that);
						}
						return false;
					case "ENTER":
						currentKeyDown = e.key
						if ( e.source == that._navNext[0] || (that._pageNav && e.source.parentNode == that._pageNav.rightarrow[0]) ) {
							that.next();
							startRepeatOrSlide.call(that);
							return false;
						} else if (e.source == that._navPrev[0] || (that._pageNav && e.source.parentNode == that._pageNav.leftarrow[0]) ) {
							that.prev();
							startRepeatOrSlide.call(that, true);
							return false;
						}
				}
				
			});
			events.addListener(this.element, "keyup", function(e) {
				switch (e.key) {
					case "UP":
					case "LEFT":
					case "DOWN":
					case "RIGHT":
					case "ENTER":
						currentKeyDown = null;
						stopRepeatOrSlide.call(that);
				}
			});
			// prevent scrolling in opera
			events.addListener(this.element, "keypress", function(e) {
				switch (e.key) {
					case "UP":
					case "LEFT":
					case "DOWN":
					case "RIGHT":
						return false;
					case "ENTER":
						if (
							e.source == that._navNext[0] || (that._pageNav && e.source.parentNode == that._pageNav.rightarrow[0]) ||
							e.source == that._navPrev[0] || (that._pageNav && e.source.parentNode == that._pageNav.leftarrow[0])
						) {
							return false;
						}
				}
			});
			
			// capture focus on the element to catch tabbing
			glow.events.addListener(this.element, "focus", function(e) {
				_focusCallback.call( that, $(e.source) );
			});
		}
		
		// called when the carousel gets focus
		// elm - NodeList of the element which got focus (event source)
		function _focusCallback(elm) {
			var that = this;
			// If the element is not one of the nav buttons (and is not in the pageNav) ...
			if (
				   (elm[0] != this._navNext[0])
				&& (elm[0] != this._navPrev[0])
				&& (elm.parent().parent().hasClass('pageNav') == false)
			) {
				// Get the element's index number from it's parent
				var elmItemNum = _getCarouselItemNum.call(this, elm);
				// return if elmItemNum is -1 (item not found) or item is a clone
				if (elmItemNum === -1 || this.items.slice(elmItemNum, elmItemNum+1).hasClass('carousel-added')) {
					return;
				}
				// And Check to see if the index number is in the array of visible indexes...
				if ( (' ' + this.visibleIndexes().join(' ') + ' ').indexOf(' ' + elmItemNum + ' ') == -1 ) {
					// If so, then move the carousel to that index
					this.moveTo(elmItemNum);
					setTimeout(function() {
						that._content[0].parentNode.scrollLeft = 0;
					}, 0);
				}
			}
		}
		
		// Work out the index number of the element within the carousel
		// elm - NodeList of element in carousel. can be the containing item, or decendant of the containing item
		function _getCarouselItemNum(elm) {
			// Recurse back through parents until we find the carousel item
			while ( !elm.hasClass('carousel-item') ) {
				if ( elm.length == 0 ) {
					// an item doesn't have focus
					return -1;
				}
				elm = elm.parent();
			}
			
			// Create nodeList of passed in element's siblings
			var elmSiblings = elm.parent().children();

			// Default return value is -1, we'll update this if we find a match (we should always find a match so this value is redundant)
			var x = -1;

			// Loop through sibling nodes until we find a match with the original element
			elmSiblings.each(function(i){
				// When we get a match set the value of x to match the index value
				if (elmSiblings[i] == elm[0]) {
					x = i;
				}
			});

			return x;
		}
		
		/**
			Runs during construction phase and whenever items are added or removed.
			@private
		 */
		function rebuild() { /*debug*///console.log("Carousel-rebuild()");
			var that = this; // used in callbacks to refer to myself
    
			this.items = this._content.children();
			var padCount;

			// Bug fix for trac 152 ***
			// Will the content fill the view?
			this._notEnoughContent = this.items.length <= this._opts.size;
			if (this._notEnoughContent)
			{
				// If not then stop any looping and add CSS hook
				this._opts.loop = false;
				this.element.get(".carousel-window").addClass("carousel-notEnoughItems");
			} else {
				//
				this._opts.loop = this._originalOptsLoop;
				this.element.get(".carousel-window").removeClass("carousel-notEnoughItems");
				if (this._navPrev)
				{
					this._navPrev.removeClass("carousel-prev-disabled");
					this._navNext.removeClass("carousel-next-disabled");
				}
			}

			// the number of pads needed differs if we're looping or not
			if (this._opts.loop) {
				// pad items to an even step, prevents carousel getting out of step
				// if the modulus is zero, we deduct the step to make the padCount zero
				padCount = this._opts.step - ((this.items.length % this._opts.step) || this._opts.step);
			} else {
				// first, how many 'next's does it take to see all the items
				var stepsTillEndOfContent = Math.ceil((this.items.length - this._opts.size) / this._opts.step);
				padCount = (this._opts.size + (stepsTillEndOfContent * this._opts.step)) - this.items.length;
				// we need an extra pad if there's an item hanging off the end
				padCount += Number(this._itemHangingOffEnd);
			}
			// use the first item as a model for our pads
			var pad = $(this.items[0]).clone().attr('role', 'presentation'); // hide the padding item from screenreaders
			pad.attr('tabIndex', '-1');
			pad.get('a, img, input').attr('tabIndex', '-1');
			pad.removeAttr("id");
			pad.addClass("carousel-added");
			pad.addClass("carousel-pad");
			
			// in order to set visibility of text nodes to hidden they must be wrapped in an element
			for (var i = pad[0].childNodes.length-1; i >= 0; i--) {
				var padChild = pad[0].childNodes[i];
				if (padChild.nodeType === 3) { // is it a text node?
					var wrappedPadChild = document.createElement('span');
					wrappedPadChild.innerHTML = padChild.nodeValue;
					pad[0].replaceChild(wrappedPadChild, padChild);
				}
			}
			
			/*debug*///pad.html("PAD");
			pad.children().css("visibility", "hidden"); // keep the same dimensions as the model, but don't display anything
				
			for (var i = 0; i < padCount; i++) {
				this._content.append(pad.clone());
			}
			this.items = this._content.children();
			var realCount = this.items.length;
			// grow items by adding clones, allows for wrapping to work
			if (this._opts.loop) {
				// We need an extra clone if there's an item hanging off the end
				var clonesToAdd = this._opts.size + Number(this._itemHangingOffEnd);
				var clone = this.items.slice(0, clonesToAdd).clone(true).attr('role', 'presentation');
				/*debug*///clone.attr("style", "float:left;filter:alpha(opacity=40);opacity:.4;");
				clone.attr('tabIndex', '-1');
				clone.get('a, img, input').attr('tabIndex', '-1');
				clone.addClass("carousel-added");
				this._content.append(clone);
				this.items = this._content.children();
			}
			
			// add css selector hooks
			this.items.addClass("carousel-item"); // add css selector hook
			this.items.each(function(i){ this["_index"+glow.UID] = i; }); // items know their index

			// some private variables
			this._direction = (this._opts.vertical)? "top" : "left";
			this._countRealItems = realCount - padCount;
			this._countReal  = realCount; // includes pads, but not clones
			this._countAll   = this.items.length;
			this._countStep  = this._opts.step;
			this._countView  = this._opts.size;
			this._sizeEach = (this._opts.vertical? this._itemHeight : this._itemWidth);
			this._sizeStep = this._sizeEach * this._opts.step;
			this._sizeView = this._sizeEach * this._opts.size;
			this._sizeReal = this._sizeEach * this._countReal;
			this._sizeAll  = this._sizeEach * this._countAll;
			this._animationTime  = this._opts.animDuration;
			// sliding animations take less time
			this._slideAnimationTime = this._animationTime / 2;
			this._animationTween = this._opts.animTween;
			
			// size the content 
			(this._opts.vertical)? this._content.css("height", this._sizeAll+"px") : this._content.css("width", this._sizeAll+"px");
			
			// position navigation buttons
			if (!this._opts.pageNav && !this._customButtonDimentions) {
				if (this._opts.vertical) {
					this._navPrev.width(parseInt(this.items[0].offsetWidth)+ parseInt($(this.items[0]).css(["margin-left", "margin-right"])));
					this._navNext.width(parseInt(this.items[0].offsetWidth)+ parseInt($(this.items[0]).css(["margin-left", "margin-right"])));
				}
				else {
					this._navPrev.height(parseInt(this.items[0].offsetHeight)+ parseInt($(this.items[0]).css(["margin-top", "margin-bottom"])));
					this._navNext.height(parseInt(this.items[0].offsetHeight)+ parseInt($(this.items[0]).css(["margin-top", "margin-bottom"])));
				}
			}
			
			//// build sliding timelines
				var channelPrev = [];
				var channelNext = [];	
				var slideMove, slideAnim;
				
				function animComplete() {
					afterScroll.apply(that);
				}
				
				// from the start, how many moves can the carousel make before looping to start or running out of items
				if (this._opts.loop) {
					this._movesMax = (this._countReal / this._countStep) - 1;
				}
				else {
					// we use _itemHangingOffEnd to ignore a padded item at the end which is only half in view
					this._movesMax = Math.ceil( ( this._countReal - this._countView - Number(this._itemHangingOffEnd) ) / this._countStep );
				}
				
				// we animate for one more step than _movesMax if we're looping, because we need to loop back to the first set of items (ie, the clones)
				var len = this._movesMax + Number(this._opts.loop);
				for (var i = 0; i < len; i++) {
					slideMove = {};
					slideMove["margin-" + this._direction] = {
						from: (-i * this._sizeStep)+"px",
						to:   (-(i+1) * this._sizeStep)+"px"
					};
	
					slideAnim = glow.anim.css(this._content, this._slideAnimationTime, slideMove, { "tween": glow.tweens.linear() })
					events.addListener(slideAnim, "complete", animComplete);
				
					channelNext.push(slideAnim);
					
					slideMove = {};				
					slideMove["margin-" + this._direction] = {
						from:   (-(i+1) * this._sizeStep)+"px",
						to: (-i * this._sizeStep)+"px"
					};
	
					slideAnim = glow.anim.css(this._content, this._slideAnimationTime, slideMove, { "tween": glow.tweens.linear() })
					events.addListener(slideAnim, "complete", animComplete);
	
					channelPrev.unshift(slideAnim); // note diff in Next, Prev: push versus unshift
				}
				
				this._slidePrev = new glow.anim.Timeline(channelPrev, {loop: this._opts.loop});
				this._slideNext = new glow.anim.Timeline(channelNext, {loop: this._opts.loop});
			////
			
			// initialise the "dots", if they are needed
			if (this._opts.pageNav) {
				this._pageNav = new PageNav(
					this._movesMax + 1,
					function(newPage) {
						that.moveTo(newPage * that._countStep);
					}
				);
				
				// replace the default nav buttons with some from the pageNav
				this._navPrev = this._pageNav.leftarrow;
				this._navNext = this._pageNav.rightarrow;
				
				var carouselWindow = this.element.get(".carousel-window");
				// remove any existing pageNav
				carouselWindow.parent().get(".pageNav").remove()
				this._pageNav.element.insertAfter(carouselWindow);
				carouselWindow.addClass("paged");
				
				// position pageNav so it is centered with carousel window
				if (this._opts.vertical) {
					var topmargin = Math.floor(((carouselWindow[0].offsetHeight) - this._pageNav.element[0].offsetHeight) / 2);
					this._pageNav.element.css("margin-top", topmargin+"px");
				}
				else {
					// assumes width of pageNav list == sum of width of all list items
					var leftmargin = Math.floor(((carouselWindow[0].offsetWidth) - this._pageNav.leftarrow[0].offsetWidth*(3+this._movesMax)) / 2);
					this._pageNav.element.css("margin-left", leftmargin+"px");
				}
				this._pageNav.update( (this._visibleIndexFirst() % this._countReal) / this._countStep );
			}
			
			// set initial disabled-states of the navigation buttons
			if (this._notEnoughContent) { 
				// Added for bug fix trac 152 ***
				// If there isn't enough content to require scrolling then disable both buttons
				if (this._navPrev) {
					this._navPrev.addClass("carousel-prev-disabled");
					this._navNext.addClass("carousel-next-disabled");
				}
			} else if (!this._opts.loop) {
				if (!canGo.apply(this, ["prev"])) this._navPrev.addClass("carousel-prev-disabled");
				else if (!canGo.apply(this, [])) this._navNext.addClass("carousel-next-disabled");
			}
			// need to add back the navigation events on arrows if pageNav is true
			if (this._opts.pageNav) {		    
			    addMouseNavEvents.call(this);
			}

		}
		
		/**
			Move the carousel by one step.
			@private
			@param {Boolean} prev True if moving prevward, otherwise moving nextward.
		 */
		function step(prev) { /*debug*///console.log("step("+prev+")");
			if ( this._isPlaying() || !canGo.call(this, prev) ) return;
			var curMargin = parseInt(this._content.css("margin-" + this._direction)) % this._sizeReal;
			
			if (prev && curMargin == 0) curMargin -= this._sizeReal;
			var newMargin = curMargin - ((prev? -1 : +1 ) * this._sizeStep);
			
			var move = {};
			move["margin-" + this._direction] = {
				from: curMargin,
				to: newMargin
			};
			
			this._step = glow.anim.css(this._content, this._animationTime, move, {
				"tween": this._animationTween
			});
			
			this._step.start();
			var that = this;
			
			glow.events.addListener(this._step, "complete", function() {
				afterScroll.apply(that);
			});
		}
		
		/**
			Start the carousel repeating / sliding
			@private
			@param {Boolean} prev True if moving prevward, otherwise moving nextward.
		 */
		function startRepeatOrSlide(prev) {
			// if either of the timelines are currently playing, exit
			if ( this._slidePrev.isPlaying() || this._slideNext.isPlaying() ) {
				return;
			}
			
			var that = this;
			this._repeat = true;
			
			// either repeat stepping, or start sliding...
			function beginRepeatOrSlide() {
				if (that._opts.slideOnScroll) {
					if (canGo.apply(that, [prev])) {
						var timeOffset = getTimeoffset.apply(that);
						// transpose timeoffset for previous direction
						if (prev) timeOffset = that._slidePrev.duration - timeOffset;
						// pause a little then start sliding
						var timelineToUse = prev ? that._slidePrev : that._slideNext;
						setTimeout( function() {
							if ( that._isPlaying() || !that._repeat ) return;
							timelineToUse.goTo(timeOffset).resume();
						}, 300);
					}
				}
				else {
					if ( !that._repeat ) return;
					step.call(that, prev);
					if (that._step) {
						glow.events.addListener(that._step, "complete", beginRepeatOrSlide);
					}
				}
			}
			
			if (this._opts.scrollOnHold) {
				// if there's currently a step in action (there usually is) we need to wait for it
				if ( this._step && this._step.isPlaying() ) {
					// we set a property on the step to ensure we only set the listener once
					if (!this._step._hasSlidingListener) {
						glow.events.addListener(this._step, "complete", beginRepeatOrSlide);
						this._step._hasSlidingListener = true;
					}
				} else {
					beginRepeatOrSlide();
				}
			}
		}
		
		/**
			Stop the carousel repeating / sliding at the next appropiate moment
			@private
		 */
		function stopRepeatOrSlide() {
			this._repeat = false;
		}
		
		/**
			Is it possible to go one step in the given direction or not?
			@private
			@param {Boolean} prev True if moving prevward, otherwise moving nextward.
			@returns {Boolean}
		 */
		function canGo(prev) { /*debug*///console.log("canGo("+prev+")");
			if (this._opts.loop) return true;
			
			// prevent wrapping on non-looping carousels
			var firstIndex = this._visibleIndexFirst();
			if (prev) {
				return firstIndex != 0;
			}
			// ok, we're seeing if we can travel forward...
			// if there's an item hanging off the end we need to pretend it doesn't exist (it'll always be a padded item, so it's ok)
			return (firstIndex + this._countView) < (this._countAll - Number(this._itemHangingOffEnd));
		}
		
		/**
			Runs before the carousel moves.
			@private
		 */
		function beforeScroll() { /*debug*///console.log("Carousel-beforeScroll()");

			this._navPrev.removeClass("carousel-prev-disabled");
			this._navNext.removeClass("carousel-next-disabled");

			events.fire(this, "scroll", {
				currentPosition: this._visibleIndexFirst() % this._countReal
			});
		}
		
		/**
			Runs after the carousel moves.
			@private
		 */
		function afterScroll() { /*debug*///console.log("Carousel-afterScroll()");
			
			if ( !this._repeat || !this._opts.scrollOnHold ) {
				endScroll.apply(this);
			}
			
			var curItem = this._visibleIndexFirst();
			
			events.fire(this, "afterScroll", {
				position: curItem % this._countReal
			});
			
			if (this._pageNav) {
				this._pageNav.update((curItem % this._countReal) / this._countStep);
			}
			
			if (!this._opts.loop) {
				if (!canGo.apply(this, ["prev"])) this._navPrev.addClass("carousel-prev-disabled");
				else if (!canGo.apply(this, [])) this._navNext.addClass("carousel-next-disabled");
			}
		}
		
		// triggered when scrolling ends
		function endScroll() { /*debug*///console.log("Carousel-endScroll()");
			// stop any currently playing animations
			this._slideNext.stop();
			this._slidePrev.stop();
		}
		
		/**
			@name glow.widgets.Carousel#prev
			@function
			@description Scroll backwards by the number of items defined by step in the constructor.
		*/
		Carousel.prototype.prev = function() { /*debug*///console.log("Carousel#prev()");
			if (!this._isPlaying()) {
				if (!canGo.apply(this, ["prev"])) return this;
				beforeScroll.apply(this, ["prev"]);
				step.apply(this, ["prev"]);
			}
			return this;
		}
		
		/**
			@name glow.widgets.Carousel#next
			@function
			@description Scroll forward by the number of items definded by step in the constructor.
		*/
		Carousel.prototype.next = function() { /*debug*///console.log("Carousel#next()");			
			if (!this._isPlaying()) {
				if (!canGo.apply(this, [])) return this;
				beforeScroll.apply(this, []);
				step.apply(this, []);
			}
			return this;
		}
		
		/**
			Calculate what the time offset of a slide would be.
			
			This is necessary because Timelines are indexed by time.
			@private
			@returns {Number}
		 */
		function getTimeoffset() { /*debug*///console.log("getTimeoffset()");
			var margin = parseInt(this._content.css("margin-" + this._direction));
			var stepOffset = Math.abs(margin)/this._sizeStep;
			var timeOffset = stepOffset * this._slideAnimationTime;
			return timeOffset;
		}
		
		/**
			Is a step or a slide currently in progress?
			@private
			@returns {Boolean}
		 */
		Carousel.prototype._isPlaying = function() { /*debug*///console.log("Carousel#_isPlaying()");
			return (
				(this._step && this._step.isPlaying())
				||
				this._slidePrev.isPlaying() || this._slideNext.isPlaying()
			);
		}
		
		/**
			Get the 0-based offset of the first currently visible carousel item.
			@private
			@returns {Number}
		 */
		Carousel.prototype._visibleIndexFirst = function() { /*debug*///console.log("_visibleIndexFirst()");
			// get the amount the carousel has slided as a positive number
			var slideOffset = parseInt( this._content.css("margin-" + this._direction) ) * -1;
			var offset = Math.floor(slideOffset / this._sizeEach);
			return this.items[offset]["_index"+glow.UID];
		}
		
		/**
			@name glow.widgets.Carousel#visibleIndexes
			@function
			@description Returns an array of numeric indexes of the currently visable items in the carousel.
			@returns {Array}
				Array of indexes of the currently visible items.
			@example
				var myCarousel = new glow.widgets.Carousel("ul#carouselContainer"{
					size: 3
				});
				myCarousel.moveTo(4);
				alert(myCarousel.visibleIndexes()); // returns [4, 5, 6]
		*/
		Carousel.prototype.visibleIndexes = function() {
			var leftmost = this._visibleIndexFirst();
			var visibleIndexes = [];

			for (var i = 0, l = this._opts.size; (i < l) /*&& (leftmost+i < this._countRealItems)*/; i++) {
				visibleIndexes.push((leftmost+i) % this._countReal);
			}

			return visibleIndexes;
		}
		
		/**
			@name glow.widgets.Carousel#visibleItems
			@function
			@description Returns a NodeList of all items currently visible in the carousel.
			@returns {glow.dom.NodeList}
			@example
				var myCarousel = new glow.widgets.Carousel("ul#carouselContainer"{
					size: 3
				});
				myCarousel.moveTo(4);
				alert(myCarousel.visibleItems()); // returns nodeList with 3 items starting from the carousel's 4th item
		 */
		Carousel.prototype.visibleItems = function() {
			var indexes = this.visibleIndexes();
			var visibleItems = new glow.dom.NodeList();
			for (var i = 0; i < indexes.length; i++) { 
				visibleItems.push(this.items[indexes[i]]);
			}
			return visibleItems;
		}
		
		/**
			@name glow.widgets.Carousel#addItems
			@function
			@description Used to add one or more new items to the carousel.
			@param {glow.dom.NodeList | Element | Selector} itemsToAdd A NodeList of items to add to the carousel.
			@param {Number} [position] Index at which to insert the items.  By default, items will be added to the end of the carousel.
			@example
				var myCarousel = new glow.widgets.Carousel("ul#carouselContainer"); // This &lt;ul&gt; has 3 &lt;li&gt; children
				alert(myCarousel.items); // returns 3 items
				myCarousel.addItems("ul#anotherList li"); // ul#anotherList has 2 &lt;li&gt; children
				alert(myCarousel.items); // returns 5 items
		*/
		Carousel.prototype.addItems = function(itemsToAdd, position) { /*debug*///console.log("Carousel#addItem("+itemsToAdd+", "+position+")");
			itemsToAdd = $(itemsToAdd);
			
			// fire event and cancel if prevented
			var eventProps = {
				items: itemsToAdd
			}
			if ( events.fire(this, "addItem", eventProps).defaultPrevented() ) {
				return itemsToAdd;
			}
			
			this._content.get(".carousel-added").remove(); // trim away added pads and clones
			if (typeof position != "undefined" && position < this._countReal) {
				itemsToAdd.insertBefore(this._content.children().item(position));
			}
			else {
				this._content.append(itemsToAdd);
			}
			rebuild.apply(this);
			
			return itemsToAdd;
		}
		
		/**
			@name glow.widgets.Carousel#removeItem
			@function
			@description Remove an item from the carousel.
			@param {Number} indexToRemove A numeric index of the item to remove.
			@returns {glow.dom.NodeList}
			@example
				var myCarousel = new glow.widgets.Carousel("ul#carouselContainer");
				alert(myCarousel.items); //returns array with a length of 5
				myCarousel.removeItem(4);
				alert(myCarousel.items); //returns array with a length of 4
		*/
		Carousel.prototype.removeItem = function(indexToRemove) { /*debug*///console.log("Carousel#removeItem("+indexToRemove+")");
				// check if it's the last item in the carousel and prevent removal if so
				if (this.items.length > 1) {
				    var removingItem = this.items.slice(indexToRemove, indexToRemove + 1),
					e = {
						item: removingItem,
						itemIndex: indexToRemove
					};
					    
				    if ( events.fire(this, "removeItem", e).defaultPrevented() ) {
					return removingItem;
				    }
	
				    this._content.get(".carousel-added").remove(); // trim away added pads and clones
				    removingItem.remove();			    
				    
				    rebuild.apply(this);
				}
				
			return removingItem;
		}
		
		/**
			@name glow.widgets.Carousel#moveBy
			@function
			@description Scrolls the carousel backwards or forwards through the items.
				Note: You cannot send a carousel out of sync with its step. It will
				scroll to a position where the item you've asked to move to is
				visible.
			@param {Number} distance The number of items to move by.  Positive numbers move forward, negative move backwards.
			@param {Boolean} animate Set to false to disable animation.
			@example
				var myCarousel = new glow.widgets.Carousel("ul#carouselContainer");
				myCarousel.moveNext();     // Move forward to the 2nd item.
				myCarousel.moveBy(3,true); // Move forward 3 from the current item to the 5th item
		 */
		Carousel.prototype.moveBy = function(distance, animate) { /*debug*///console.log("moveBy("+distance+", "+animate+")");
			var currentItem = this._visibleIndexFirst();
			var targetItem = currentItem + distance;
			if (this._opts.loop) { // the rolling jake...
				if (targetItem < 0) {
					this._content.css("margin-"+this._direction, (this._countReal * -this._sizeEach) + "px");
					targetItem = this._countReal + targetItem;
				}
				if (currentItem >= this._countReal && targetItem > this._countReal) {
					this._content.css("margin-"+this._direction, "0px");
					targetItem = targetItem % this._countReal;
				}
			}
			return this.moveTo(targetItem, animate);
		}
		
		/**
			@name glow.widgets.Carousel#moveTo
			@function
			@description Scroll to a specified position in the carousel.
				Note: You cannot send a carousel out of sync with its step. It will
				scroll to a position where the item you've asked to move to is
				visible.
			@param {Number} targetItem The index of the item to appear in the leftmost visible position of the carousel.
			@param {Boolean} animate Set to false to disable animation.
			@example
				var myCarousel = new glow.widgets.Carousel("ul#carouselContainer");
				myCarousel.moveTo(3,true); // Move to the 3rd item.
		*/
		Carousel.prototype.moveTo = function(targetItem, animate) { /*debug*///console.log("moveTo("+targetItem+", "+animate+")");
			var that = this;
			if (this._isPlaying()) return this;
			
			if (!this._opts.loop) targetItem = Math.min(targetItem, this._countReal-1);
			targetItem = Math.max(targetItem, 0);
			targetItem -= (targetItem % this._countStep); // stay in step
			if (!this._opts.loop) { // keep right items close to right-edge in the case of non-looping carousels
				targetItem = Math.min(targetItem, this._movesMax * this._countStep);
			}
			
			var currentItem = this._visibleIndexFirst();
		
			if (currentItem == targetItem) return this;
			
			beforeScroll.apply(this, []);
			if (animate !== false) {
				var move = {};
				move["margin-" + this._direction] = { from: (currentItem * -this._sizeEach) + "px", to: (targetItem * -this._sizeEach) + "px" };
				this._step = glow.anim.css(this._content, this._animationTime, move, { "tween": this._animationTween });
				var that = this;
				glow.events.addListener(this._step, "complete", function() {
					afterScroll.apply(that, []);
				});
				this._step.start();
			}
			else {
				this._content.css("margin-"+this._direction, (targetItem * -this._sizeEach) + "px");
				afterScroll.apply(this, []);
			}
			return this;
		}
		
		glow.widgets.Carousel = Carousel;
		
		/**
			@private
			@constructor
			@description Display the currently visible step.
		 */
		function PageNav(pagecount, onClick) {
			var localeModule = $i18n.getLocaleModule("GLOW_WIDGETS_CAROUSEL");
			
			this.leftarrow = dom.create("<li class='arrow' id='leftarrow'><a href='#' class='dotLabel'>{PREVIOUS}</a></li>", {interpolate: localeModule});
			this.rightarrow = dom.create("<li class='arrow' id='rightarrow'><a href='#' class='dotLabel'>{NEXT}</a></li>", {interpolate: localeModule});

			var pageNavHtml = "";
	
			for (var i = 0; i < pagecount; i++) {
//				pageNavHtml += "<li class='dot dot" + i + "' id='dot"+i+"'><div class='dotLabel'>"+(i+1)+"</div></li>";
				pageNavHtml += "<li class='dot dot" + i + "'><div class='dotLabel'>"+(i+1)+"</div></li>";
			}
			
			this.element = dom.create("<ul class='pageNav'>"+pageNavHtml+"</ul>");		
			this.leftarrow.insertBefore(this.element.get("li")[0]);
			this.rightarrow.insertAfter(this.element.get("li")[this.element.get("li").length-1]);
			
			var that = this;
			glow.events.addListener(this.element, "click",
				function(e) {
					if ($(e.source).parent().hasClass('dot')) { // clicked a dot?
//						var newPage = $(e.source).parent()[0].id.replace(/[^0-9]*/, "");
//						onClick.apply(that, [newPage]);
						onClick.apply(that, [parseInt($(e.source).html())-1]);
					}
				}
			);
			
			this.currentPage = 0;
		}
		
		PageNav.prototype.update = function(newPage) { /*debug*///console.log("PageNav.prototype.update("+newPage+")");
			if (typeof newPage == "undefined") newPage = this.currentPage;
			this.element.get("li.dot"+this.currentPage+"").removeClass("dotActive");
			this.element.get("li.dot"+newPage+"").addClass("dotActive");
			this.currentPage = newPage;
		}
	}
});