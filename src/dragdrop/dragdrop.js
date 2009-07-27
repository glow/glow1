/**
@name glow.dragdrop
@namespace
@description Simplifying drag and drop behaviour
*/
(window.gloader || glow).module({
	name: "glow.dragdrop",
	library: ["glow", "@VERSION@"],
	depends: [["glow", "@VERSION@", "glow.tweens", "glow.events", "glow.dom", "glow.anim"]],
	builder: function(glow) {
		var events		   = glow.events,
			addListener	   = events.addListener,
			fire		   = events.fire,
			removeListener = events.removeListener,
			dom			   = glow.dom,
			$			   = dom.get,
			create		   = dom.create;

		//public
		var r = {},
			_zIndex = 1000,
			_ieStrict = (document.compatMode == "CSS1Compat" && glow.env.ie >= 5) ? true : false,
			_ieTrans= (document.compatMode != "CSS1Compat" && glow.env.ie >= 5) ? true : false,
			_ie = glow.env.ie >= 5,
			sides = ['top', 'right', 'bottom', 'left'];

		/*
		PrivateFunction: memoize(clss, name)

		Replace a method with a version that caches the result after the first run.

		Arguments:

			*clss* (function)

			The class whose method is being memoized.

			*name*

			The name of the method to memoize.
		*/

		function memoize (clss, name) {
			var orig = clss.prototype[name];
			var cachedName = 'cached_' + name;
			clss.prototype[name] = function () {
				if (cachedName in this) return this[cachedName];
				return this[cachedName] = orig.apply(this, arguments);
			};
		}
		
		/*
		 Copy margins from one element to another
		*/
		function copyMargins(to, from) {
			var i = sides.length, margin;
			
			while (i--) {
				margin = 'margin-' + sides[i];
				to.css(margin, from.css(margin));
			}
		}

		/*
		PrivateFunction: memoizeNamed(clss, methodName)

		Replace a method that takes a name with a version that caches the result for each name after the first run.

		Arguments:

			*clss* (function)

			The class whose method is being memoized.

			*methodName*

			The name of the method to memoize.
		*/

		function memoizeNamed (clss, methodName) {
			var orig = clss.prototype[methodName];
			var cachedName = 'cached_' + methodName;
			clss.prototype[methodName] = function (name) {
				if (! this[cachedName]) this[cachedName] = {};
				if (name in this[cachedName]) return this[cachedName][name];
				return this[cachedName][name] = orig.apply(this, arguments);
			};
		}

		/*
		PrivateFunction: reset(obj, names)

		Remove cached values for a set of memoized methods.

		Arguments:

			*obj* (object)

			The object containing cached values.

			*names* (array of strings)

			The names of methods whose values have been cached.
		*/

		function reset (obj, names) {
			for (var i = 0, l = names.length; i < l; i++) {
				delete obj['cached_' + names[i]];
			}
		}

		/*
		PrivateFunction: resetNamed(obj, meth, names)

		Remove cached values for a set of named properties for a method.

		Arguments:

			*obj* (object)

			The object containing cached values.

			*meth* (string)

			The name of the method whose values have been cached.

			*names* (array of strings)

			The names of the cached properties.

		function resetNamed (obj, meth, names) {
			var cache = obj['cached_' + meth];
			if (! cache) return;
			for (var i = 0, l = names.length; i < l; i++) {
				delete cache[names[i]];
			}
		}
		*/

		/*
		PrivateClass: Box

		Calculates and caches information about an element in the box model.

		Constructor:

			 (code)
			 new Box(el)
			 (end)

		Arguments:

			*el* (glow.dom.NodeList)

			The element that calculations will be performed on.
		*/

		var Box = function (el) {
			this.el = el;
		};

		Box.prototype = {

			/*
			PrivateMethod: val

			Get an pixel value for a CSS style.

			Arguments:

				*style* (string)

				The name of a CSS style (e.g. "margin-top".

			Returns:
				An integer number of pixels.
			*/

			val: function (style) {
				var val = parseInt(this.el.css(style));
				// TODO - fix dom so margin-left return value is always defined?
//				if (isNaN(val)) throw 'got NaN in val for ' + style + ': ' + this.el.css(style);
				return val || 0;
//				return val;
			},

			/*
			PrivateMethod: width

			Get the width of the element.

			Returns:
				An integer number of pixels.
			*/

			width: function () {
				return this.borderWidth()
					 - this.val('border-left-width')
					 - this.val('border-right-width');
			},

			/*
			PrivateMethod: height

			Get the height of the element.

			Returns:
				An integer number of pixels.
			*/

			height: function () {
				return this.borderHeight()
					 - this.val('border-top-width')
					 - this.val('border-bottom-width');
			},

			/*
			PrivateMethod: offsetParentPageTop

			Get the number of pixels from the top of nearest element with absolute, relative or fixed position to the
			top of the page.

			Returns:
				An integer number of pixels.
			*/
			offsetParentPageTop: function () {
				var el = this.el[0], pos, top;
				while (el = el.offsetParent) {
					if ( $(el).css('position') != 'static' ) {
						break;
					}
				}
				return el ?
					$(el).offset().top :
					0;
			},

			/*
			PrivateMethod: offsetTop

			This gets what CSS 'top' would be if the element were position "absolute"

			Returns:
				An integer number of pixels.
			*/
			offsetTop: function () {
				return this.el.position().top;
			},

			/*
			PrivateMethod: offsetLeft

			This gets what CSS 'left' would be if the element were position "absolute"

			Returns:
				An integer number of pixels.
			*/
			offsetLeft: function () {
				return this.el.position().left;
			},

			/*
			PrivateMethod: borderWidth

			Get the width of the element from the left edge of the left border to the right
			edge of the right border.

			Returns:
				An integer number of pixels.
			*/

			borderWidth: function () {
				var width = this.el[0].offsetWidth;
				if (glow.env.khtml) {
					width -= this.val('margin-left')
							+ this.val('margin-right')
							+ this.val('border-left-width')
							+ this.val('border-right-width');
				}
				return width;
			},

			/*
			PrivateMethod: borderHeight

			Get the height of an element from the top edge of the top border to the bottom
			edge of the bottom border.

			Returns:
				An integer number of pixels.
			*/

			borderHeight: function () {
				if (this._logicalBottom) {
					return this._logicalBottom - this.offsetTop();
				}
				var height = this.el[0].offsetHeight;
				if (glow.env.khtml) {
					height -= this.val('margin-top')
							+ this.val('margin-bottom')
							+ this.val('border-top-width')
							+ this.val('border-bottom-width');
				}
				return height;
			},


			/*
			PrivateMethod: outerWidth

			Get the width of the element in including margin, borders and padding.

			Returns:
				An integer number of pixels.
			*/

			outerWidth: function () {
				return this.borderWidth() + this.val('margin-left') + this.val('margin-right');
			},

			/*
			PrivateMethod: outerHeight

			Get the height of the element in including margin, borders and padding. This
			does not take account of collapsable margins (i.e. it assumes the margins are
			present).

			Returns:
				An integer number of pixels.
			*/

			outerHeight: function () {
				return this.borderHeight() + this.val('margin-top') + this.val('margin-bottom');
			},

			/*
			PrivateMethod: innerLeftPos

			Get the offset of the left edge of the content of the box (i.e. excluding
			margin, border and padding).

			Returns:
				An integer number of pixels.
			*/

			innerLeftPos: function () {
				return this.offsetLeft()
					 + this.val('margin-left')
					 + this.val('border-left-width')
					 + this.val('padding-left');
			},

			/*
			PrivateMethod: innerTopPos

			Get the offset of the top edge of the content of the box (i.e. excluding
			margin, border and padding).

			Returns:
				An integer number of pixels.
			*/

			innerTopPos: function () {
				return this.offsetTop()
					 + this.val('margin-top')
					 + this.val('border-top-width')
					 + this.val('padding-top');
			},

			/*
			PrivateMethod: surroundWidth

			Get the combined width of the horizontal margins, borders and paddings.

			Returns:
				An integer number of pixels.
			*/

			surroundWidth: function () {
				return this.val('border-left-width')
					 + this.val('padding-left')
					 + this.val('padding-right')
					 + this.val('border-right-width');
			},

			/*
			PrivateMethod: surroundHeight

			Get the combined height of the horizontal margins, borders and paddings.

			Returns:
				An integer number of pixels.
			*/

			surroundHeight: function () {
				return this.val('border-top-width')
					 + this.val('padding-top')
					 + this.val('padding-bottom')
					 + this.val('border-bottom-width');
			},

			/*
			PrivateMethod: verticalCenter

			Get the vertical offset of the center of the element from it's offset parent.

			Returns:
				An integer number of pixels.
			*/

			verticalCenter: function () {
				return this.offsetTop() + (this.outerHeight() / 2);
			},

			/*
			PrivateMethod: verticalCenter

			Get the vertical offset of the center of the element from it's offset parent.

			Returns:
				An integer number of pixels.
			*/

			horizontalCenter: function () {
				return this.offsetTop() + (this.outerWidth() / 2);
			}

   		};

		for (var i in Box.prototype) {
			if (i == 'val') memoizeNamed(Box, i);
			else memoize(Box, i);
		}

		glow.lang.apply(Box.prototype, {

			/*
			PrivateMethod: resetPosition

			Reset cached position values for the element.
			*/

			resetPosition: function () {
				reset(this, [
					'offsetTop',
					'offsetLeft',
					'borderTopPos',
					'borderLeftPos',
					'innerTopPos',
					'innerLeftPos',
					'verticalCenter',
					'horizontalCenter'
				]);
			},

			/*
			PrivateMethod: setLogicalBottom

			Set the logical value for the position of the bottom of the border (offsetTop + offsetHeight).

			Arguments:

				*bottom* (integer)

				The value to use for the bottom of the box.
			*/
			setLogicalBottom: function (bottom) {
				this._logicalBottom = bottom;
			},

			/*
			PrivateMethod: boundsFor

			Get the the bounds for the left and top css properties of a child box to
			ensure that it stays within this element.

			Arguments:

				*childBox* (Box)

				A Box object representing the space taken up by the child element.

			Returns:
				An array of top, right, bottom and left pixel bounds for the top and left
				css properties of the child element.
			*/

			boundsFor: function (childBox) {
				var top, left, pos = this.el.css('position');
				if (pos != 'static') {
				    top = left = 0;
				}
				else {
					top = this.innerTopPos();
					left = this.innerLeftPos();
				}
				return [
					top,										   // top
					left + this.width() - childBox.outerWidth(),   // right
					top  + this.height() - childBox.outerHeight(), // bottom
					left										   // left
				];
			},

			/*
			PrivateMethod: outerBounds

			Get the top, right, bottom and left offsets of the outside edge of the border
			of the box.

			Returns:
				An array of integer pixel offsets for the top, right, bottom, left edges of the
				boxes border.
			*/

			outerBounds: function () {
				var position = this.el.position(),
					left = position.left,
					top = position.top;
				return [
					top,
					left + this.borderWidth(),
					top + this.borderHeight(),
					left
				];
			},

			/*
			PrivateMethod: intersectSize

			Get the intersection of this box with another box.

			Arguments:

				*that* (Box)

				A Box object to test for intersection with this box.

				*touches* (boolean)

				If true, then the boxes don't have to intersect but can merely touch.

			Returns:
				An integer number of square pixels that the the outside of the
				edge of the border of this box intersects with that of the passed
				in box.
			*/

			intersectSize: function (that, touches) {
				var a = this.outerBounds(), b = that.outerBounds();
				if (touches) {
					a[1]++; b[1]++; a[2]++; b[2]++;
				}
				return (
					a[2] < b[0] ? 0 :
					b[2] < a[0] ? 0 :
					a[0] < b[0] ? (a[2] < b[2] ? a[2] - b[0] : b[2] - b[0]) :
					b[2] < a[2] ? b[2] - a[0] : a[2] - a[0]
				) * (
					a[1] < b[3] ? 0 :
					b[1] < a[3] ? 0 :
					a[3] < b[3] ? (a[1] < b[1] ? a[1] - b[3] : b[1] - b[3]) :
					b[1] < a[1] ? b[1] - a[3] : a[1] - a[3]
				);
			},

			/*
			PrivateMethod: sizePlaceholder

			Size and position a placeholder/drop indicator element to match that
			of the element.

			Arguments:

				*placeholder* (glow.dom.NodeList)

				The element that will be sized.

				*pos* (optional string)

				The value for the placeholder's CSS position. Defaults to the position
				of this element.

				*startLeft* (integer)

				The original left position of the element.

				*startTop* (integer)

				The original top position of the element.
			*/

			sizePlaceholder: function (placeholder, pos, startLeft, startTop) {
				var placeholderBox = new Box(placeholder),
					el = this.el,
					position = pos || el.css('position');
				
				placeholder.css('display', 'none');
				
				el.after(placeholder);
				
				console.log(el[0].offsetWidth);
				
				placeholder.css('width', (el[0].offsetWidth - placeholderBox.surroundWidth()) + 'px')
					.css('height', (el[0].offsetHeight - placeholderBox.surroundHeight()) + 'px');
				
				// copy margin values
				copyMargins(placeholder, el);
				
				placeholder.remove();
				
				placeholder.css('display', 'block');
				
				if (position != 'static') {
					placeholder.css('left', startLeft + 'px');
					placeholder.css('top', startTop + 'px');
				}
				placeholder.css('position', position);
			},

			/*
			PrivateMethod: contains

			Check if a box is contained within this box.

			Arguments:

				*box* (Box)

				The box to test.

			Returns:
				Boolean, true if contained.
			*/

			contains: function (box) {
				var bounds = this.boundsFor(box),
					position = box.el.position(),
					top = position.top,
					left = position.left;
				
				return top  >= bounds[0]  // top
					&& left <= bounds[1]  // right
					&& top  <= bounds[2]  // bottom
					&& left >= bounds[3]; // left
			},

			/*
			PrivateMethod: containsPoint

			Arguments:

				*offset* (object)

				The offset to check - an object containing x and y integer pixel values.

			Returns:
				Boolean, true if the point over the visible part of the element (i.e. including the borders).
			*/

			containsPoint: function (offset) {
				var elementOffset = this.el.offset();
				return offset.x >= elementOffset.left
					&& offset.y >= elementOffset.top
					&& offset.x <= elementOffset.left + this.borderWidth()
					&& offset.y <= elementOffset.top  + this.borderHeight();
			},

			/*
			PrivateMethod: positionedAncestorBox

			Get a new Box for nearest ancestor of the element that has position 'absolute', 'fixed' or 'relative'.

			Returns:
				An integer pixel offset.
			*/

			positionedAncestorBox: function () {
				var el = this.el.parent(), pos;
				while (el[0]) {
					pos = el.css('position') || 'static';
					if (pos == 'relative' || pos == 'absolute' || pos == 'fixed')
						return new Box(el);
					el = el.parent();
				}
				return null;
			}
		});

		function placeholderElement (el) {
			var tag = el[0].tagName.toLowerCase() == 'li' ? 'li' : 'div';
			var placeholder = create('<' + tag + '></' + tag + '>');
			if (tag == 'li') placeholder.css('list-style-type', 'none');
			return placeholder;
		}

		/**
		@name glow.dragdrop.Draggable
		@class
		@description An element that can be dragged using the mouse.
		@see <a href="../furtherinfo/dragdrop/draggables.shtml">Draggable examples</a>

		@param {String | Element | glow.dom.NodeList} element The element or CSS selector for an element to be made draggable.

			If a {@link glow.dom.NodeList NodeList} or CSS selector matching
			multiple elements is passed only the first element is made draggable.

		@param {Object} [opts]

			An object of options.

			The opts object allows you to pass in functions to use as event
			listeners. This is purely for convenience, you can also use
			{@link glow.events.addListener} to add them the normal way.

		@param {String} [opts.placeholder=spacer] Defines what to leave in place of the draggable whilst being dragged.

			Possible values for this param are:

			<dl>
			<dt>spacer</dt><dd>an empty div is created where the draggable started.</dd>
			<dt>clone</dt><dd>an exact clone of the original element.</dd>
			<dt>none</dt><dd>no placeholder will be created.</dd>
			</dl>

		@param {String} [opts.placeholderClass=glow-dragdrop-placeholder] A class be applied to the placeholder element.

			This can be used to to add styling for indicating where the element
			has been dragged from, add opacity, etc.

		@param {Selector | Element | glow.dom.NodeList} [opts.handle] Restrict the drag 'handle' to an element within the draggable.

		@param {Selector | Element | glow.dom.NodeList} [opts.container] Constrain dragging to within the bounds of the specified element.

		@param {Array} [opts.dropTargets] An array of {@link glow.dragdrop.DropTarget DropTargets}.

			Specifies which {@link glow.dragdrop.DropTarget DropTargets} this draggable is associated with.

		@param {String} [opts.axis] Restrict dragging to an axis.

			Possible values for this param are:

			<dl>
			<dt>x</dt><dd>Restricts dragging to the x-axis</dd>
			<dt>y</dt><dd>Restricts dragging to the y-axis</dd>
			</dl>

		@param {String[]} [opts.dragPrevention=input, textarea, button, select, option, a] Disables dragging from the specified array of element names

			By default dragging will not work when the user clicks in form
			elements, otherwise these elements would be unusable.
			
		@param {Number|Object} [opts.step=1] The pixel interval the draggable snaps to.
			If a number, the draggable will step by that number of pixels on the x and y axis. You
			can provide an object in the form <code>{x:2, y:4}</code> to set different steps to each
			axis.

		@param {Function} [opts.onDrag] An event listener that fires when the draggable starts being dragged.

		@param {Function} [opts.onEnter] An event listener that fires when the draggable is dragged over a drop target.

		@param {Function} [opts.onLeave] An event listener that fires when the draggable is dragged out of a drop target.

		@param {Function} [opts.onDrop] An event listener that fires when the draggable is dropped.
		
		@param {Function} [opts.onAfterDrop] An event listener that fires after the element has dropped, including any animations

			The default action is to animate the draggable back to it's start
			position. This can be cancelled by returning false from the listener
			or calling {@link glow.events.Event.preventDefault} on the
			{@link glow.events.Event} param.
			
		@example
			// create a draggable element with a corresponding DropTarget,
			// container and two event listeners
			var myDraggable = new glow.dragdrop.Draggable('#draggable', {
				dropTargets : [ myDropTarget ],
				container : '#container',
				onDrag : function () {
					this.element.css('opacity', '0.7');
				},
				onDrop : function () {
					this.element.css('opacity', '1');
				}
			});
	*/
	/**
		@name glow.dragdrop.Draggable#event:drag
		@event
		@description Fired when the draggable starts being dragged.

			Concelling this event results in the user being unable to pick up
			the draggable.
		
		@param {glow.events.Event} event Event Object
	*/
	/**
		@name glow.dragdrop.Draggable#event:enter
		@event
		@description Fired when the draggable is dragged over a drop target.
		@param {glow.events.Event} event Event Object
	*/
	/**
		@name glow.dragdrop.Draggable#event:leave
		@event
		@description Fired when the draggable is dragged out of a drop target.
		@param {glow.events.Event} event Event Object
	*/
	/**
		@name glow.dragdrop.Draggable#event:drop
		@event
		@description Fired when the draggable is dropped.
		@param {glow.events.Event} event Event Object
	*/
	/**
		@name glow.dragdrop.Draggable#event:afterDrop
		@event
		@description Fired after the element has dropped, including any animations
		@param {glow.events.Event} event Event Object
	*/
		r.Draggable = function (el, opts) {

			/**
			@name glow.dragdrop.Draggable#element
			@type glow.dom.NodeList
			@description glow.dom.NodeList containing the draggable element
			*/
			this.element = $(el);
			this._opts = opts = glow.lang.apply({
				dragPrevention   : ['input', 'textarea', 'button', 'select', 'option', 'a'],
				placeholder	     : 'spacer',
				placeholderClass : 'glow-dragdrop-placeholder',
				step			 : {x:1, y:1}
			}, opts || {});
			
			//normalise the step param to an object
			if (typeof opts.step == "number") {
				opts.step = {x: opts.step, y: opts.step};
			} else {
				opts.step.x = opts.step.x || 1;
				opts.step.y = opts.step.y || 1;
			}

			this._preventDrag = [];
			for (var i = 0, l = opts.dragPrevention.length; i < l; i++) {
				this._preventDrag[i] = opts.dragPrevention[i].toLowerCase();
			}

			if (opts.container) { this.container = $(opts.container); }
			this._handle = opts.handle && this.element.get(opts.handle) || this.element;

			if (opts.dropTargets) this.dropTargets = $(opts.dropTargets);

				//used for IE literal edge case bug fix
				//this._mouseUp = true;
				//bug fix to get document.body.scrollTop to return true value (not 0) if using transitional 4.01 doctype
				//get('body')[0].style.overflow = 'auto';
				//this._opts = o, this._targetCoords = [], this.isOverTarget = false;

			var listeners = this._listeners = [],
				i = 0;

			if (opts.onDrag)  listeners[i++] = addListener(this, 'drag',  this._opts.onDrag,  this);
			if (opts.onEnter) listeners[i++] = addListener(this, 'enter', this._opts.onEnter, this);
			if (opts.onLeave) listeners[i++] = addListener(this, 'leave', this._opts.onLeave, this);
			if (opts.onDrop)  listeners[i++] = addListener(this, 'drop',  this._opts.onDrop,  this);

			this._dragListener = addListener(this._handle, 'mousedown', this._startDragMouse, this);

			return;
		};


		/*
		Group: Methods
		*/

		//var applyFloatBugfix = glow.env.ie;

		r.Draggable.prototype = {

			/*
			PrivateMethod: _createPlaceholder

			Create an element that occupies the space where the draggable has been dragged from.
			*/

			_createPlaceholder: function () {
				var el = this.element,
					placeholder,
					box = this._box;

				if (this._opts.placeholder == 'clone') {
					placeholder = el.clone();
				}
				else { // placeholder == 'spacer'
					placeholder = placeholderElement(el);
				}
				if (this._opts.placeholderClass) {
					placeholder.addClass(this._opts.placeholderClass);
				}
				box.sizePlaceholder(placeholder, null, this._startLeft, this._startTop);
				el.after(placeholder);
				this._placeholder = placeholder;
			},

			/*
			PrivateMethod: _removePlaceholder

			Removes the placeholder (see above) from the document.
			*/

			_removePlaceholder: function () {
				this._placeholder.remove();
			},

			/*
			PrivateMethod: _resetPosition

			Sets the position CSS property to what it started as without moving the draggable. If the
			original position was 'static' and making it 'static' again would mean moving the draggable,
			then the position is set to 'relative'.
			*/

			_resetPosition: function () {
				var origPos = this._preDragPosition,
					el = this.element,
					box = this._box,
					startOffset = this._startOffset,
					pos = el.css('position'),
					newLeft,
					newTop;
				
				box.resetPosition();
				
				var position = box.el.position(),
					offset = {
						x: position.left,
						y: position.top
					};

				if (this._placeholder || this._dropIndicator) {
					el.remove();
				}
				if (origPos == 'static' && offset.y == startOffset.y && offset.x == startOffset.x) {
					el.css('position', 'static');
					el.css('left', '');
					el.css('top', '');
				}
				else {
					el.css('z-index', this._preDragZIndex);
					el.css('position', origPos == 'static' ? 'relative' : origPos);
					if (origPos == 'static') {
						newLeft = offset.x - startOffset.x;
						newTop = offset.y - startOffset.y;
					}
					else if (origPos == 'relative' && pos != 'relative') {
						newLeft = this._startLeft + (offset.x - startOffset.x);
						newTop = this._startTop + (offset.y - startOffset.y);
					}
					if (pos != origPos) {
						el.css('left', newLeft ? newLeft + 'px' : '');
						el.css('top', newTop ? newTop + 'px' : '');
					}
				}
				if (this._dropIndicator) {
					var parent = this._dropIndicator.parent()[0];
					if (parent)	parent.replaceChild(el[0], this._dropIndicator[0]);
					delete this._dropIndicator;
					if (this._placeholder) {
						this._placeholder.remove();
						delete this._placeholder;
					}
					// this is canceling out some of the stuff done in the if statement above, could be done better
					el.css('position', origPos);
					if (origPos == 'relative' && pos != 'relative') {
						el.css('left', this._startLeft);
						el.css('top', this._startTop);
					}
				}
				else if (this._placeholder) {
					var parent = this._placeholder.parent()[0];
					if (parent)	parent.replaceChild(el[0], this._placeholder[0]);
					delete this._placeholder;
				}
			},

			/*
			PrivateFunction: _startDragMouse

			Start the draggable dragging when the mousedown event is fired.

			Arguments:

				*e* (glow.events.Event)

				The mousedown event that caused the listener to be fired.
			*/

			_startDragMouse: function (e) {
				var preventDrag = this._preventDrag,
					source = e.source,
					tag = source.tagName.toLowerCase();

				for (var i = 0, l = preventDrag.length; i < l; i++) {
					if (preventDrag[i] == tag) {
						return;
					}
				}
				
				//fire the drag event
				if (fire(this, 'drag').defaultPrevented()) {
					//the default action was prevented, don't do any dragging
					return;
				}

				if (this._dragging == 1)
					return this.endDrag();
				else if (this._dragging)
					return;

				// _dragging set to 1 during drag, 2 while ending drag and back to 0 when ready for new drag
				this._dragging = 1;

				var el = this.element,
					container = this.container,
					opts = this._opts,
					box = this._box = new Box(el),
					step = opts.step;

				this._preDragPosition = el.css('position');
				
				var position = box.el.position(), 
					startOffset = this._startOffset = {
						x: position.left,
						y: position.top
					};
				
				if (container) {
					this._containerBox = new Box(container);
					this._bounds = this._containerBox.boundsFor(box);
					//we may need to decrease the bounds to keep the element in step (if it's using stepped dragging)
					//basically makes the bounding box smaller to fit in with the stepping
					if (step.x != 1) {
						this._bounds[3] -= (this._bounds[3] - startOffset.x) % step.x;
						this._bounds[1] -= (this._bounds[1] - startOffset.x) % step.x;
					}
					if (step.y != 1) {
						this._bounds[0] -= (this._bounds[0] - startOffset.y) % step.y;
						this._bounds[2] -= (this._bounds[2] - startOffset.y) % step.y;
					}
				}
				else {
					delete this._bounds;
				}

				this._mouseStart = {
					x: e.pageX,
					y: e.pageY
				};

				

				this._preDragStyle = el.attr('style');

				this._preDragZIndex = el.css('z-index');

				el.css('z-index', _zIndex++);

				this._startLeft = el[0].style.left ? parseInt(el[0].style.left) : 0;
				this._startTop = el[0].style.top ? parseInt(el[0].style.top) : 0;


				if (opts.placeholder && opts.placeholder != 'none') {
					this._createPlaceholder();
				}

				el.css('position', 'absolute');
				el.css('left', startOffset.x + 'px');
				el.css('top', startOffset.y + 'px');

				if(_ieStrict) {
					this._scrollY = document.documentElement.scrollTop;
					this._innerHeight = document.documentElement.clientHeight;
				}
				else if(_ieTrans){
					this._scrollY = document.body.scrollTop;
					this._innerHeight = document.body.clientHeight;
				}
				else {
					this._scrollY = window.scrollY;
					this._innerHeight = window.innerHeight;
				}

				var cancelFunc = function () { return false },
					doc = document.documentElement;

				if (this.dropTargets) {
					var event = new events.Event();
					event.draggable = this;
					for (var i = 0, l = this.dropTargets.length; i < l; i++) {
						fire(this.dropTargets[i], 'active', event);
					}

					this._mousePos = {
						x: e.pageX,
						y: e.pageY
					};
					this._testForDropTargets();
				}

				this._dragListeners = [
					addListener(doc, 'selectstart', cancelFunc),
					addListener(doc, 'dragstart',   cancelFunc),
					addListener(doc, 'mousedown',   cancelFunc),
					addListener(doc, 'mousemove',   this._dragMouse, this),
					addListener(doc, 'mouseup',	 this._releaseElement, this)
				];
				return false;
			},

			/*
			PrivateFunction: _dragMouse

			Move the draggable when a mousemove event is received.

			Arguments:

				*e* (glow.events.Event)

				The mousedown event that caused the listener to be fired.
			*/

			_dragMouse: function (e) {
				var element = this.element,
					axis = this._opts.axis,
					//do we need to do axis here, or just not apply the newX/Y if axis is used? May be faster
					newX = axis == 'y' ?
						this._startOffset.x:
						(this._startOffset.x + e.pageX - this._mouseStart.x),
					newY = axis == 'x' ?
						this._startOffset.y:
						(this._startOffset.y + e.pageY - this._mouseStart.y),
					bounds = this._bounds,
					step = this._opts.step;
				
				
				//round position to the nearest step
				if (step.x != 1) {
					newX = Math.round((newX - this._startOffset.x) / step.x) * step.x + this._startOffset.x;
				}
				if (step.y != 1) {
					newY = Math.round((newY - this._startOffset.y) / step.y) * step.y + this._startOffset.y;
				}
				
				// only pay for the function call if we have a container or an axis
				if (bounds) {
					// only apply bounds on the axis we're using
					if (axis != 'y') {
						newX = newX < bounds[3] ? bounds[3] : newX > bounds[1] ? bounds[1] : newX;
					}
					if (axis != 'x') {
						newY = newY < bounds[0] ? bounds[0] : newY > bounds[2] ? bounds[2] : newY;
					}
				}
				
				// set the new position
				element[0].style.left = newX + 'px';
				element[0].style.top = newY + 'px';

				//if there are dragTargets check if the draggable is over the target
				if (this.dropTargets) {
					this._mousePos = { x: e.pageX, y: e.pageY };
				}
				// check for IE mouseup outside of page boundary
				if(_ie && e.nativeEvent.button == 0) {
					this._releaseElement(e);
					return false;
				};
				return false;
			},

			/*
			PrivateFunction: _testForDropTarget

			Check if the draggable is over a drop target. Sets the activeTarget property of the draggable
			to the drop target that the draggable is over, if any.

			Arguments:

				*mousePos* (object)

				The position of the mouse pointer relative to the document. The object has x and y integer
				pixel properties.
			*/
			_testForDropTargets: function (fromTimeout) {

				if (! this._lock) this._lock = 0;
				if (fromTimeout) this._lock--;
				else if (this.lock) return;

				if (this._dragging != 1) return;

				var previousTarget = this.activeTarget,
					activeTarget,
					targets = this.dropTargets,
					target,
					targetBox,
					box = this._box,
					mousePos = this._mousePos;

				box.resetPosition();

				var maxIntersectSize = 0;
				for (var i = 0, l = targets.length; i < l; i++) {
					target = targets[i];
					targetBox = target._box;
					if (target._opts.tolerance == 'contained') {
						if (targetBox.contains(box)) {
							activeTarget = target;
							break;
						}
					}
					else if (target._opts.tolerance == 'cursor') {
						if (targetBox.containsPoint(mousePos)) {
							activeTarget = target;
							break;
						}
					}
					else {
						var intersectSize = targetBox.intersectSize(box, true);
						if (intersectSize > maxIntersectSize) {
							maxIntersectSize = intersectSize;
							activeTarget = target;
						}
					}
				}
				this.activeTarget = activeTarget;

				// enter events
				if (activeTarget !== previousTarget) {
					if (activeTarget) {
						// enter on the target
						var draggableEnterEvent = new events.Event();
						draggableEnterEvent.draggable = this;
						fire(activeTarget, 'enter', draggableEnterEvent);

						// enter on this (the draggable)
						var enterTargetEvent = new events.Event();
						enterTargetEvent.dropTarget = activeTarget;
						fire(this, 'enter', enterTargetEvent);
					}

					if (previousTarget) {
						// leave on target
						var draggableLeaveEvent = new events.Event();
						draggableLeaveEvent.draggable = this;
						fire(previousTarget, 'leave', draggableLeaveEvent);

						// leave on this (draggable)
						var leaveTargetEvent = new events.Event();
						leaveTargetEvent.dropTarget = previousTarget;
						fire(this, 'leave', leaveTargetEvent);
					}
				}
				// place the drop indicator in the drop target (not in the drop target class for speed)
				if (activeTarget && activeTarget._opts.dropIndicator != 'none') {
					var childBox,
						childBoxes = activeTarget._childBoxes,
						children = activeTarget._children;
					box.resetPosition();
					var totalHeight = activeTarget._box.innerTopPos();
					var draggablePosition = mousePos.y - box.offsetParentPageTop();
					var placed = 0;
					for (var i = 0, l = childBoxes.length; i < l; i++) {
						if (children[i] == this.element[0]) continue;
						childBox = childBoxes[i];
						totalHeight += childBox.outerHeight();
						if (draggablePosition <= totalHeight) {
							if (activeTarget._dropIndicatorAt != i) {
								$(childBox.el).before(activeTarget._dropIndicator);
								activeTarget._dropIndicatorAt = i;
							}
							placed = 1;
							break;
						}
					}
					if (! placed) {
						if (childBox) {
							$(childBox.el).after(activeTarget._dropIndicator);
							activeTarget._dropIndicatorAt = i + 1;
						}
						else {
							activeTarget.element.append(activeTarget._dropIndicator);
							activeTarget._dropIndicatorAt = 0;
						}
					}
				}

				this._lock++;
				var this_ = this;
				setTimeout(function () { this_._testForDropTargets(1) }, 100);
			},

			/*
			PrivateMethod: releaseElement

			Finish the drag when a mouseup event is recieved.

			Arguments:

				*e* (glow.events.Event)

				The mouseup event that caused the listener to be fired.
			*/

			_releaseElement: function () {
				if (this._dragging != 1) return;
				this._dragging = 2;

				var i, l;

				//call the onInactive function on all the dropTargets for this draggable
				var dropTargets = this.dropTargets,
					activeTarget = this.activeTarget;

				if (dropTargets) {
					for (i = 0, l = dropTargets.length; i < l; i++) {
						var event = new events.Event();
						event.draggable = this;
						event.droppedOnThis = activeTarget && activeTarget == dropTargets[i];
						fire(dropTargets[i], 'inactive', event);
					}
				}

				if (activeTarget) {
					var event = new events.Event();
					event.draggable = this;
					fire(activeTarget, 'drop', event);
				}

				var dragListeners = this._dragListeners;
				for (i = 0, l = dragListeners.length; i < l; i++) {
					events.removeListener(dragListeners[i]);
				}

				var dropEvent = fire(this, "drop");
				if (! dropEvent.defaultPrevented() && this.dropTargets) {
					this.returnHome();
				}
				else {
					this.endDrag();
				}

			},

			/*
			Method: endDrag

			Finishes dragging the draggable. Removes the placeholder (if any) and resets the position CSS property
			of the draggable.

			TODO - revist this code example

			N.B. This is called by default but if you overwrite the onDrop function then you will have to call it youoriginal
			(code)
			// empty NodeList
			var myDraggable = new glow.dragdrop.Draggable('#draggable', {
				onDrop = function(e){
					do some stuff that takes a while.....
					this.endDrag();
					false;
				}
			});
			(end)
			*/

			endDrag: function(){
				if (this._dragging != 2) return;
				this._dragging = 0;

				//remove any helpers/placeholders
				
				if (this._reset) {
					this._reset();
					delete this._reset;
				}
				
				if (this.placeholder) {
					this.placeholder.remove();
				}
				this._resetPosition();
				delete this.activeTarget;
				fire(this, "afterDrop");
			},

			/*
			Event: returnHome

			Animates the Draggable back to it's start position and calls endDrag() at the end of the
			transition. This is called by default when the Draggable, that has a DragTarget, is dropped.
			However if you override the default onDrop function you may want to call this function your
			original

			Arguments
				tween (function)
				The animation you wish to used for easing the Draggable. See <glow.tweens>. This is optional, the default is a linear tween. e.g. glow.tweens.easeboth
			*/

			returnHome: function(tween){
				var mytween = (tween) ? tween : glow.tweens.linear(),
					leftDestination,
					topDestination,
					el = this.element,
					position = this._box.el.position(),
					distance = Math.pow(
						Math.pow(this._startOffset.x - position.left, 2)
						+ Math.pow(this._startOffset.y - position.top, 2),
						0.5
					),
					duration = 0.3 + (distance / 1000);
				
				var channels = [[
					glow.anim.css(el, duration, {
						left: this._startOffset.x,
						top : this._startOffset.y
					}, { tween: mytween })
				]];

				if (this._dropIndicator) {
					channels.push([glow.anim.css(this._dropIndicator, duration - 0.1, { opacity: { to: 0 } })]);
				}

				var timeline = new glow.anim.Timeline(channels);
				addListener(timeline, 'complete', function () {
					this.endDrag();
				}, this);
				timeline.start();
				return;
			}
		};


		var dropTargetId = 0;

		/**
		@name glow.dragdrop.DropTarget
		@class
		@description An element that can react to Draggables.
		@see <a href="../furtherinfo/dragdrop/droptargets.shtml">DropTarget examples</a>

		@param {String | Element | glow.dom.NodeList} element The element or CSS selector for an element to be made droppable.

			If a {@link glow.dom.NodeList NodeList} or CSS selector matching
			multiple elements is passed only the first element is made droppable.

		@param {Object} [opts]

			An object of options.

			The opts object allows you to pass in functions to use as event
			listeners. This is purely for convenience, you can also use
			{@link glow.events.addListener} to add them the normal way.

		@param {String} [opts.tolerance=intersect] The point at which the target becomes active when a draggable moves over it.

			Possible values for this param are:

			<dl>
			<dt>intersect</dt><dd>The target becomes active as soon as any part of the draggable is over the target.</dd>
			<dt>cursor</dt><dd>The target becomes active when the cursor is over the target.</dd>
			<dt>contained</dt><dd>The target only becomes active once the whole draggable is within the target.</dd>
			</dl>

		@param {String} [opts.dropIndicator=none] Whether to create an element when a Draggable is over the DropTarget.

			Possible values for this param are:

			<dl>
			<dt>spacer</dt><dd>an empty div will be added to the drop target to indicate where the Draggable will be dropped.</dd>
			<dt>none</dt><dd>no drop indicator will be created.</dd>
			</dl>

		@param {String} [opts.dropIndicatorClass=glow-dragdrop-dropindicator] The class apply to the dropIndicator element.

			This is useful if you want to style the drop indicator.

		@param {Function} [opts.onEnter] An event listener to fire when an associated Draggable is dragged over the drop target.

		@param {Function} [opts.onLeave] An event listener to fire when an associated Draggable is dragged out of the drop target.

		@param {Function} [opts.onDrop] An event listener to fire when an associated Draggable is dropped on the drop target.

		@param {Function} [opts.onActive] An event listener to fire when an associated Draggable starts being dragged.

		@param {Function} [opts.onInactive] An event listener to fire when an associated Draggable stops being dragged.
		
		@example
			var myDropTarget = new glow.dragdrop.DropTarget('#dropTarget', {
				onActive: function(e){
						this.element.css('border', '2px solid blue');
				},
				onInactive: function(e){
						this.element.css('border', '');
						this.element.css('opacity', '1');
				},
				onEnter: function(e){
						this.element.css('opacity', '0.2');
				},
				onLeave: function(e){
						this.element.css('opacity', '1');
				},
				onDrop: function(e){
						this.element.css('backgroundColor', 'green');
				}
			});
		*/
		/**
		@name glow.dragdrop.DropTarget#event:active
		@event
		@description Fired when a draggable linked to this drop target starts being dragged.
		@param {glow.events.Event} event Event Object
		*/
		/**
		@name glow.dragdrop.DropTarget#event:inactive
		@event
		@description Fired when a draggable linked to this drop target stops dragging.
		@param {glow.events.Event} event Event Object
		*/
		/**
		@name glow.dragdrop.DropTarget#event:enter
		@event
		@description Fired when a draggable linked to this drop target is dragged over the target.
		@param {glow.events.Event} event Event Object
		*/
		/**
		@name glow.dragdrop.DropTarget#event:leave
		@event
		@description Fired when a draggable linked to this drop target is dragged out of the target.
		@param {glow.events.Event} event Event Object
		*/
		/**
		@name glow.dragdrop.DropTarget#event:drop
		@event
		@description Fired when a draggable linked is dropped on this drop target.
		@param {glow.events.Event} event Event Object
		*/
		r.DropTarget = function(el, opts) {
			/**
			@name glow.dragdrop.DropTarget#element
			@type glow.dom.NodeList
			@description glow.dom.NodeList containing the draggable element
			*/
			el = this.element = $(el);
			if (! el.length) throw 'no element passed into DropTarget constuctor';
			if (el.length > 1) throw 'more than one element passed into DropTarget constructor';

			// id is for indexing drop targets in an object for getting to them quickly
			this._id = ++dropTargetId;

			this._opts = opts = glow.lang.apply({
				dropIndicator	   : 'none',
				dropIndicatorClass : 'glow-dragdrop-dropindicator',
				tolerance          : 'intersect'
			}, opts || {});

			if (opts.onActive)   addListener(this, 'active',   opts.onActive);
			if (opts.onInactive) addListener(this, 'inactive', opts.onInactive);
			if (opts.onEnter)	 addListener(this, 'enter',	opts.onEnter);
			if (opts.onLeave)	 addListener(this, 'leave',	opts.onLeave);
			if (opts.onDrop)	 addListener(this, 'drop',	 opts.onDrop);

			addListener(this, 'active', this._onActive);
			addListener(this, 'inactive', this._onInactive);

			return this;
		};


		r.DropTarget.prototype = {

			/*
			Method: setLogicalBottom(height)

			Set a bottom pos to use for detecting if a draggable is over the drop target to use
			other than the actual bottom of the drop target (offsetTop + offsetHeight).

			Arguments:

				*bottom* (integer)

				The number of pixels to use for the bottom of the drop target.
			*/
			setLogicalBottom: function (bottom) {
				this._logicalBottom = bottom;
			},

			/*
			PrivateMethod: _onActive

			Respond to an associated draggable when it starts to be dragged.

			Arguments:

				*e* (glow.events.Event)

				The active event that caused the event listener to be fired.
			*/

			_onActive: function (e) {
				var draggable = e.draggable;

				this._box = new Box(this.element);
				if (this._logicalBottom) this._box.setLogicalBottom(this._logicalBottom);

				if (this._opts.dropIndicator == 'none') return;

				this._onEnterListener = addListener(this, 'enter', this._onEnter);
				this._onLeaveListener = addListener(this, 'leave', this._onLeave);

				this._dropIndicator = placeholderElement(draggable.element);

				if (this._opts.dropIndicatorClass) {
					this._dropIndicator.addClass(this._opts.dropIndicatorClass);
				}
				draggable._box.sizePlaceholder(this._dropIndicator, 'relative', 0, 0);


				var children = this._children = $(this.element.children()).filter(function () {
					var el = $(this);
					return (! e.draggable._placeholder || ! el.eq(e.draggable._placeholder))
						&& (! this._dropIndicator || ! el.eq(this._dropIndicator));
				});
				var childBoxes = this._childBoxes = [];
				children.each(function (i) {
					childBoxes[i] = new Box($(children[i]));
				});
			},

			/*
			PrivateMethod: _onInactive

			Respond to an associated draggable when it finishes being dragged.

			Arguments:

				*e* (glow.events.Event)

				The inactive event that caused the event listener to be fired.
			*/

			_onInactive: function (e) {
				removeListener(this._onEnterListener);
				removeListener(this._onLeaveListener);

				delete this._box;

				if (this._opts.dropIndicator == 'none') return;

				if (! e.droppedOnThis && this._dropIndicator) {
					this._dropIndicator.remove();
					delete this._dropIndicator;
				}
				delete this._childBoxes;
				delete this._children;
			},

			/*
			PrivateMethod: _onEnter

			Respond to an associated draggable being dragged over the drop target.

			Arguments:

				*e* (glow.events.Event)

				The enter event that caused the event listener to be fired.
			*/

			_onEnter: function () {
				this._dropIndicatorAt = -1;
			},

			/*
			PrivateMethod: _onLeave

			Respond to an associated draggable being dragged out of the drop target.

			Arguments:

				*e* (glow.events.Event)

				The leave event that caused the event listener to be fired.
			*/

			_onLeave: function () {
				this._dropIndicator.remove();
			},

			/*
			Method: moveToPosition

			Insert the draggable's element within the drop target where the drop indicator currently is. Sets
			the start offset of the drag to the position of the drop indicator so that it will be animated
			to it's final location, rather than where the drag started.
			*/

			moveToPosition : function (draggable) {
				var dropIndicator = this._dropIndicator,
					box = new Box(dropIndicator);
				//dropIndicator.after(draggable.element);
				var marginLeft = parseInt(dropIndicator.css('margin-left')) || 0,
					marginTop  = parseInt(dropIndicator.css('margin-top')) || 0,
					position = box.el.position();
					
				draggable._startOffset = {
					x: position.left,
					y: position.top
				};
				draggable._dropIndicator = dropIndicator;
				delete this._dropIndicator;
			}

		}
		glow.dragdrop = r;


	}
});
