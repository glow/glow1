
(window.gloader || glow).module({
	name: 'glow.widgets.AutoSuggest',
	library: ['glow', '@VERSION@'],
	depends: [[
		'glow', '@VERSION@',
		'glow.dom',
		'glow.events',
		'glow.anim',
		'glow.widgets',
		'glow.net',
		'glow.widgets.Overlay'
	]],
	
	builder: function(glow) {
/* private fields *************************************************************/
		var $      = glow.dom.get, // shortcuts
			events = glow.events,
			anim   = glow.anim;
			
/* private functions **********************************************************/
		/**
			@private
			@description Attach a text input element to this AutoSuggest instance.
		 */
		 function bindTo(that, inputElement) {
			that.inputElement = $(inputElement);
			if (!that.inputElement[0].tagName.toLowerCase() == 'input') {
				throw 'Argument "inputElement" must be set to an input HTMLElement.';
			}
			
			that.inputElement.attr('autocomplete', 'off'); // stop arrow keys from doing browsery things
		}
		
		/**
			@private
			@description Uses AJAX to refresh the data from a server URL.
		 */
		function downloadData(that, url, callback) { /*debug*///console.log("downloadData("+url+", "+callback+")");
			if (that._lastDownload == url) { // no need to reload same url again
				if (callback) callback.apply(that, arguments);
				else that.find();
			}
			else {
				that._lastDownload = url;
				
				if (that._pendingRequest) that._pendingRequest.abort();
				that._pendingRequest = glow.net.get(
					url,
					{
						onLoad: function(r) {
							var dataObject = (that.opts.parseData)? that.opts.parseData.apply(that, [r]) : eval(r.text());
							
							that._pendingRequest = null;
							that.setData(dataObject);
							
							// create and populate Event instance
							var e = new events.Event();
							e.data = dataObject;
							e.text = r.text();
							events.fire(that, 'dataLoad', e);
					
							if (callback) callback.apply(that, arguments);
							else that.find();
						},
						onError: function(r) {
							var e = new events.Event();
							e.response = r;
							events.fire(that, 'dataError', e);
						},
						onAbort: function(r) {
							var e = new events.Event();
							e.response = r;
							events.fire(that, 'dataAbort', e);
						}
					}
				);
			}
		}
		
		/**
			@private
			@description Check whether the overlay is currently visible.
			@type {Boolean}
		 */
		function isVisible(that) {
			return ($(that.overlay.container).css('display') == 'block');
		}
		
		/**
			@private
			@description Position the overlay under the input element.
		 */
		function place(that) {
			var inputOffset = that.inputElement.offset();

			that.overlay.container
			.css('left', parseInt(inputOffset.left) + 'px')
			.css('top', parseInt(inputOffset.top + that.inputElement[0].offsetHeight-1) + 'px')
			.css('width', ((that.opts.width)? that.opts.width : that.inputElement[0].offsetWidth + 'px'));
		}
		
		/**
			@private
		 */
		function buildIndexer(that) { // create a custom one from an opt value
			if (that.opts.index) {
				if (typeof that.opts.index == 'function') {
					that._indexer = that.opts.index; // it's up to the user
				}
				else if (typeof that.opts.index == 'string') { // it's a field name
					that._indexer = (function(index) {
						return function(dataItem) {
							return dataItem[index]
						}
					})(that.opts.index);
				}
				else if (typeof that.opts.index.push != 'undefined') { // it's an array of field names
					that._indexer = (function(index) {
						var l = index.length-1; // assumes the index length never changes
						return function(dataItem) {
							var result = [];
							for (var i = l; i >= 0; i--) {
								result[i] = dataItem[index[i]];
							}
							return result;
						}
					})(that.opts.index);
				}
				else throw 'opts.index must be of type function, string or array, not ' + typeof that.opts.index + '.';
			}
			else { // default
				that._indexer = function (dataItem) { // the default indexer
					return (dataItem['name'])? dataItem['name'] : dataItem.toString(); // TODO: what if there is no 'name' field?
				}
			}
		}
		
		/**
			@private
			@description Make the next item in the results active.
		 */
		function nextItem(that) {
			var currItem = $(that.overlay.container).get('.active');
			
			if (currItem.length == 0) {
				var items = $(that.overlay.container).get('li'); // TODO
				if (items.length) activateItem(that, items[0]);
			}
			else {
				var nextItem = currItem.next();
			
				if (nextItem && !nextItem.is('ul')) {
					deactivateItem(that, currItem);
					activateItem(that, nextItem);
				}
			}
		}
		
		/**
			@private
			@description Make the previous item in the results active.
		 */
		function prevItem(that) {
			var currItem = $(that.overlay.container).get('.active');
			if (currItem.length == 0) { // no item is active so return the last item
				var allItems = $(that.overlay.container).get('li');
				var lastItem = allItems[allItems.length-1];
				activateItem(that, lastItem);
			}
			else {
				var prevItem = currItem.prev();
				
				if (prevItem && !prevItem.is('ul')) {
					deactivateItem(that, currItem);
					activateItem(that, prevItem);
				}
			}
		}
		
		/**
			@private
			@description Given an HTML element, return this AutoSuggest list.
		 */
		function getParentListItem(that, node) { /*debug*///console.log("getParentListItem("+node+")");
			var listItem = node;
			while (listItem.parentNode && listItem.parentNode.parentNode) {
				if ($(listItem.parentNode.parentNode).hasClass('glowCSSVERSION-autoSuggest')) break;
				listItem = listItem.parentNode;
			}
			return (listItem.nodeName.toLowerCase() == 'li')? listItem : null;
		}
		
		/**
			@private
			@description Make the given list item from the results active.
		 */
		function activateItem(that, listItem) {
			deactivateItems(that, listItem);
			$(listItem).addClass('active');
			
			if (that._lastActive != listItem) {
				that._lastActive = listItem;	
				events.fire(that, 'itemActive');
			}
		}
		
		/**
			@private
			@description Make the item from the results at the given offeset active.
		 */
		function activateItemOffset(that, offset) {
			var li = that.overlay.container.get('li')[offset]; // TODO
			if (li) $(li).addClass('active');
		}
		
		/**
			@private
			@description Make the given list item not active.
		 */
		function deactivateItem(that, listItem) {
			$(listItem).removeClass('active');
		}
		
		/**
			@private
			@description Make all list items not active.
		 */
		function deactivateItems(that, listItem) {
			var list = (listItem) ? $(listItem).parent() : that.overlay.container.get('ul');
			list.get("li").each(
				function(i) {
					$(this).removeClass('active');
				}
			);
		}
		
		/**
			@private
			@description Used internally to add all necessary events.
		 */
		function addEvents(that) { /*debug*///console.log('addEvents()');
			
			events.addListener( // a result item has become active
				that,
				'itemActive',
				function(e) { // fire any onItemActive handlers in the opts
					if (!isVisible(that)) return false;						
					var selectedOffset = that.getSelectedOffset();
					if (selectedOffset == -1) return false;
					
					if (that.opts.onItemActive) {
						var e = new events.Event();
						e.activeItem = that._found[selectedOffset];
						that.opts.onItemActive.apply(that, [e]);
					}
					
					return true;
				}
			);
			
			events.addListener( // the mouse was clicked inside the input element
				that.inputElement,
				'mousedown',
				function(e) { // bail, but keep any hilighted suggestion
					clearTimeout(that.findTimeout);
					
					// user accepts the hilited text
					that._value = that.inputElement.val();
					valueChanged(that, true);
					
					that.hide();
					
					that.value += that._selected;
					that._selected = '';
					
					return true;
				}
			);
			
			events.addListener( // a result item was selected
				that,
				'itemSelect',
				function(e) { // fire any onItemSelect handlers in the opts
					if (!isVisible(that)) return false;
						
					var selectedOffset = that.getSelectedOffset();
					if (selectedOffset == -1) return false;
					
					var e = new events.Event();
					e.source = $(that.overlay.container).get('.active');
					e.selectedItem = that._found[selectedOffset];
					if (that.opts.onItemSelect) {
						that.opts.onItemSelect.apply(that, [e]);
						
					}
					setCaretTo(that.inputElement[0], that.inputElement.val().length);

					valueChanged(that, /*without finding?*/true);
					
					that.hide();
					return true;
				}
			);
			
			events.addListener( // the list of results was clicked (and thus a result item was selected)
				that.overlay.container.get('ul')[0],
				'mousedown',
				function(e) {
					events.fire(that, 'itemSelect', e);
				}
			);


			events.addListener( // the window was resized while the results were showing?
				window,
				'resize',
				function(e){
					place(that);
				}
			);
			
			// some code wot jake done wrote:
			// prevent moz from hiding the input box when a link in the results is clicked
			events.addListener(that.overlay.container, 'mousedown', function() {
				return false;
			});
			// same for IE...
			events.addListener(that.overlay.container, 'beforedeactivate', function(event) {
				if ($(event.nativeEvent.toElement).isWithin(that.overlay.container)) {
					return false;
				}
				return true;
			});
			
			events.addListener( // the focus has moved away from the input element
				that.inputElement,
				'blur',
				function(e) { /*debug*///console.log("blur("+e+")");
					clearTimeout(that.findTimeout);
					
					// user accepts the hilited text
					that._value = that.inputElement.val();
					valueChanged(that, true);
						
					that.hide();
				}
			);
			
			events.addListener( // the cursor is over a result item
				that.overlay.container,
				'mouseover',
				function(e) { /*debug*///console.log("mouseover("+e+")");
					var li = getParentListItem(that, e.source);
					li && activateItem(that, li);
				}
			);
			
			events.addListener( // the cursor has left a result item
				that.overlay.container,
				'mouseout',
				function(e) { /*debug*///console.log("mousmouseouteover("+e+")");
					var li = getParentListItem(that, e.source);
					if (li && li != e.source) deactivateItem(that, li);
				}
			);
			
			var ignoreInUp = false; // flag to tell the keyup handler if it should ignore already-handled key presses
			var repeating = {ondown:0, onpress:0};
			
			function keyDownHandler(e) { /*debug*///console.log("keydown "+e.key);
				clearTimeout(that.findTimeout); // kill any pending finds whenever a new key is pressed
				
				ignoreInUp = false;
				repeating.ondown++;
				
				if (e.key == 'DOWN') {
					if (isVisible(that)) {
						ignoreInUp = true; 
						nextItem(that);
						return false; // on some systems this moves the carat around
					}
					
				}
				else if (e.key == 'UP') {
					if (isVisible(that)) {
						ignoreInUp = true;
						prevItem(that);
						return false;
					}
				}
				else if (e.key == 'LEFT') {
					if (isVisible(that)) {
						// user accepts the hilited text
						that._value = that.inputElement.val();
						valueChanged(that, true);
						that.hide();
					}
				}
				else if (e.key == 'RIGHT') {
					if (isVisible(that)) {
						// user accepts the hilited text
						that._value = that.inputElement.val();
						valueChanged(that, true);
						that.hide();
					}
				}
				else if (e.key == 'ESC') { // bail
					// user accepts the hilited text
					that._value = that.inputElement.val();
					valueChanged(that, true);
					that.hide();
					return false;
				}
				else if (e.key == 'DEL' || e.key == 'BACKSPACE') {
					that.hide();
				}
				else if (e.key == 'ENTER') { // a result item was picked?
					if (isVisible(that)) ignoreInUp = true;
					else return true; // no: the results aren't visible so just do the default thing
					
					var selectedOffset = that.getSelectedOffset();
					if (selectedOffset == -1) { // no: there isn't any result item selected
						that.hide();
						return true; // do the default thing
					}
					
					// yes: fire the itemSelect event
					var e = new events.Event();
					e.source = $(that.overlay.container).get('.active');
					e.selectedItem = that._found[selectedOffset];
					events.fire(that, 'itemSelect', e);
					return false; // return false to prevent form submitting?
				}
				
				// if we're still here...
				return true;
			}
			events.addListener(that.inputElement[0], 'keydown', keyDownHandler);
			
			function keyPressHandler(e) { /*debug*///console.log("keypress "+e.key);
				repeating.onpress++;
				
				// For non-printable characters, like arrow keys...
				// Some browsers (like Mac Safari 3.1.1) only ever fire the keydown event
				// (even for auto-repeats) and never fire the keypress event.
				// Some browsers fire the keydown event only once and then fire the
				// keypress event repeatedly until the key is released.
				// We need to deal with both possibilities but we must not
				// handle the event twice.
				
				// We do nothing the very first time we get here, because the event must
				// have already been handled in previous keydown phase.
				// But if we've passed here more than once, oafter a single keydown, 
				// we must be repeating on keypress, so it's ok to handle it from now on.
				if (repeating.ondown == 1 && repeating.onpress > 1) {
					if (e.key == 'DOWN') {
						if (isVisible(that)) {
							nextItem(that);
						}
						return false;
					}
					else if (e.key == 'UP') {
						if (isVisible(that)) {
							prevItem(that);
						}
						return false;
					}	
				}
				
				return true;
			}
			events.addListener(that.inputElement[0], 'keypress', keyPressHandler);
			
			
			function keyUpHandler(e) { /*debug*///console.log("keyUpHandler(e)");
				repeating = {ondown:0, onpress:0}; // not repeating anymore
				
				if (ignoreInUp) return false;

				that._value = that.inputElement.val(); // stow the new value from the input element
				
				valueChanged(that);				
				
				return true;
			}
			events.addListener(that.inputElement[0], 'keyup', keyUpHandler);
		}
		
		/**
			@private
			@description What to do when the value in the input element changes.
		 */
		function valueChanged(that, withoutFinding) { /*debug*///console.log("valueChanged(that, "+withoutFinding+")");
			if (typeof that._oldValue == "undefined")  that._oldValue = that.inputElement.val(); // initially
			var currentValue = that.getValue(); // grab value, so we can send it with the event

			/*debug*///console.log("oldValue is '"+that._oldValue+"'; currentValue is '"+currentValue+"';");

			var skipFind = false;
			if (currentValue.toLowerCase() == that._oldValue.toLowerCase()) {
				var skipFind = true;
			}
		
			that._oldValue = currentValue;
				
			if (withoutFinding || skipFind) return;

			that.findTimeout = setTimeout(
				function() {
					var e = new glow.events.Event();
					e.value = currentValue;
					glow.events.fire(that, 'inputChange', e);
					
					activateItemOffset(that, 0);

					if (!e.defaultPrevented()) { // user can cancel the find in their handler
						if (typeof that.dataSource != 'object') that.loadData(); // urls and functions are always reloaded
						that.find();
					}
				},
				500
			);
		}
			
/* constructor ****************************************************************/

		/**
		  @name glow.widgets.AutoSuggest
		  @constructor
		  @description Create an auto-suggest menu for an input element.
		  
		  An AutoSuggest widget adds the ability for a text input element to make
		  suggestions whilst the user types. This appears as a list of selectable
		  items below the input element which dynamically updates based on what
		  has been typed so far.

		  <div class="info">Widgets must be called in a <code>glow.ready()</code> call.</div>
		  
		  @param {glow.dom.NodeList | String} inputElement A NodeList or css selector that points to a text input element.
		  @param {Object[] | String[] | String | Function} dataSource Either an array of objects, an array of strings (referred to as a 'dataSource'), a function that returns a dataSource or a URL that when requested will return a dataSource.
		  @param {Object} opts Optional configuration settings.
			@param {String[] | Function} [opts.index=["name"]] When datasource is an array of objects, the property with this string is used as the index, or this function will be used to generate the index.
			@param {Number} [opts.width=inputElement width] Width in pixels of the suggestion container. Default is the width of the inputElement.
			@param {Number} [opts.height] Height in pixels of the suggestion container.
			@param {Function} [opts.parseData] Transform the response from the server into a dataSource object.
				The server may return XML or even plain text, but your parseData function should convert this
				data into an array of objects.
				
				Your function will be passed a {@link glow.net.Response} object from the server.
				
			@param {Function} [opts.formatItem] Given the matched data item, return HTML or NodeList.
			@param {Boolean} [opts.activeOnShow=true] Should the first suggestion automatically be active when the suggestion list appears?
			@param {Number} [opts.maxListLength] Limit the size of the result list to this.
			@param {Boolean} [opts.caseSensitive=false] Whether case is important when matching suggestions.
			@param {Function} [opts.isMatch] Provide a custom function to filter the dataset for results
				Your function will be passed an indexed term and the term entered by the user, return
				true to confirm a match.
				
				The default function will check the indexed term begins with the term entered by the user.
			@param {Boolean} [opts.complete=false] Append the completed text of the currently active suggestion to the input text.
			@param {String} [opts.delim] When defined, the input text will be treated as multiple values, separated by this string (with surrounding spaces ignored).
			@param {string} [opts.theme="light"] Either "light" or "dark".
			@param {String|Function} [opts.anim] Passed into the Overlay constructor for show and hide transitions.
			@param {Function} [opts.onInputChange] Your own handler for the inputChange event.
			@param {Function} [opts.onItemSelect] Your own handler for the itemSelect event.
			@param {Function} [opts.onDataLoad] Your own handler for the dataLoad event.
			@param {Function} [opts.onDataError] Your own handler for the dataError event.
			@param {Function} [opts.onDataAbort] Your own handler for the dataAbort event.
	  
		  @see <a href="../furtherinfo/widgets/autosuggest/">AutoSuggest user guide</a>

		  @example

			new glow.widgets.AutoSuggest(
				"#inputElementId",  // HTML input element to bind the AutoSuggest to
				["Apple Flan", "Easy Shortbread", "Apple FlapJack", "Flambe of Brandied Apple Ice"] // Data source
			);

		  @example

			myOpts = {
				width: 100,
				theme: "dark",
				maxListLength: "10",
				onItemSelect: function(e) {
					this.val(e.selectedItem.name); // Updates the binded HTML input element with the selected value
				}
			}

			myData = [
					{
							name: "Apple Flan"
					},
					{
							name: "Easy Shortbread"
					},
					{
							name: "Apple FlapJack"
					},
					{
							name: "Flambe of Brandied Apple Ice"
					}
			];

			myAutoSuggest = new glow.widgets.AutoSuggest(
				"#inputElementId", // HTML input element to bind the AutoSuggest to
				myData,
				myOpts
			);

		  @example

			new glow.widgets.AutoSuggest(
				myInputElement,  // HTML input element to bind the AutoSuggest to
				"colornames.js", // URL to data
				myOpts
			).loadData(); // load data from URL now

		*/
		/**
		@name glow.widgets.AutoSuggest#event:inputChange
		@event
		@description Fired whenever new suggestion appears based on changed input.
		@param {glow.events.Event} event Event Object
		*/
		/**
		@name glow.widgets.AutoSuggest#event:itemSelect
		@event
		@description Fired whenever a suggestion is selected.

		@param {glow.events.Event} event Event Object
		@param {Object} event.selectedItem The object in the dataSource that is associated with the selected list item.
		*/
		/**
		@name glow.widgets.AutoSuggest#event:dataLoad
		@event
		@description Fired whenever raw data is loaded from a request to a URL.
		@param {glow.events.Event} event Event Object
		*/
		/**
		@name glow.widgets.AutoSuggest#event:dataError
		@event
		@description Fired whenever there is an errored request to a URL.
		@param {glow.events.Event} event Event Object
		*/
		/**
		@name glow.widgets.AutoSuggest#event:dataAbort
		@event
		@description Fired whenever there is an aborted request to a URL.
		@param {glow.events.Event} event Event Object
		*/
		glow.widgets.AutoSuggest = function(inputElement, dataSource, opts) { /*debug*///console.log('new glow.widgets.AutoSuggest('+inputElement+', '+dataSource+', '+opts+')');
			this.opts = opts || {};
			
			bindTo(this, inputElement);
						
			this.overlay = new glow.widgets.Overlay(
				glow.dom.create('<div class="glowCSSVERSION-autoSuggest"><ul></ul></div>'),
				{
					autoPosition: false,
					anim: (this.opts.anim)? this.opts.anim : null
				}
			);
		
			this.configure(this.opts);
			buildIndexer(this); // build the function that will be used to create an index from the data
			
			this.dataSource = dataSource;
			this.data = [];
			if (typeof dataSource != 'string') this.loadData(); // urls are not loaded on construct, objects and functions are
			
			addEvents(this);
			
			if (this.opts.complete) {

				// Fix for trac 175 - "Autosuggest opens overlay onLoad where opts.complete == true"
				if (this.inputElement.val() == '') {
					this.setData(dataSource);
				}
				else {
					this.setData(dataSource, function() {});
				}
				
				var that = this;

				events.addListener(
					that,
					'itemActive',
					function(e) {
						var selectedOffset = that.getSelectedOffset();
						if (selectedOffset == -1) return false;
						var matchedOn = (that._found[selectedOffset][this.opts.index]||that._found[selectedOffset]['name']||that._found[selectedOffset]);
						if (typeof matchedOn.push != "undefined") matchedOn = that._matchedOn;
						that.suggest(matchedOn);
						
						return true;
					}
				);
			}
		}

/* public fields *************************************************************/

		/**
		  @name glow.widgets.AutoSuggest#inputElement
		  @type glow.dom.NodeList
		  @description Refers to the input element to which this is attached to.
		  @example

		  var myAutoSuggest = new glow.widgets.AutoSuggest(
			"input#preferedColour",
			"colornames.js"
		  );
		  alert(myAutoSuggest.inputElement); // returns a nodeList referencing input#preferedColour

		 */
		 
		 /**
		  @name glow.widgets.AutoSuggest#overlay
		  @type glow.widgets.Overlay
		  @description Refers to the overlay object that will contain the list of suggestions.
		  @example

		  var myAutoSuggest = new glow.widgets.AutoSuggest(
			"input#preferedColour",
			"colornames.js"
		  );
		  myAutoSuggest.overlay.show();

		 */
		
/* public methods *************************************************************/
		
		/**
			@private
			@description Used internally to apply configuration options.
		 */
		glow.widgets.AutoSuggest.prototype.configure = function(opts) {
			this.opts = opts || {};
			
			if (this.opts.height) {
				var listContainer = $(this.overlay.container.get('.glowCSSVERSION-autoSuggest').get('ul')[0]);
				listContainer.css('overflow-x', 'hidden');
				listContainer.css('overflow-y', 'auto');
				listContainer.height(this.opts.height);
			}
			
			if (this.opts.theme == 'dark') {
				$(this.overlay.container.get('ul')[0]).removeClass('autosuggest-light');
				$(this.overlay.container.get('ul')[0]).addClass('autosuggest-dark');
			}
			else {
				$(this.overlay.container.get('ul')[0]).removeClass('autosuggest-dark');
				$(this.overlay.container.get('ul')[0]).addClass('autosuggest-light');
			}
			
			if (this.opts.onDataLoad)    events.addListener(this, 'dataLoad', this.opts.onDataLoad);
			if (this.opts.onDataError)   events.addListener(this, 'dataError', this.opts.onDataError);
			if (this.opts.onDataAbort)   events.addListener(this, 'dataAbort', this.opts.onDataAbort);
			if (this.opts.onInputChange) events.addListener(this, 'inputChange', this.opts.onInputChange);
							
			this._isMatch =  this.opts.isMatch || function(word, lookFor) { return (word.indexOf(lookFor) == 0); } // default
			this._formatItem = this.opts.formatItem || function(o) { return (o.name)? o.name : o.toString(); }; // default
			this._matchItem = this.opts.formatItem || function(o) { return o.name; }; // default
			this._filter = this.opts.filter || function(results) { return results; }; // do nothing
		}
		
		/**
			@name glow.widgets.AutoSuggest#setData
			@function
			@description Update the data source
			
				If the dataSource is a URL it will be reloaded asynchronously.
				
			@param {Object[] | String | Function} dataSource New data source
			@type {glow.widgets.AutoSuggest}
			@returns The instance of the widget.
			@example
				myAutoSuggest = new glow.widgets.AutoSuggest(
					myInputElement,
					"colornames.js", // URL to data
					myOpts
				)
				myAutoSuggest.setData("newColornames.js"); // Set data to new URL
				myAutoSuggest.loadData(); // load data from new URL now
		 */
		glow.widgets.AutoSuggest.prototype.setData = function(dataSource, callback) { /*debug*///console.log("setData("+((dataSource)?dataSource.toSource():"")+")");
			if (typeof dataSource == 'function') {
				dataSource = dataSource.call(this);
			}
			
			if (typeof dataSource == 'string') { // it's a URL but next time through we'll have an actual object, not a string
				this.dataURL = dataSource;
				this.data = []; // placeholder value until download completes
				
				// insert the current value of the input element to pass to the server
				dataSource = dataSource.replace(/\{input\}/g, escape(this.getValue()));
				downloadData(this, dataSource, callback); // calls setData
			}
			else {
				this.data = dataSource;
			
				// process data to build a results_array and an index like {"keyword": results_array_offsets[]}
				this.index   = {};
				this.results = [];
				
				// this._indexer is a function to extract the keywords from each data item
				for (var d = 0; d < this.data.length; d++) {
					var datum = this.data[d];
					this.results.push(datum);
				
					// build index keywords
					var keywords = this._indexer(datum);
					keywords = (typeof keywords == 'string')? [keywords] : keywords;
					
					// associate data items with keyword
					for (var i = 0; i < keywords.length; i++) {					
						var keyword   = "="+(this.opts.caseSensitive? String(keywords[i]) : String(keywords[i]).toLowerCase());
						if (!this.index[keyword]) this.index[keyword] = [];
						this.index[keyword].push(this.results.length-1);
					}
				}
				
				return this; // chained
			}
		}
		
		/**
			@name glow.widgets.AutoSuggest#loadData
			@function
			@description Cause the dataSource passed to the constructor to be set as the current data.
			@type {glow.widgets.AutoSuggest}
			@returns The instance of the widget.
			@example
				new glow.widgets.AutoSuggest(
					myInputElement,
					"colornames.js", // URL to data
					myOpts
				).loadData(); // load data from URL now
		 */
		glow.widgets.AutoSuggest.prototype.loadData = function(callback) { /*debug*///console.log("loadData()");
			this.setData(this.dataSource, callback);
			return this; // chained
		}
		
		/**
			@private
			@description Used to create a sting that combines a completetion with existing text.
		 */
		function appendTag(currentValue, delim, value) {  /*debug*///console.log("called appendTag('"+currentValue+"', '"+delim+"', '"+value+"')");
			var split;
			if (delim == '' || currentValue.indexOf(delim) < 0) {
				split = new RegExp('^( *)(.*)$');
			}
			else {
				split = new RegExp('^(.*'+delim+' *)([^'+delim+']*)$');
			}
			
			var lv = split.exec(currentValue)[1];
			var rv = (split.exec(value)||["", "", value])[2];

			return lv+rv;
		}
		
		/**
			@name glow.widgets.AutoSuggest#val
			@function
			@param {string} [value] If defined this value is set, otherwise the current value is returned.
			@description Sets or gets the value of the input element (minus any unaccepted completions).
			@type {String|glow.widgets.AutoSuggest}
			@returns The value of the input element when getting, or the instance of the widget when setting.
			@example
				new glow.widgets.AutoSuggest(
					"input#recipeName",  // refers to an input element on the page
					["Apple Flan", "Easy Shortbread", "Apple FlapJack", "Flambe of Brandied Apple Ice"], // Data source
					{
						onItemSelect: function(e) {
							this.val(e.selectedItem.name); // Set input#reciptName to the value of the selected item
						}
					}
				);
		 */
		glow.widgets.AutoSuggest.prototype.val = function(value) { /*debug*///console.log("called val("+value+")");
			if (typeof value == 'undefined') { //set
				return this._value;
			}
			else {
				this._value = value;
				this.inputElement.val(value);
				return this; // chained
			}
		}
		
		/**
			@private
			@name glow.widgets.AutoSuggest#setValue
			@function
			@description Sets the current value of the widget. In the case of
			the delim option, set the last delimited item.
		 */
		glow.widgets.AutoSuggest.prototype.setValue = function(value) { /*debug*///console.log("called setValue("+value+")");
			var currentValue = this._value || this.inputElement.val();
			var delim = (this.opts.delim || '');
			value = appendTag(currentValue, delim, value);
			
			this._value = value;
			this.inputElement.val(value);
		}
		
		/**
			@private
			@name glow.widgets.AutoSuggest#getValue
			@function
			@description Returns the current value of the widget. In the case of
			the delim option, gets the last delimited item.
		 */
		glow.widgets.AutoSuggest.prototype.getValue = function() { /*debug*///console.log("getValue()");
			var value = this._value || this.inputElement.val();
			
			if (typeof this.opts.delim != 'undefined' && this.opts.delim != '') {
			 	value = (value.match(new RegExp('(^|'+this.opts.delim+' *)([^'+this.opts.delim+']*)$')) || ['', '', '']);
			 	value = value[2];
			 }
			 
			return value;
		}
		
		/**
			@private
			@name glow.widgets.AutoSuggest#suggest
			@param {string} suggested The text that is being suggested.
			@description Display text with the suggested portion selected.
		 */
		glow.widgets.AutoSuggest.prototype.suggest = function(suggested) { /*debug*///console.log("suggest("+suggested+")");
			this._suggested = suggested;
			var currentValue = this.inputElement.val();
			var delim = (this.opts.delim || '');
			var value = appendTag(currentValue, delim, suggested);
			this.inputElement.val(value);

			selectRange(this.inputElement[0], {start: (this._value || '').length, end: this.inputElement.val().length}); //currentValue.length+suggested.length})
		}
		
		/**
			@private
			@description Make the text in the given range selected.
			@param el
			@param range
			@param range.start
			@param range.end
		 */
		function selectRange(el, range) { /*debug*///console.log("selectRange("+el+", "+range.toSource()+")");
			el.focus();

			if (!window.opera && el.createTextRange) { // ie, but not opera (faker)
				var r = el.createTextRange();
				r.moveEnd('character', range.end);
				r.moveStart('character', range.start);
				r.select();
			}
   			else { // moz, saf, opera
   				el.select();
				el.selectionStart = range.start;
				el.selectionEnd = range.end;
			}
		}
		
		/**
			@private
		 */
		function setCaretTo(el, pos) { /*debug*///console.log("setCaretTo("+el+", "+pos+")");
			selectRange(el, {start: pos, end: pos})
		}
		
		/**
		  @private
		  @name array_indexOf
		  @function
		  @description Find the position of a value in an array. Like Mozilla's
		  Array#indexOf().
		 */
		function array_indexOf(value) {
			var index = -1;
		
			for (var i = 0, l = this.length; i < l; i++) {
				if (this[i] === value) {
					index = i;
					break;
				}
			}
		
			return index;
		}

		/**
		  @private
		  @name glow.widgets.AutoSuggest#find
		  @function
		  @description Cause the data to be searched for items that match the value of the inputElement.
		  @param {String} lookFor For testing purposes you can pass in a lookFor, otherwise it will be drawn from the inputElement.
		  @returns undefined
		 */
		glow.widgets.AutoSuggest.prototype.find = function(lookFor) { /*debug*///console.log("find()")
			if (typeof lookFor == "undefined") lookFor = this.getValue();
			
			// ltrim
			while (lookFor.charAt(0) == ' ') lookFor = lookFor.substring(1);

			if (!this.opts.caseSensitive) lookFor = lookFor.toLowerCase();

			var found = [];
			found.indexOf || (found.indexOf = array_indexOf);

			if (lookFor) {
				for (var k in this.index) {
					var lookAt = k.substring(1);

					if (this._isMatch(lookAt, lookFor)) {
						var keys = this.index[k];						
						
						for (var j = 0; j < keys.length; j++) {
							var offset = keys[j];
							
							if (found.indexOf(this.results[offset]) == -1) {
								found.push(this.results[offset]);
							}
						}
					}
				}
			}
			
			// apply any optional filtyering to the results
			found = this._filter(found);
			
			this._found = found; // used to get the selected object in event handlers
			if (found.length) {
				if (this.opts.maxListLength) found.length = Math.min(found.length, this.opts.maxListLength);
				
				var list = [];
				for (var i = 0; i < found.length; i++) {
					list.push('<li class="'+((i%2)? 'odd' : 'even')+'">'+this._formatItem(found[i])+'</li>');	
				}
				$(this.overlay.container.get('ul')[0]).html(list.join(''));
				
				this.show();
			}
			else {
				this.hide();
			}
			
			if (this.opts.activeOnShow !== false) nextItem(this);
		}
		
		/**
			@private
			@description Make the overlay not visible.
		 */
		glow.widgets.AutoSuggest.prototype.hide = function() { /*debug*///console.log("hide()")
			this.overlay.hide();
		}
		
		/**
			@private
			@description Make the overlay visible.
		 */
		glow.widgets.AutoSuggest.prototype.show = function() { /*debug*///console.log("show()")
			place(this);
			this.overlay.show();
		}
		
		/**
			@private
			@description Get the offset of the currently selected item in the results.
		 */
		glow.widgets.AutoSuggest.prototype.getSelectedOffset = function() {
			if (!isVisible(this)) return -1;
			
			var items = this.overlay.container.get('li'); // TODO: handle embedded list items
			
			for (var i = 0; i < items.length; i++) {
				if ($(items[i]).hasClass('active')) return i;
			}
			
			return -1;
		}
	}
});
