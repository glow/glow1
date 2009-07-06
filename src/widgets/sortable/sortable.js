(window.gloader || glow).module({
	name: "glow.widgets.Sortable",
	library: ["glow", "@VERSION@"],
	depends: [[
		"glow", "@VERSION@",
		'glow.dom',
		'glow.events',
		'glow.dragdrop',
		'glow.widgets'
	]],
	builder: function(glow) {

		var $ = glow.dom.get,
			events = glow.events,
			fire = events.fire,
			addListener = events.addListener;
		/**
		@private
		@name glow.widgets.Sortable#offsetTop
		@function
		@description Get the offsetTop of an element in a way that works in IE.
		@param {glow.dom.NodeList} element The element to get the offsetTop of.
		@returns {Number} An integer pixel offset.
		*/
		// TODO - this is a copy of the one in dragdrop, which should be moved to dom, removing the need for this
		function offsetTop (element) {
			var offsetParent = element[0].offsetParent,
				marginDeduct = parseInt(element.css("margin-top")) || 0;
			
			if (glow.env.ie) {
				while (offsetParent.currentStyle.position == "static") {
					offsetParent = offsetParent.offsetParent;
				}
			}
			return element.offset().top - $(offsetParent).offset().top - marginDeduct;
		}
		/**
		@name glow.widgets.Sortable
		@constructor
		@description Reorder page elements using drag and drop
		@see <a href="../furtherinfo/widgets/sortable/">Sortable user guide</a>

		@param {glow.dom.NodeList | String | HTMLElement[]} containers The container or containers of the items to be made sortable.
		@param {Object} [opts] A set of named options (see below).
		@param {glow.dom.NodeList | String} [opts.constrainDragTo] Limit the dragging to within a specific element
		@param {String} [opts.axis] Restrict dragging to a particular axis
		@param {String} [opts.dropIndicatorClass=glow-sortable-dropindicator] The name of the class to apply to the element that indicates where an item will be dropped.
		@param {Boolean} [opts.equaliseColumns=true] Make the bottom of each container the same.
		@param {Object} [opts.draggableOptions] An options object to apply to each draggable.
			See {@link glow.dragdrop.Draggable Draggable} for options
		@param {Function} [opts.onSort] Create an event listener that is fired when the sortable is sorted - i.e. after one of the draggables has been dragged.
		
		*/

		/**
		@name glow.widgets.Sortable#event:sort
		@event
		@description Fired when an item in the sortable has been dragged.
		@param {glow.events.Event} event Event Object
		*/

		/**
		@name glow.widgets.Sortable#containers
		@type glow.dom.NodeList
		@description The elements that contain the sortable items.
		@example

			var mySortable = new glow.widgets.Sortable('div#sections');
			alert(mySortable.containers); // Returns a nodeList of all the sortable items
		
		*/

		/**
		@name glow.widgets.Sortable#draggables
		@type glow.dragdrop.Draggables[]
		@description Array of draggables that can be sorted. Read-only.
		@example

			var mySortable = new glow.widgets.Sortable('div#sections');
			alert(mySortable.draggables); // Returns glow.dragdrop.Draggables[]

		*/

		/**
		@name glow.widgets.Sortable#dropTargets
		@type glow.dragdrop.DropTargets[]
		@description Array of drop targets that draggable can be dragged to and sorted within. Read-only.
		@example

			var mySortable = new glow.widgets.Sortable('div#sections');
			alert(mySortable.dropTargets); // Returns glow.dragdrop.DropTargets[]
		*/

		var Sortable = function (containers, opts) {
			this._opts = opts = glow.lang.apply({
				dropIndicatorClass : 'glow-sortable-dropindicator',
				equaliseColumns    : true,
				draggableOptions   : {}
			}, opts || {});

			this.constrainDragTo = opts.constrainDragTo;
			this.axis = opts.axis;
			this.draggables = [];

			var containers = this.containers = $(containers),
				dropTargets = this.dropTargets = [];

			if (opts.onSort) {
				addListener(this, "sort", opts.onSort);
			}

		    // drop targets
			containers.each(function (i) {
				dropTargets[i] = new glow.dragdrop.DropTarget(this, {
					tolerance          : 'intersect',
					dropIndicator      : 'spacer',
					dropIndicatorClass : opts.dropIndicatorClass
				});
			});

			// draggables
			this.addItems( containers.children() );
		};
			
			
		/**
		@private
		@name glow.widgets.Sortable#handleDrag
		@function
		@description Called when a drag operation is started. Can return false to prevent dragging
		*/
		function handleDrag() {
			// if items are still in motion, prevent dragging
			if (this._itemsInMotion) {
				return false;
			}
			if (this._opts.equaliseColumns) {
				equaliseColumns.call(this);
			}
			// stuff is in the air now...
			this._itemsInMotion = true;
		}
		
		/**
		@private
		@name glow.widgets.Sortable#equaliseColumns
		@function
		@description Sets the logical bottom of each drop target to the same
		position on the page.

		This allows sortable items to be dragged sideways into a column that
		does not extend as far as the column that the item is being dragged from.

		*/

		function equaliseColumns () {
		    var offsets = [], maxBottom = 0, bottom, dropTargets = this.dropTargets;
			this.containers.each(function (i) {
				var el = $(this);
				offsets[i] = offsetTop(el);
				bottom = offsets[i] + el[0].offsetHeight;
				if (glow.env.khtml) bottom -= el.css('margin-top') + el.css('margin-bottom');
				if (bottom > maxBottom) maxBottom = bottom;
			});
			for (var i = 0, l = this.dropTargets.length; i < l; i++)
				this.dropTargets[i].setLogicalBottom(maxBottom);
		}

		/**
		@private
		@name glow.widgets.Sortable#handleDrop
		@function
		@description Event handler that handles a draggable being dropped.
		*/

		function handleDrop (e) {
			var draggable = e.attachedTo,
				el = draggable.element,
				target = draggable.activeTarget;
				
		    this._previous = el.prev();
			this._parent = el.parent();
			if (target)	target.moveToPosition(draggable);
	    }

		/**
		@private
		@name glow.widgets.Sortable#handleAfterDrop
		@function
		@description Event handler that is called after a droppable is dropped.

		Fires the sort event.

		*/

		function handleAfterDrop (e) {
			var draggable = e.attachedTo,
				el = draggable.element;
			if (! el.prev().eq(this._previous || []) || ! el.parent().eq(this._parent)) {
				fire(this, "sort");
			}
			// we're done moving
			this._itemsInMotion = false;
			delete this._previous;
			delete this._parent;
	    }

		/*
		Group: Functions
		*/

		Sortable.prototype = {
			/**
			@name glow.widgets.Sortable#addItems
			@function
			@description Add items to the sortable.

			Should not contain items that are were a child of one of the containers when the sortable was created.

			@param {glow.dom.NodeList | String | Element[]} elements The elements to be added to the sortable.
			*/


			addItems : function (elements) {
				var this_ = this, opts = this._opts.draggableOptions;
				$(elements).each(function () {
					var draggable = new glow.dragdrop.Draggable(this,
						glow.lang.apply({
							placeholder       : 'none',
							axis              : this_.axis,
							container         : this_.constrainDragTo,
							dropTargets       : this_.dropTargets
						}, opts)
					);

					
					addListener(draggable, 'drag', handleDrag, this_);
					addListener(draggable, 'drop', handleDrop, this_);
					addListener(draggable, 'afterDrop', handleAfterDrop, this_);

					this_.draggables.push(draggable);
				});
			}

		};

		glow.widgets.Sortable = Sortable;
	}
});
