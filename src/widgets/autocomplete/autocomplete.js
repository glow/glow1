(window.gloader || glow).module({
	name: 'glow.widgets.AutoComplete',
	library: ['glow', '@VERSION@'],
	depends: [[
		'glow', '@VERSION@',
		'glow.widgets.AutoSuggest'
	]],
	
	builder: function(glow) {
/* private fields *************************************************************/
		var $      = glow.dom.get, // shortcuts
			events = glow.events,
			anim   = glow.anim;
			
/* private functions **********************************************************/
/* constructor ****************************************************************/
		/**
			@constructor
			@name glow.widgets.AutoComplete
			@see <a href="../furtherinfo/widgets/autosuggest/">AutoSuggest user guide</a>
			@deprecated Since version 1.2.2. You should now use glow.widgets.AutoSuggest with the 'complete' constructor option
			@description Adds the ability to complete what has been typed to the AutoSuggest widget.
			
			This widget acts as a thin wrapper to the {@link glow.widgets.AutoSuggest}
			widget and adds the ability to automatically append the missing text
			to complete what has been typed by the user. Note that because the
			completed item must be text in order to appear in the input element,
			this widget can only process data items that are strings.
			@param {NodeList | String} inputElement
				 A NodeList or css selector that points to a text input element.
			@param {Object[] | String | Function} dataSource Either a dataSource
				 object, a function that returns a dataSource object or a URL that
				 returns a dataSource object.
			@param {Object} opts All options are passed directly to the wrapped instance of
			{@link glow.widgets.AutoSuggest}.
			@param {string} opts.delim Character to delimit multiple entries.
			  If defined, the user can enter more than one term into the text input 
			  element, delimited by this string (and any spaces surrounding the delimiter).
		 */
		glow.widgets.AutoComplete = function(inputElement, dataSource, opts) { /*debug*///console.log('new glow.widgets.AutoComplete('+inputElement+', '+dataSource+', '+opts+')');
			opts = opts || {};
			
			/**
				@object
				@name glow.widgets.AutoComplete#autosuggest
				@type glow.widgets.AutoSuggest
				@description The wrapped instance of glow.widgets.AutoSuggest used to implement this widget.
			*/
			this.autosuggest = new glow.widgets.AutoSuggest(inputElement, [], opts);
			this.autosuggest._indexer = function(dataItem) { return dataItem.toString(); }
			this.autosuggest._formatItem = function(dataItem) { return dataItem.toString(); }
			this.autosuggest.setData(dataSource);
			
			var that = this.autosuggest;
			
			events.addListener(
				that,
				'itemActive',
				function(e) {
					var selectedOffset = that.getSelectedOffset();
					if (selectedOffset == -1) return false;
					that.suggest(that._found[selectedOffset]);
					
					return true;
				}
			);
		}

/* public fields **************************************************************/	
/* public methods *************************************************************/
	}
});
