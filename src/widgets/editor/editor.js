(window.gloader || glow).module({
	name: 'glow.widgets.Editor',
	library: ['glow', '@VERSION@'],
	depends: [[
		'glow', '@VERSION@',
		'glow.dom',
		'glow.events',
		'glow.widgets',
		'glow.i18n',
		'glow.widgets.Overlay'
	]],
	
	builder: function(glow) {
		var $      = glow.dom.get, // shortcuts
			events = glow.events,
			$i18n  = glow.i18n;
			
		$i18n.addLocaleModule("GLOW_WIDGETS_EDITOR", "en", {
			ENTER_MESSAGE  : "You are about to enter a Rich Text Editor",
			SKIP_LINK_TEXT : "Skip past",
			LEAVE_MESSAGE  : "You have left the Rich Text Editor",

			BOLD_TITLE : "Bold",
			BOLD_LABEL : "B",

			ITALICS_TITLE : "Italics",
			ITALICS_LABEL : "I",

			STRIKE_TITLE : "Strikethrough",
			STRIKE_LABEL : "Strike",
			
			UNORDERED_TITLE : "Unordered list",
			UNORDERED_LABEL : "unordered list",
			
			ORDERED_TITLE : "Ordered list",
			ORDERED_LABEL : "ordered list",
			
			FORMATBLOCK_TITLE : "Text style",
			FORMATBLOCK_LABEL : "text style",
			
			HEADINGLEVELONE_TITLE : "Heading 1",
			HEADINGLEVELTWO_TITLE : "Heading 2",
			HEADINGLEVELTHREE_TITLE : "Heading 3",
			NORMAL_TITLE : "Normal"

			
		/*
			BLOCK_TITLE : "Blockquote",
			BLOCK_LABEL : "blockquote"

			HEADING1_TITLE : "Heading1",
			HEADING1_LABEL : "Heading1",

			TOGGLE_TITLE : "toggle",
			TOGGLE_LABEL : "toggle",
			
			** DONT FORGET THE OTHER LOCAL PACKS (eg CY)
		*/
		});
		
		/**
			@name glow.widgets.Editor
			@class
			@description A Rich Text Editor to allow text formatting with form inputs.

			<div class="info">Widgets must be called in a <code>glow.ready()</code> call.</div>
			@constructor
			@param {String|glow.dom.NodeList} textarea Textarea HTML element that the Editor replaces on your page
			@param {Object} opts
			@_param {String} [opts.toolset="basic"]
			@param {String} [opts.theme="light"] Visual Theme
			Currently supported themes are "dark" and "light".
			@param {Function} [opts.onCommit] Event shortcut.
			See documentation below
			@_property {glow.dom.NodeList} element
			@_property {glow.dom.NodeList} textarea
			@_property {glow.widgets.Editor.Toolbar} toolbar
			@_property {glow.widgets.Editor.EditArea} editArea
			
			@example
				var editor = new glow.widgets.Editor("#commentEntry");

			@see <a href="../furtherinfo/widgets/editor/">Editor user guide</a>
		*/
		/**
			@name glow.widgets.Editor#event:commit
			@event
			@description Fired whenever the associated textarea is updated by the editor.
			@param {glow.events.Event} event Event Object

		 */
		glow.widgets.Editor = function(textarea, opts) {
			textarea = $(textarea);
			
			var editorLocaleModule = $i18n.getLocaleModule("GLOW_WIDGETS_EDITOR");
			
			this._tools = createTools(editorLocaleModule);

			opts = this._opts = glow.lang.apply(
				{
					toolset: "basic",
					onCommit: null
				},
				opts
			);
			// interpolate context
			this.element = glow.dom.create('<div class="glowCSSVERSION-editor"><p class="glowCSSVERSION-hidden">{ENTER_MESSAGE}, <a href="#endOfEditor' + endOfEditorCounter() + '" tabindex="0">{SKIP_LINK_TEXT}</a></p><div class="editor-' + (opts.theme || "light") + '"><div class="editor-state"></div></div><p id="endOfEditor' + endOfEditorCounter() + '" class="glowCSSVERSION-hidden endOfEditorCounter" tabindex="0">{LEAVE_MESSAGE}</p></div>', {interpolate : editorLocaleModule});
			this.textarea = textarea;
			this.toolbar = new glow.widgets.Editor.Toolbar(this);
			
			if (this._opts.toolset == "basic") {
				this.toolbar._addToolset("italics", "bold", "strike", "formatBlock", /*"blockquote",*/ "unorderedlist", "orderedlist");
			}
			else throw new Exception("Unknown toolset name.");
			
			this.editArea = new glow.widgets.Editor.EditArea(this);
			this.cleaner = new TagCleaner();
			
			// Safari 2 is not enhanced
			if (!isSafariTwo()) {
				place.apply(this);
				bindEditor.apply(this, []);
			}
			if (opts.onCommit){
				events.addListener(this, "commit", opts.onCommit);
			}
		}

////

/**
	@ignore
	@private
	@name endOfEditorCounter
	@description We need to give each hidden accessibility hidden message a unique id, so to do this add a number on the end.  Work out the number by counting how many of these links are already on the page.
  */
 var endOfEditorCounter = function() {
	return glow.dom.get('p.endOfEditorCounter').length+1;
 }


/**
	@ignore
	@private
    @name Idler
    @constructor
    @param {String|Object} attachTo The object to attach the idler to.
    @param {String|String[]} name The event name, or names for multiple events.
    @param {Number} wait The number of seconds to wait after no event occurs before the callback should run.
    @param {Object} [opts] Options object
    @param {Function} [opts.onFire] Function to run when this Idler fires.
    @param {Number} [opts.rate] Repeat the fire event every x seconds
 */

var Idler = function(attachTo, name, wait, opts) { /*debug*///console.info("new Idler()");
	opts = this._opts = glow.lang.apply(
		{
			onFire: function() {}
		},
		opts
	);
	
	var that = this;
	this.attachTo = attachTo;
	this.name = name;
	this.wait = wait;
	this.callback = opts.onFire;
	this.rate = opts.rate;
	this.running = false;
	this.initiated = false;
	
	if (typeof this.name.pop == "undefined") { // is it an array?
		this.name = [this.name];
	}
	
	for (var i = 0, l = this.name.length; i < l; i++) {
		var name = this.name[i];
		glow.events.addListener(
			this.attachTo,
			name,
			function() {
				clearInterval(that.intervalId);
				clearTimeout(that.timeoutId);
				that._tick();
			}
		);
	}
	
	this._start();
}

/**
	@ignore
	@private
	@name Idler#disabled
	@function
	@param {Boolean} [disabledState]
	@description Sets/gets the disabled state of the Idler. When disabled, any running
    timers are cancelled and no new timers can be started.
 */
Idler.prototype.disabled = function(disabledState) {
	if (typeof disabledState == "undefined") {
		return !this.running;
	}
	else {
		if (disabledState) this._stop();
		else this._start();
	}
}

Idler.prototype._tick = function() {/*debug*///console.info("Idler._tick()");
	var that = this;
	this.timeoutId = setTimeout(
		function() {
			if (typeof that.rate != "undefined") {
				that.intervalId = setInterval(that.callback, that.rate);
			}
			else {
				that.callback();
			}
		},
		that.wait
	);
}

/**
	@ignore
	@private
	@name Idler#_start
	@function
	@description Start the idler, if it is not already running.
 */
Idler.prototype._start = function() {
	if (this.running) return;

	this._tick();
	
	this.running = true;
}

/**
	@ignore
	@private
	@name Idler#_stop
	@function
	@description Stop the idler, if it is running.
 */
Idler.prototype._stop = function() {
	if (!this.running) return;
	
	clearInterval(this.intervalId);
	clearTimeout(this.timeoutId);
	
	this.running = false;
}

////		

		/**
			@ignore
			@private
			@name place
			@function
			@description Positions the toolbar over the textarea.
			@this glow.widgets.Editor.Toolbar
		 */
		function place() {
			var inputOffset = this.textarea.offset();
			var height = (this.textarea[0].offsetHeight > 142) ? this.textarea[0].offsetHeight : 142;

			this.element.css('width', (this.textarea[0].offsetWidth-2) + 'px');
			this.element.css('height', (height-2) + 'px');
		}

		var bindEditor = function() {
			// Add the widget into the page
			this.textarea.before(this.element);

			// Redo height of the iframe.  We need to do it here because we can only get the correct height when the element is in the page.
			this.element.get('iframe').css( 'height', (parseInt(this.element.css('height'))-42) );

			// Set the textarea so the user can't see it (but a screen reader can)
			this.textarea.css("display", "block");
			this.textarea.css("position", "absolute");
			this.textarea.css("left", "-9999px");
			this.textarea.css("top", "-9999px");
			
			this.bound = true;
		}
		
////////
		glow.widgets.Editor.prototype.inject = function(html) {
			this.editArea._setContent(this.cleaner.dirty(this.cleaner.clean(html)));
		}
		
		glow.widgets.Editor.prototype.commit = function() {
			if (this.bound) {
				$(this.textarea).val(this.cleaner.clean(this.editArea._getContent()));
			}
			glow.events.fire(this, "commit", {});
		}
				
		function TagCleaner(opts) {
			// assumes nesting of dirty tags is always valid
			// assumes no '>' in any dirty tag attributes
			// assumes attributes are quoted with double-quotes, and attribute values contain no escaped double-quotes

			this.opts = opts || {};
			
			this.whitelist = ["em", "strong", "strike", "p", "br", /*"blockquote",*/ "ul", "ol", "li", "h1", "h2", "h3"]; // TODO: support tags.attributes
		}
		
		// runs before clean
		TagCleaner.prototype.pretreat = function(input) {
			// remove html comments
			input = input.replace(/<!--[\s\S]*?-->/g, "");
			
			// remove style tags and their contents
			input = input.replace(/<style\b[\s\S]*?<\/style>/gi, "");
			
			// remove script tags and their contents
			input = input.replace(/<script\b[\s\S]*?<\/script>/gi, "");
			
			return input
		}
		
		TagCleaner.prototype.clean = function(input) { /*debug*///console.log("TagCleaner#clean("+input+")")
				var output = "",
			    stack = [];
			    
			    input = this.pretreat(input);
			    
//var sanity = 99;			
			while (input) {
//if (sanity-- == 0) throw new Error("stoopid loops");
				var skip = 1; // characters

				if (/^(<[^>]+>)/.test(input)) { // tag encountered
					var foundTag = new TagCleaner.Tag(RegExp.$1);

					this.tagClean(foundTag);
					
					if (foundTag.clean && foundTag.opening) { // there's a clean version
						output += foundTag.clean.start;
						if (!foundTag.unary) stack.unshift(foundTag);
						skip = foundTag.text.length;
					}
					else if (stack[0] && input.toLowerCase().indexOf(stack[0].end) === 0) { // found tag was closed
						output += stack[0].clean.end;
						skip = stack[0].end.length;
						stack.shift();
					}
					else { // unknown tag
						output += foundTag;
						skip = foundTag.text.length;
					}
				}
				else { // non-tag content
					output += input.charAt(0);
				}
			
				// move ahead
				input = input.substring(skip);
			}
			
			output = this.spin(output);
			
			return output;
		}
		
		TagCleaner.prototype.dirty = function(clean) {
			var dirty;
	
			if (glow.env.gecko) { // mozilla?
				dirty = clean
					.replace(/<strong>/g, '<b _moz_dirty="">').replace(/<\/strong>/g, '</b>')
					.replace(/<em>/g, '<i _moz_dirty="">').replace(/<\/em>/g, '</i>')
					.replace(/<strike>/g, '<strike _moz_dirty="">')
				;
			}
			else if (glow.env.ie || glow.env.opera) {
				dirty = clean
					.replace(/<strong>/g, '<STRONG>').replace(/<\/strong>/g, '</STRONG>')
					.replace(/<em>/g, '<EM>').replace(/<\/em>/g, '</EM>')
					.replace(/<strike>/g, '<STRIKE>').replace(/<\/strike>/g, '</STRIKE>')
				;
			}
			else if (glow.env.webkit > 528) { // safari 4? TODO: same as safari 2?
				dirty = clean
					.replace(/<strong>/g, '<b>').replace(/<\/strong>/g, '</b>')
					.replace(/<em>/g, '<i>').replace(/<\/em>/g, '</i>')
					.replace(/<strike>/g, '<span class="Apple-style-span" style="text-decoration: line-through;">').replace(/<\/strike>/g, '</span>')
				;
			}
			else if (glow.env.webkit) {  // safari 3?
				dirty = clean
					.replace(/<strong>/g, '<span class="Apple-style-span" style="font-weight: bold;">').replace(/<\/strong>/g, '</span>')
					.replace(/<em>/g, '<span class="Apple-style-span" style="font-style: italic;">').replace(/<\/em>/g, '</span>')
					.replace(/<strike>/g, '<span class="Apple-style-span" style="text-decoration: line-through;">').replace(/<\/strike>/g, '</span>')
				;
			}
			else { throw new Error("Can't be dirty: Unknown browser."); }
			
			return dirty;
		}
		
		/**
			@ignore
			@private
			@description A single span can become a combination of several semantic tags.
			@param {TagCleaner.Tag} tag A span Tag object.
			@returns {String[]} An array of [0] opening tag or tags as a string and [1] closing tag or tags as a string.
		 */
		TagCleaner.prototype.spanClean = function(tag) {
			var clean = {start:"", end:""};
			
			if (/\bstyle\s*=\s*"(.+)"/.test(tag.attrText.toLowerCase())) {
				if (RegExp.$1.indexOf("bold") > -1) {
					clean.start += "<strong>";
					clean.end = "<\/strong>"+clean.end;
				}
				// safari needs this
				if (RegExp.$1.indexOf("font-weight: normal") > -1) {
					clean.start += "<\/strong>";
					clean.end = "<strong>"+clean.end;
				}
				
				if (RegExp.$1.indexOf("italic") > -1) {
					clean.start += "<em>";
					clean.end = "<\/em>"+clean.end;
				}
				
				// safari needs this
				if (RegExp.$1.indexOf("font-style: normal") > -1) {
					clean.start += "<\/em>";
					clean.end = "<em>"+clean.end;
				}
				
				if (RegExp.$1.indexOf("line-through") > -1) {
					clean.start += "<strike>";
					clean.end = "<\/strike>"+clean.end;
				}
			}
			
			return clean;
		}
		
		/**
			@ignore
			@private
			@description Given a dirty tag, add a clean tag property, if one can be found.
			@param {TagCleaner.Tag} tag A dirty Tag object.
			@returns {String[]} An array of [0] opening tag or tags as a string and [1] closing tag or tags as a string.
		 */
		 TagCleaner.prototype.tagClean = function(tag) {
			var clean = ["", ""];	
			
			if (tag.name == "span")   clean = this.spanClean(tag);
			else if (tag.name == "b") clean = {start:'<strong>', end:'<\/strong>'};
			else if (tag.name == "i") clean = {start:'<em>', end:'<\/em>'};
			
			if (clean.start) tag.clean = clean;
		}
		
		TagCleaner.Tag = function(tagText) { /*debug*///console.log("new TagCleaner.Tag("+tagText+")");
			/^<(\/?)([a-zA-Z1-6]+)\b(.*)( ?\/)?>$/.exec(tagText);
			this.closing = !!RegExp.$1;
			this.opening = !this.closing;
			this.unary = !!RegExp.$4;
			this.name = RegExp.$2.toLowerCase();
			this.attrText = RegExp.$3;
			this.text = tagText;
			
			// normalise case of tag names
			this.start = tagText.replace(/^<(\/?)([a-zA-Z]+)\b/, "<$1"+this.name);
			
			if (this.opening && !this.unary) {
				this.end = "<\/"+this.name+">";
			}
		}
		TagCleaner.Tag.prototype.toString = function() {
			return "<" + RegExp.$1 + this.name/* + this.attrText */+ RegExp.$4 +">";
		}
		
		TagCleaner.prototype.spin = function(input) {
			var whitetags = this.whitelist.join("\|");
			// note: Safari 2.0.4 doesn't support unicode in regex, but can use unprintable ASCII characters, like the "Group Separator"
			var allowedTags = new RegExp("<(\\/?("+whitetags+")\\b[^>]*)>", "g");
			input = input.replace(allowedTags, "\x1D$1\x1D");     // hide allowed tags
			input = input.replace(/<[^>]+>/g, "");                // kill all visible tags
			input = input.replace(/\x1D([^\x1D]+)\x1D/g, "<$1>"); // restore allowed tags
			
			// general final clean up...
			input = input.replace(/<>/g, ""); // remove Safari droppings
			
			return input;
		}
		
////////

		/**
			@ignore
			@private
			@name glow.widgets.Editor.Toolbar
			@description
			@constructor
			@_param {glow.widgets.Editor} editor
			@_param {Object} opts
		 */
		glow.widgets.Editor.Toolbar = function(editor, opts) {
			opts = opts || {};
			this.editor = editor;
			this.element = glow.dom.create('<fieldset class="editor-toolbar"><ul class="editor-toolbar-tools"></ul></fieldset>');
			this._tools = [];
			this.editor.element.get(".editor-state").prepend(this.element);
		}
			
		 /**
		     @ignore
		     @private
			 @name glow.widgets.Editor.Toolbar#_addToolset
			 @description Quickly add several tools at once to the toolbar.
			 @function
			 @param {String} ... Either the name of a built-in set of tools,
			 like "fontFormatting" [TBD] and/or the predefined names of
			 built-in tools.
			 @returns {glow.widgets.Editor.Toolbar} this
			 @example
				myToolbar._addToolset("Bold", "Italics")
				.addButton("MyCustomButton", opts); // will be chainable
		 */
		 glow.widgets.Editor.Toolbar.prototype._addToolset = function(/*arguments*/) {
		 	var toolToAdd;
		 	
		 	for (var i = 0, l = arguments.length; i < l; i++) {
		 		if ( (toolToAdd = this.editor._tools[arguments[i]]) ) {
		 			toolToAdd.opts.theme = this.editor._opts.theme; // tools inherit theme from associated editor theme
					addTool.call(this, glow.widgets.Editor.Toolbar.prototype._toolFactory(toolToAdd));
				}
		 	}
		 	
			// Give the toolbar one focusable button
			// this.element.get('a').item(0).tabIndex = 0;
			addToolbarIntoTabIndex.apply(this);

		 	return this;
		 }
		
		 /**
		     @ignore
		     @private
			 @name glow.widgets.Editor.Toolbar#_toolFactory
			 @description Factory for building different kinds of toolbar tools.
			 @function
			 @param {this.editor._tools} 
			 @returns {glow.widgets.Editor.Toolbar.tool} this
		 */
		 glow.widgets.Editor.Toolbar.prototype._toolFactory = function(toolToAdd, editorRef) {
			var newTool;
			switch(toolToAdd.type) {
				case "button":
					newTool = new glow.widgets.Editor.Toolbar.Button(toolToAdd.name, toolToAdd.opts);
					break;
				case "dropDown":
					newTool = new glow.widgets.Editor.Toolbar.DropDown(toolToAdd.name, toolToAdd.opts);
					break;
			}
			return newTool;
		 }
		
		// modifies HTML in place, while preserving the cursor position
		glow.widgets.Editor.blackList = {
			FORM:       true,
			TABLE:      true,
			TBODY:      true,
			CAPTION:	true,
			TH:			true,
			TR:         true,
			TD:         true,
			SCRIPT:     true,
			STYLE:      true,
			INPUT:      true,
			BUTTON:     true,
			OBJECT:		true,
			EMBED:		true,
			SELECT:     true,
//			H1:         true,
//			H2:         true,
//			H3:         true,
			H4:         true,
			H5:         true,
			H6:         true,
			DIV:        true,
			ADDRESS:	true,
//			BLOCKQUOTE: true,
			CENTER:		true,
			PRE:        true,
			CODE:       true,
			A:          true,
//			UL:         true,
//			OL:         true,
//			LI:         true,
			DL:         true,
			DT:         true,
			DD:         true,
			ABBR:       true,
			ACRONYM:	true,
			DFN:		true,
			INS:		true,
			DEL:		true,
			SAMP:		true,
			VAR:		true,
			BIG:		true,
			SMALL:		true,
			BLINK:		true,
			MARQUEE:    true,
			FONT:       true,
			Q:			true,
			U:			true,
			KBD:		true,
			SUB:		true,
			SUP:		true,
			CITE:       true,
			HTML:       true,
			BODY:       true,
			FIELDSET:   true,
			LEGEND:     true,
			LABEL:      true,
			TEXTAREA:   true,
			HR:         true,
			IMG:        true,
			IFRAME:     true,
			ILAYER:     true,
			LAYER:      true
        };
		glow.widgets.Editor.prototype._rinse = function() { /*debug*///console.log("glow.widgets.Editor#_rinse()");		
			if (this._lastRinse == this.editArea._getContent()) return; /*debug*///console.log("rinsing");

			var doc = this.editArea.contentWindow.document;
			var node = doc.body;
			
			var that = this; // keep track of me, even when recursing
			function walkNode(node) {
				if (node.childNodes) {
					for (var i = 0; i < node.childNodes.length; i++) {
						var keepStatus = glow.widgets.Editor.blackList[node.childNodes[i].nodeName];
						
						if (node.nodeType == 1) { // an element node
							if (keepStatus) {
									var replacementNode = doc.createElement("SPAN");
									//replacementNode.setAttribute('class', 'glow-rinsed');
									
									replacementNode.innerHTML = that.cleaner.clean(node.childNodes[i].innerHTML+" ");
									node.replaceChild(replacementNode, node.childNodes[i]);
							}
							else {
								// it's an allowed node but we should limit external styles as much as possible
								if (node.childNodes[i].nodeName == "P") node.childNodes[i].removeAttribute("style");
								if (node.childNodes[i].nodeName == "SPAN") { // webkit may use font-size spans to show headings
									if (/font-size/.test(node.childNodes[i].getAttribute("style"))) node.childNodes[i].removeAttribute("style");
								}
								walkNode(node.childNodes[i]);
							}
						}
					}
				}
				else {
					if (glow.widgets.Editor.blackList[node.nodeName]) {
						node.parentNode.removeChild(node);
					}
				}
			}

			walkNode(node);
			
			this._lastRinse = this.editArea._getContent();
		}

		/**
			@ignore
			@name addTool
			@private
			@function
			@param {glow.widgets.Editor.Toolbar.Tool} toolToAdd
		 */
		function addTool(toolToAdd) { /*debug*///console.log("addTool("+toolToAdd+")")
		 	toolToAdd.editor = this.editor;
		 	this._tools.push(toolToAdd);
			this.element.get(".editor-toolbar-tools").append(toolToAdd.element);
		}
		
		/**
			@ignore
			@private
			@name glow.widgets.Editor.Toolbar#addButton
			@description
			@function
			@param {String} name
			@param {Object} opts
		 */
		glow.widgets.Editor.Toolbar.prototype.addButton = function(name, opts) {
			var newTool = new glow.widgets.Editor.Toolbar.Button(name, opts, this);
			addTool.call(this, newTool);
			return this;
		}
		
		/**
			@ignore
			@private
			@name glow.widgets.Editor.Toolbar#getTool
			@description
			@function
			@param {String} name
			@returns {glow.widgets.Editor.Toolbar.Tool}
		 */
		glow.widgets.Editor.Toolbar.prototype.getTool = function(name) {
			var i = this._tools.length;
			while (--i >= 0) {
				if (this._tools[i].name == name) return this._tools[i];
			}
		}
		
		/**
			@ignore
			@private
			@name glow.widgets.Editor.Toolbar#_update
			@description
			@function
			@param {String} name
			@returns {glow.widgets.Editor.Toolbar.Tool}
		 */
		glow.widgets.Editor.Toolbar.prototype._update = function(domPath) { /*debug*///console.log("glow.widgets.Editor.Toolbar.prototype._update("+domPath+")")
		 	var handled = false;
		 	for (var i = 0, l = this._tools.length; i < l; i++) {
				// ***
				// The dropdown has multilple tag values, so we need to do things a bit different...
				// MAYBE WE SHOULD MOVE THIS INTO THE DROPDOWN OBJECT?
				if(this._tools[i].type == "dropdown") {
					var regex = new RegExp("/\|(" + this._tools[i].tag + ")\|/"),
						domPathMatches = domPath.match(regex);
					if (domPathMatches != null) {
						this._tools[i].label( this._tools[i].overlayMenu.getTitleFromTag(domPathMatches[0]) );
					}
					else {
						this._tools[i].label( "Normal" );
					}
					
				}
				else if (domPath.indexOf("|"+this._tools[i].tag+"|") > -1) {
		 			this._tools[i].activate();
		 			handled = true;
		 		}
		 		else {
		 			this._tools[i].deactivate();
		 		}
			}
		 	return handled;
		}
		
		/** 
			@ignore
			@private
			@name glow.widgets.Editor.Toolbar#_shortcut 
			@description 
			@function 
			@param {String} name 
			@returns {glow.widgets.Editor.Toolbar.Tool} 
		 */ 
	   glow.widgets.Editor.Toolbar.prototype._shortcut = function(letter) { 
			var i = this._tools.length;
			var handled = false;
			while (--i >= 0) { 
				if (this._tools[i].shortcut == letter) {
					this._tools[i].press(); 
					return true;
				}
			} 
			return false;
	   }

////////

		/**
			@ignore
			@private
			@name glow.widgets.Editor.Toolbar.Tool
			@constructor
			@description Generic base class for all Tools.
		 */
		glow.widgets.Editor.Toolbar.Tool = function(name, opts, context) { /*debug*///console.log("glow.widgets.Editor.Toolbar.Tool("+name+", "+opts.toSource()+")")
			this.name = name;
			this.opts = opts || {};
			this.action = this.opts.action || function(){};
			this.tag = this.opts.tag;
			this.command = this.opts.command;
			this.shortcut = this.opts.shortcut;
			this.isActive = false;
			this.isEnabled = true;
			
			if (this.opts.onDeactivate) glow.events.addListener(this, "deactivate", this.opts.onDeactivate, context);
			if (this.opts.onActivate)   glow.events.addListener(this, "activate", this.opts.onActivate, context);
			if (this.opts.onDisable)    glow.events.addListener(this, "disable", this.opts.onDisable, context);
			if (this.opts.onEnable)     glow.events.addListener(this, "enable", this.opts.onEnable, context);
		}
		
		/**
			@ignore
			@private
			@name glow.widgets.Editor.Toolbar.Tool#activate
			@description
			@function
		 */
		 glow.widgets.Editor.Toolbar.Tool.prototype.activate = function() { /*debug*///console.log(this.type+".activate()");
			this.isActive = true;
			glow.events.fire(this, 'activate');
		}
		
		/**
			@ignore
			@private
			@name glow.widgets.Editor.Toolbar.Tool#deactivate
			@description
			@function
		 */
		glow.widgets.Editor.Toolbar.Tool.prototype.deactivate = function() { /*debug*///console.log(this.type+".deactivate()");
			this.isActive = false;
			glow.events.fire(this, 'deactivate');
		}
		
		/**
			@ignore
			@private
			@name glow.widgets.Editor.Toolbar.Tool#disable
			@description
			@function
		 */
		glow.widgets.Editor.Toolbar.Tool.prototype.disable = function() {
			this.isEnabled = false;
			glow.events.fire(this, 'disable');
		}
		
		/**
			@ignore
			@private
			@name glow.widgets.Editor.Toolbar.Tool#enable
			@description
			@function
		 */
		glow.widgets.Editor.Toolbar.Tool.prototype.enable = function() {
			this.isEnabled = true;
			glow.events.fire(this, 'enable');
		}
		
		/**
			@ignore
			@private
			@name glow.widgets.Editor.Toolbar.Tool#press
			@description
			@function
		 */
		glow.widgets.Editor.Toolbar.Tool.prototype.press = function() {
			if (this.isEnabled) {
				this.action.call(this);
				if (!this.isActive && this.type == "button") this.activate();
				else this.deactivate();
				this.editor._lastDomPath = null; // invalidate the current dom path (this is required on some browsers that "wrap" selections) to force ondompathchange to fire when the user clicks away from the current selection
			}
		}

////////

		/**
			@ignore
			@private
			@name glow.widgets.Editor.Toolbar.Button
			@constructor
			@extends glow.widgets.Editor.Toolbar.Tool
		 */
		glow.widgets.Editor.Toolbar.Button = function(name, opts) { /*debug*///console.log("new glow.widgets.Editor.Toolbar.Button("+name+", "+opts.toSource()+")")
			this.Base = arguments.callee.base; this.base = this.Base.prototype;
			this.Base.apply(this, arguments);
			

			this.type = "button";

			
			// a button's CSS classname is defined here 
			var buttonClass = name.toLowerCase() + "-button";
			this.element = glow.dom.create('<li class="editor-toolbar-item"><span class="editor-toolbar-button"><a href="#" title="'+(opts.title || name)+'" tabindex="-1"><span class="editor-toolbar-icon '+buttonClass+'"><span>'+(opts.label || name)+'<\/span><\/span><\/a><\/span><\/li>');
 			
 			// shortcuts
 			var toolLink = this.element.get("a");
 			this.icon = this.element.get(".editor-toolbar-icon"); 
 
			var key_listener;

 			glow.events.addListener(this.icon, "mouseover", function() { if (this.isEnabled && !this.isActive) toolLink.addClass("hover"); }, this);
			glow.events.addListener(toolLink, "focus", function() { if (this.isEnabled) {toolLink.addClass("hover"); key_listener = enable_key_listener(this);} }, this);
 			glow.events.addListener(this.icon, "mouseout",  function() { toolLink.removeClass("hover"); }, this);
			glow.events.addListener(toolLink, "blur",  function() { toolLink.removeClass("hover"); glow.events.removeListener(key_listener);}, this);
 			glow.events.addListener(this, "disable", function() { toolLink.addClass("disabled"); }, this);
 			glow.events.addListener(this, "enable", function() { toolLink.removeClass("disabled"); }, this);
 			glow.events.addListener(this, "activate", function() { if (this.isEnabled) {toolLink.addClass("active");} }, this);
 			glow.events.addListener(this, "deactivate", function() { toolLink.removeClass("active"); }, this);

 			var that = this;
			glow.events.addListener(this.element.get("a"), "mousedown", function() { that.press(); return false; }, this); // bind the click handler context to the Tool (not the HTMLElement)
			glow.events.addListener(this.element.get("a"), "click", function() { return false; }); 
		}
		
		glow.lang.extend(glow.widgets.Editor.Toolbar.Button, glow.widgets.Editor.Toolbar.Tool);
		
		/**
			@ignore
			@private
			@name glow.widgets.Editor.Toolbar.DropDown
			@constructor
			@extends glow.widgets.Editor.Toolbar.Tool
		 */
		glow.widgets.Editor.Toolbar.DropDown = function(name, opts) { /*debug*///console.log("new glow.widgets.Editor.Toolbar.DropDown("+name+", "+opts.toSource()+")")
			
			// this is at the begining of all the objects that extend glow.widgets.editor.toolbar.tool - is this the right way to do it?
			this.Base = arguments.callee.base;
			this.base = this.Base.prototype;
			this.Base.apply(this, arguments);

			this.type = "dropdown";
			
			this._opts = {
				title: opts.title || name,
				label: opts.lable || name,
				theme: opts.theme || 'light'
			};

			// create dropdown tool-link element
			var buttonClass = name.toLowerCase() + "-dropDown"; // like: formatblock-dropDown
			this.element = glow.dom.create('<li class="editor-toolbar-item"><span class="editor-toolbar-dropdown"><a href="#" title="'+this._opts.title+'" tabindex="-1"><span class="'+buttonClass+'"><span>'+this._opts.label+'<\/span><\/span><\/a><\/span><\/li>');

 			// shortcuts
 			var that = this,
				toolLink = this.element.get("a");
 				this.icon = this.element.get(".editor-toolbar-dropdown"); 
 
			// create overlaymenu child obect - this is used as the menu when the drop-down tool-link is clicked on
			this.overlayMenu = new glow.widgets.Editor.Toolbar.OverlayMenu(
				this,
				{
					menuItems: opts.menuItems,
					onClick: function(e) {
						
						// change the dropdown tool-link label
						that.label(that.overlayMenu.menuItems[that.overlayMenu.selected].title);
	
						// fire tool-link - again, this is done from the overlayMenu because the tool-link isn't being interacted with
						//events.fire(that, "activate");
						that.press();
						//events.fire(that, "deactivate");
						//that.deactivate();
						
						if (glow.env.ie) {
							that.editor.editArea.contentWindow.focus();
						}
						
					}
				}
			);

			// getter/setter for the label of the tool-link
			this.label = function(newLabel) {
				if (typeof newLabel != "undefined") {	
					that.element.get("a span span").html(newLabel);
					return this;
				}
				else {
					return that.element.get("a span span").html();
				}
			}


			// set the label to be the last text entry (normal text) in the overlaymenu
			this.label(this.overlayMenu.menuItems[this.overlayMenu.selected].title);


			// ***
			// mouse events
			// clicking on the tool-link opens the overlaymenu (closing the overlaymenu handled inside overlaymenu object)
			glow.events.addListener(that.element.get("a"), "click", function() {
				_openOverlayMenu();
				return false;
			});
			glow.events.addListener(this.element.get("a"), "mousedown", function() { return false; });
			// ***


			// ***
			// roll over events
			glow.events.addListener(that.icon, "mouseover", function() {
				if (this.isEnabled && !this.isActive) {
					toolLink.addClass("hover");
				}
			}, this);
			glow.events.addListener(toolLink, "focus", function() {
				if (this.isEnabled) {
					toolLink.addClass("hover");
				}
			}, this);
			glow.events.addListener(this.icon, "mouseout",  function() {
				toolLink.removeClass("hover");
			}, this);
			glow.events.addListener(toolLink, "blur",  function() {
				toolLink.removeClass("hover");
			}, this);
			// ***


			// ***
			// enable/disable events
			glow.events.addListener(this, "disable", function() {
				toolLink.addClass("disabled");
			}, this);
 			glow.events.addListener(this, "enable", function() {
				toolLink.removeClass("disabled");
			}, this);
			// ***
 			
			
			// ***
			// activate/deactivate events
			glow.events.addListener(this, "activate", function() { /*debug*///console.log("activate");
				if (this.isEnabled) {
					toolLink.addClass("active");
				}
			}, this);
 			glow.events.addListener(this, "deactivate", function() {/*debug*///console.log("deactivate");
				toolLink.removeClass("active");
			}, this);
			// ***
			
			
			// ***
			// keypress events
			glow.events.addListener(toolLink, "keydown", function(e) {

				// Open the overlayMenu
				if(e.key == "DOWN") {
					// Open the overlay
					_openOverlayMenu();
					
					// Always hightlight the item in the dropDown that is currently displayed in the tool
					var toolText = $(this).text();
					that.overlayMenu.container.get("li").each(function(i){
						var li = $(this);
						if(li.text() == toolText) {
							li[0].tabIndex = 0;
							li[0].focus();
						}
					});
					
					return false;
				}
				// Close the overlayMenu
				if(
					   (e.key == "LEFT")
					|| (e.key == "RIGHT")
				) {
					_closeOverlayMenu.call(that);
					return false;
				}
			});

			// opens the overlaymenu and sets it to appear below the dropdown toollink
			function _openOverlayMenu() { /*debug*///console.log("_openOverlayMenu()");
				that.activate();
				that.overlayMenu.show();
				var inputOffset = that.element.offset();
				that.overlayMenu.container
					.css("left", (inputOffset.left + 5))
					.css("top", (inputOffset.top + that.element[0].offsetHeight + 2));
			}		
		}

		function _closeOverlayMenu() { /*debug*///console.log("_closeOverlayMenu()");
			this.deactivate();
			this.overlayMenu.hide();
		}
		
		glow.lang.extend(glow.widgets.Editor.Toolbar.DropDown, glow.widgets.Editor.Toolbar.Tool);

		/**
			@ignore
			@private
			@name glow.widgets.Editor.Toolbar.OverlayMenu
			@constructor
			@param {Object} opts Options object
				@param {Array} [opts.menuItems] Array of objects with values to set the menu items to
					Expects the following structure - menuItems: [{title: 'foo', tag: 'bar'}]
				@param (Function) [opts.onClick] Shortcut to attach an event listener that is called when the user clicks on the overlayMenu.
		 */
		/**
			@ignore
			@private
			@name glow.widgets.Editor.Toolbar.OverlayMenu#menuItems
			@type Array
			@description Array of items that are on the overlayMenu.
		*/
		/**
			@ignore
			@private
			@name glow.widgets.Editor.Toolbar.OverlayMenu#selected
			@type Number
			@description Indicates index value of selected menu item
		*/
		glow.widgets.Editor.Toolbar.OverlayMenu = function(dropDown, opts) { /*debug*///console.log("new glow.widgets.Editor.Toolbar.OverlayMenu("+opts+", "+dropDown+")");

			var overlayMenuContents = glow.dom.create('<ul></ul>'), // html for the overlay
				overlayMenu,
				that = this;

			// default function requires a glow.dom.nodeList passed in, will return the html of the nodeList
			// This param allows you to customise how each menuItem looks
			// DON'T THINK WE NEED THIS?
			opts.formatItem = opts.formatItem || function(o) { return o.html(); };
						
			// default empty function for onclick
			opts.onClick = opts.onClick || function() {};

			// create an overlay that we will use for the menu
			overlayMenu = new glow.widgets.Overlay(overlayMenuContents, {
				className: 'overlayMenu',
				mask: new glow.widgets.Mask({
					opacity: 0
				}),
				modal: true,
				closeOnEsc: true,
				autoPosition: false
			});
			
			// inherit the theme of the dropdown we are associated with
			if (dropDown._opts.theme) {
				overlayMenu.container.addClass('overlayMenu-' + dropDown._opts.theme);
			}

			// Add opts.menuItems onto the overlayMenu. This make
			overlayMenu.menuItems = opts.menuItems;
			
			// param to tell user the index value of the selected menuItem.
			// default value is null as nothing has been selected yet.
			overlayMenu.selected = null;
			
			// add menuItems onto overlayMenu HTML as <li>s
			var z = 0;
			for (menuItem in overlayMenu.menuItems) {
				// shortcut
				menuItem = overlayMenu.menuItems[menuItem];
				// create and add the html to the overlayMenuContents
				overlayMenuContents.append(glow.lang.interpolate(menuItem.template, {title: menuItem.title}));
				// if menuItem.selected == true then set overlayMenu.selected to the index value
				menuItem.selected = menuItem.selected || false;
				if (menuItem.selected == true) {
					overlayMenu.selected = z;
				}
				z++;
			}
			
			// when the overlayMenu is hidden by clicking on the mask then deactivate the dropDown tool-link
			events.addListener(overlayMenu, 'hide', function(){
				if (dropDown.isActive == true) {
					events.fire(dropDown, 'deactivate');
					dropDown.isActive = false;
				}
			});
			
			// pass in a tag, and if the tag matches one of the tags in the menuItems return the matching menuItem's title
			overlayMenu.getTitleFromTag = function(tag) {
				for (menuItem in overlayMenu.menuItems) {
					menuItem = overlayMenu.menuItems[menuItem];
					if (menuItem.tag == tag) {
						return menuItem.title;
					}
				}
				// return null if no tag matches
				return null;
			}
			
			var arrLi = overlayMenu.container.get("li");
			events.addListener(overlayMenuContents, "mouseover", function(e) {
				_highlightMenuItem($(e.source), arrLi);
				e.source.focus();
			});
			events.addListener(overlayMenuContents, "mouseout", function(e) {
				_disableTabIndex(e.source);
			});
			events.addListener(overlayMenuContents, "focus", function(e) {
				_highlightMenuItem($(e.source), arrLi);
			});
			events.addListener(overlayMenuContents, "blur", function(e) {
				_disableTabIndex(e.source);
			});
			events.addListener(overlayMenuContents, "mousedown", function(e) {
				_menuItemClick(e);
				return false
			});

			events.addListener(overlayMenuContents, "keydown", function(e) {

				var toolLink = dropDown.element.get("a");
				switch(e.key) {
					case "UP":
						moveFocusLeft(e, arrLi);
						break;
					case "DOWN":
						moveFocusRight(e, arrLi);
						break;
					case "ESC":
						_closeOverlayMenu.call(dropDown);
						// If keyboard access is being used then we want to throw the focus at the toollink
						toolLink[0].focus();
						break;
					case "LEFT":
						// Fake a LEFT ARROW key press on the dropDown tool in the editor toolbar
						toolLink[0].focus();
						moveFocusLeft(new events.Event({source: toolLink[0]}), dropDown.editor.toolbar.element.get("a"));
						_closeOverlayMenu.call(dropDown);
						break;
					case "RIGHT":
						// Fake a RIGHT ARROW key press on the dropDown tool in the editor toolbar
						toolLink[0].focus();
						moveFocusRight(new events.Event({source: toolLink[0]}), dropDown.editor.toolbar.element.get("a"));
						_closeOverlayMenu.call(dropDown);
						break;
					case "ENTER":
						_menuItemClick(e);
				}

				return false;
			});
			// keypress event needs to return false so Opera doesn't delete the selection in the iframe
			events.addListener(overlayMenuContents, "keypress", function(e){
				e.preventDefault();
				return false;
			});
			// Internal click function.  Calls user defined click event
			function _menuItemClick(e) {
				var source = $(e.source);

				// Remove highlighted class
				source.removeClass("highlighted");

				// set the selected index
				overlayMenu.selected = _findPositionInNodelist(source);

				// close overlay
				_closeOverlayMenu.call(dropDown);

				// Call user defined click event
				opts.onClick(e);
			}
			
			return overlayMenu;
		}
		
		// Pass in an element, and this function will return the index value of its position amongst its siblings
		function _findPositionInNodelist(elm) {
			var siblings = $(elm).parent().children(),
				r = 0;
			siblings.each(function(y) {
				if (this == elm.item(0)) {
					r = y;
				}
			});
			return r;
		}
		
		function _highlightMenuItem(li, arrLi) {
			arrLi.each(function(q) {
				$(arrLi[q]).removeClass("highlighted");
			});
			li.addClass("highlighted");
		}
		
		// Disables (sets to -1) the tabIndex of the passed in element
		function _disableTabIndex(elm){
			elm.tabIndex = -1;
		}

		

// TODO: all these would be better handled by onWhatever event handlers passed into the Tool constructor call
		glow.widgets.Editor.Toolbar.Button.prototype.activate = function() {
			this.base.activate.apply(this, arguments);
		}
		
		glow.widgets.Editor.Toolbar.Button.prototype.deactivate = function() {
			this.base.deactivate.apply(this, arguments);
		}
		
		glow.widgets.Editor.Toolbar.Button.prototype.enable = function(name) {
			this.base.enable.apply(this, arguments);
		}
		
		glow.widgets.Editor.Toolbar.Button.prototype.disable = function(name) {
			this.base.disable.apply(this, arguments);
		}

		

		/**
			@ignore
			@private
			@name enable_key_listener
			@description	Adds listener onto each button when it has focus.  Listens for a keyup event with the ENTER key.  This allows users to 'press' the button via the keyboard when the button has focus.
		 */
		function enable_key_listener(button) {

			return glow.events.addListener(glow.dom.get(document), 'keyup', function(event){
				if(event.key == 'ENTER') {
					button.press();
					if (event.preventDefault) event.preventDefault();
					return false;
				}
			});



		}

		/* built-in tools here. */		 
		// this is now called on each instance of editor
		function createTools(localeModule) {
			return {
				bold: {
					name : "bold",
					type : "button",
					opts : {
						title:      localeModule.BOLD_TITLE,
						label:      localeModule.BOLD_LABEL,
						tag:		"strong",
						command:    "bold",
						shortcut:   "b",
						action:     function() { tag.call(this.editor.editArea, this.command); return false; }
					}
				},
				italics: {
					name : "italics",
					type : "button",
					opts : {
						title:      localeModule.ITALICS_TITLE,
						label:      localeModule.ITALICS_LABEL,
						tag:		"em",
						command:    "italic",
						shortcut:   "i",
						action:     function() { tag.call(this.editor.editArea, this.command); return false; }
					}
				},
				strike: {
					name : "strike", 
					type : "button", 
					opts : {
						title:      localeModule.STRIKE_TITLE,
						label:      localeModule.STRIKE_LABEL,
						tag:		"strike",
						command:    "strikethrough",
						action:     function() { tag.call(this.editor.editArea, this.command); return false; }
					}
				},

 				/*blockquote: {
					name : "blockquote", 
					type : "button", 
					opts : {
						title:      localeModule.BLOCK_TITLE,
						label:      localeModule.BLOCK_LABEL,
						tag:		"formatblock",
						command:    "<h1>",
						action:     function() { tag.call(this.editor.editArea, this.tag, this.command); return false; }
					}
				},*/

				unorderedlist: {
					name : "unorderedlist",
					type : "button", 
					opts : {
						title:      localeModule.UNORDERED_TITLE,
						label:      localeModule.UNORDERED_LABEL,
						tag:		"ul",
						command:    "insertunorderedlist",
						action:     function() { tag.call(this.editor.editArea, this.command); return false; }
					}
				},
				orderedlist: {
					name : "orderedlist",
					type : "button", 
					opts : {
						title:      localeModule.ORDERED_TITLE,
						label:      localeModule.ORDERED_LABEL,
						tag:		"ol",
						command:    "insertorderedlist",
						action:     function() { tag.call(this.editor.editArea, this.command); return false; }
					}
				},
				formatBlock: {
					name : "formatBlock",
					type : "dropDown", 
					opts : {
						title:      localeModule.FORMATBLOCK_TITLE,
						label:      localeModule.FORMATBLOCK_LABEL,
						tag:		'h1|h2|h3|p',
						action: function() {
							tag.call(this.editor.editArea, "formatblock", "<" + this.overlayMenu.menuItems[this.overlayMenu.selected].tag + ">");
						},
						menuItems: [
							{
								title:      localeModule.HEADINGLEVELONE_TITLE,
								template:	'<li class="heading1">{title}</li>',
								tag:		'h1'

							},
							{
								title:      localeModule.HEADINGLEVELTWO_TITLE,
								template:	'<li class="heading2">{title}</li>',
								tag:		'h2'
							},
							{
								title:      localeModule.HEADINGLEVELTHREE_TITLE,
								template:	'<li class="heading3">{title}</li>',
								tag:		'h3'
							},
							{
								title:      localeModule.NORMAL_TITLE,
								template:	'<li class="normal">{title}</li>',
								tag:		'p',
								selected:	true
							}
						]
					}
				}
				/* tag.call(this.editor.editArea, this.command)
				,
				heading1:{
					name : "heading1", 
					opts : {
						title:      localeModule.HEADING1_TITLE,
						label:      localeModule.HEADING1_LABEL,
						tag:		"Heading1",
						command:    "formatblock",
						action:     function() { tag.call(this.editor.editArea, this.command, 'h1'); return false; }
					}
				},
				toggle: {
					name : "toggle", 
					opts : {
						title:      localeModule.TOGGLE_TITLE,
						label:      localeModule.TOGGLE_LABEL,
						tag:		"toggle",
						command:    "toggle",
						action:     function() { this.editor.editArea.toggle_designMode(); return false; }
					}
				} */
			};
		}

////////

		/**
			@ignore
			@private
			@constructor
			@name glow.widgets.Editor.EditArea
		 */
		glow.widgets.Editor.EditArea = function(editor, opts) {
			opts = opts || {};
			this.editor = editor;
			this.element = $(document.createElement("iframe"));
			this.element.attr('frameBorder', 0);
			this.element.src = "javascript:false";
			this.editor.element.get(".editor-state").append(this.element);
			var that = this;
			setTimeout(
				function() { // For FF
					that.element[0].contentWindow.document.designMode = "on";
					that.contentWindow = that.element[0].contentWindow;
	
					if (that.editor.textarea.val()) {
						that.contentWindow.document.write(that.editor.textarea.val());
					}
					else {
						that.contentWindow.document.write("<p>&nbsp;</p>");
					}
					that.contentWindow.document.close();
					that.editor.iframeFocus = false;
					addKeyboardListener.call(that);
					manageToolbarFocus(that);
					if (glow.env.ie || glow.env.opera) { //TODO: /sigh
						glow.dom.get(that.element[0].contentWindow.document).item(0).attachEvent('onclick', function() { updateArea.call(that); } );
						glow.dom.get(that.element[0].contentWindow.document).item(0).attachEvent('onkeyup', function() { updateArea.call(that); } );
						//glow.dom.get(that.element[0].contentWindow.document).item(0).attachEvent('onmouseup', function() { updateArea.call(that); });
						//events.addListener(that.element[0], 'focus', function () { updateArea.call(that); } );
						//events.addListener(that.element[0].contentWindow, 'blur', function () { updateArea.call(that); } );
					}
					else {
						events.addListener(that.contentWindow.document, 'blur', function () { updateArea.call(that); } );
						events.addListener(that.contentWindow, 'click', function () { updateArea.call(that); } );
						events.addListener(that.contentWindow, 'keyup', function () { updateArea.call(that); } );
					}
					if (glow.env.gecko) {
						that.contentWindow.document.execCommand("styleWithCSS", false, false);
					}
					
					// see Webkit bug related to onbeforeunload and iframes 
					// https://bugs.webkit.org/show_bug.cgi?id=21699
					// http://code.google.com/p/chromium/issues/detail?id=5773
					if (glow.env.webkit) {
						events.addListener(that.element[0].contentWindow, 'beforeunload', function () { that.editor.commit(); return true; } );
						events.addListener(window, 'beforeunload', function () { that.editor.commit(); return true; } );
					}
					
					// Give the toolbar one focusable button
					// Boolean that we use to make sure we only do this once
					that._toolbarInTabIndex = false;
					
					// Listener for when the user clicks on the editor
					glow.events.addListener(
						that.editor.element.get(".editor-state"),
						"click",
						function() {
							addToolbarIntoTabIndex.apply(that);
						},
						that
					);
					
					// Listener for when the user tabs into the iframe
					if (!isNaN(glow.env.ie)) {
						that.contentWindow.attachEvent(
							'onfocus',
							function() {
									addToolbarIntoTabIndex.apply(that);
							},
							that
						);
					}
					else {
						that.contentWindow.addEventListener(
							'focus',
							function() {
									addToolbarIntoTabIndex.apply(that);
							},
							that
						);
					}
	
					if (that.editor.bound) {
						that.idler = new Idler(
							that.contentWindow,
							["mousedown", "keypress"],
							350,
							{
								onFire: function() {
									that.editor._rinse();
								},
								rate: 700
							}
						);
					}
				},
				0
			)
		}

		/**
			@ignore
			@name addToolbarIntoTabIndex
			@description 
		 */
		function addToolbarIntoTabIndex() {
			if (this.editor._toolbarInTabIndex == true) return;
			this.editor.toolbar.element.get('a').item(0).tabIndex = 0;
			this.editor._toolbarInTabIndex = true;
		}

		/**
			@ignore
			@name addKeyboardListener
			@description
			@function
		 */
		function addKeyboardListener() {
			// If ie then use attachEvent with onkeydown
			if (!isNaN(glow.env.ie)) {
				glow.dom.get(this.contentWindow.document).item(0).attachEvent(
					'onkeydown',
					(function(that){
						return function(event){
							event = event || window.event;
							return checkingKeyCombos.call(that, event);
						}
					})(this)
				);
			}
			// If opera then use attachEvent with onkeypress
			else if (!isNaN(glow.env.opera)) {
				glow.dom.get(this.contentWindow.document).item(0).addEventListener(
					'keypress',
						(function(that){
							return function(event){
								event = event || window.event;
								return checkingKeyCombos.call(that, event);
							}
						})(this),
					true
				);
			}
			// Everything else use addEventListener with keydown
			else {

				glow.dom.get(this.contentWindow.document).item(0).addEventListener(
					'keydown', 
					(function(that){
						return function(event){
							event = event || window.event;
							return checkingKeyCombos.call(that, event);
						}
					})(this),
					true
				);
			}
		}

		/**
			@ignore
			@private
			@name checkingKeyCombos
			@description	Handles keyboard combinations
			@function
		 */
		function checkingKeyCombos(event) {

			// Safari on a mac is too screwy to be trusted with this change to tabbing so I'm filtering it out
			if ((navigator.platform.toLowerCase().indexOf('mac') == -1) || isNaN(glow.env.webkit))
			{
				// Set [TAB]+[SHIFT] to tab up the page
					if ((event.keyCode == 9) && (event.shiftKey == true)) {	//console.log('shift up');
						
						// If [TAB]+[SHIFT] then we want to set the focus to the tool in the toolbar that has been set to receive focus (see function 'manageToolbarFocus')
						var arrIcons = glow.dom.get(this.editor.element).get('ul.editor-toolbar-tools a');
						arrIcons.each(function(i) {
							if (arrIcons[i].tabIndex == 0) {
								window.focus(); // This forces the iframe to loose focus, otherwise we end up with two elements on the page responding to keyboard events
								arrIcons[i].focus();
							}
						});
						if (event.preventDefault) event.preventDefault();
						return false;
					}

				// Set [TAB] to tab down the page
					if ( (event.keyCode == 9) ) { //console.log('shift down');
						window.focus(); // This forces the iframe to loose focus, otherwise we end up with two elements on the page responding to keyboard events
						this.element[0].focus(); // This lets gecko loose focus on the iframe
						glow.dom.get(this.editor.element).get('p.endOfEditorCounter').item(0).focus(); // Send the focus to the last element in the editor (this is a paragraph that screen readers will see)
						if (event.preventDefault) event.preventDefault();
						return false;
					}
			}

			// [modifier] plus [toolbar shortcut] key
				if (appliedModifierKey.call(this, event)) {
					if
					(
						( this.editor.toolbar._shortcut(String.fromCharCode(event.keyCode).toLowerCase()) ) ||	// If toolbar shortcut is related to the key being pressed then it returns true
						( String.fromCharCode(event.keyCode).toLowerCase() == 'u' )								// Don't allow [modifier] + [i] (makes text underlined)
					)
					{
						if (event.preventDefault) event.preventDefault();
						return false;
					}
				}
			return true;
		}

		/**
			@ignore
			@private
			@name appliedModifierKey
			@description Returns boolean stating if the modifier key is being pressed
			@function
		 */
		function appliedModifierKey(event) {
			if (navigator.platform.toLowerCase().indexOf('mac') != -1) {
				if (!isNaN(glow.env.opera)) return event.ctrlKey;
				return event.metaKey;
			}
			else {
				return event.ctrlKey;
			}
		}

		/**
			@ignore
			@private
			@name isSafariTwo
			@description	Returns boolean if browser is Safari version 2
			@function
		 */
		function isSafariTwo() {
			if ((glow.env.webkit > 400) && (glow.env.webkit < 500)) {
				return true;
			}
			else {
				return false;
			}
		}

		/**
			@ignore
			@private
			@name moveCursorLeft
			@description	Gives the toolbar a single tabindex, allowing you to tab in and out of the toolbar with cycling through the buttons.  When the toolbar does have focus, move between buttons using the LEFT and RIGHT arrow keys.
		 */
		function manageToolbarFocus(editArea) {
			var left_listener,
				right_listener,
				arrButtons = editArea.editor.toolbar.element.get('a');


			// Add key event listeners whenever the 'buttons' the in the toolbar are in focus
			// NOTE: We could potential use event delegation but right now I'm not too sure
			// how this would work with the browser giving the element focus.
			// When the button has focus...
			glow.events.addListener(
				glow.dom.get(arrButtons),
				'focus',
				function() { // console.log('on');

					// ... swap focus to its siblings if the user presses the LEFT or RIGHT arrow keys
					right_listener = glow.events.addKeyListener('RIGHT', 'down', moveFocusRight);
					left_listener  = glow.events.addKeyListener('LEFT',  'down', moveFocusLeft);

				}
			);

			glow.events.addListener(
				glow.dom.get(arrButtons),
				'blur',
				function() { // console.log('off');

					glow.events.removeListener(right_listener);
					glow.events.removeListener(left_listener);

				}
			);
		}

		/**
			@ignore
			@private
			@name moveCursorLeft
			@description Receives left arrow key down event, passes the previous sibling of the element source to moveCursor function.
		 */
		function moveFocusLeft(event, siblingLinks) {
			moveFocus( getDistantSibling( glow.dom.get(event.source), -1, siblingLinks) );
		}

		/**
			@ignore
			@private
			@name moveCursorRight
			@description Receives right arrow key down event, passes the next sibling of the element source to moveCursor function.
		 */
		function moveFocusRight(event, siblingLinks) {
			moveFocus( getDistantSibling( glow.dom.get(event.source), 1, siblingLinks) );
		}

		/**
			@ignore
			@private
			@name getDistantSibling
			@description  Builds an array of the hyperlinks in the toolbar, sets all their tabIndexes to -1 and then returns either 
			              the next or previous element in the array based on the element passed in as a param
		 */
		function getDistantSibling(elm, move, arrLinks) { // console.log('changing the toolbar');
			arrLinks = arrLinks || getAncestor(glow.dom.get(elm), "ul").get('a');
			//arrLinks = arrLinks || glow.dom.get(elm).parent().parent().parent().get('a');
			
			//feedback(arrLinks.html());
			
			var itemIndexToFocus = 0,
				trueArrayLength  = (arrLinks.length-1);

			// Loop through array...
			arrLinks.each(function(y) {
				// If this item is the passed in element item, then set 'itemIndexTofocus'
				if (this == elm.item(0)) itemIndexToFocus = (y+move);
				// Reset tabIndex
				this.tabIndex = -1;
			});

			// Make sure 'itemIndexToFocus' stays within the bounds of the array length
			if (itemIndexToFocus < 0) itemIndexToFocus = 0;
			if (itemIndexToFocus > trueArrayLength) itemIndexToFocus = trueArrayLength;

			// Return either the next or previous item compared to the element passed in via 'elm' param
			return arrLinks.item(itemIndexToFocus);
		}

		function getAncestor(elm, typeToFind) {
			var x = false;
			while(x == false) {
				if (
					   (elm[0].nodeName.toUpperCase() == typeToFind.toUpperCase())
					|| (elm[0].nodeName == "HTML")
				) {
					x = true;
				}
				elm = elm.parent();
			}
			return elm;			
		}

		/**
			@ignore
			@private
			@name moveCursor
			@description Moves the focus from the focused element, to one of its siblings.  Also manages the tabindex of the toolbar
		 */
		function moveFocus(item) {

			if (typeof item != 'undefined') {
				// Set the tab index of the item that is to gain focus to 0 and give it focus.
				item.tabIndex = 0;
				item.focus();
			}
		}

		/**
			@ignore
			@private
			@name tag
			@description Applies execCommand 
			@function
		 */

		function tag(tagName, attr) { /*debug*///console && console.log("glow.widgets.Editor.EditArea.prototype.tag("+tagName+", "+attr+")");
			attr = attr || null;
			if (this[tagName + "_" + attr]) {
				this[tagName + "_" + attr]();
			}
			else {
				this._domPath();
				this.contentWindow.document.execCommand(tagName, false, attr);
			}
			this.contentWindow.focus();
			updateArea.call(this);
		}
		
		/**
			@ignore
			@private
			@name glow.widgets.Editor.EditArea._getSelected
			@description gets the selected text
			@function
		 */
		glow.widgets.Editor.EditArea.prototype._getSelected = function() { 
			if (glow.env.ie) {
				// IE doesn't use the DOM2 methods for selection and determining range 
				return this.contentWindow.document.selection;
			}
			else {
				return this.contentWindow.getSelection();
			}
		}
		
		/**
			@ignore
			@private
			@name updateArea
			@description Commits the iframe content to the hidden textarea
			@function
		 */
		function updateArea() { /*debug*///console.log("updateArea()")
			this.editor.commit();
			// Update Toolbar
			var currentDomPath = this._domPath();
			if (currentDomPath && currentDomPath != this.editor._lastDomPath) {
				this.editor._lastDomPath = currentDomPath;
				var e = glow.events.fire(this, 'domPathChange', {
					domPath: currentDomPath
				});
				
				if (!e.defaultPrevented()) {
					this.editor.toolbar._update(currentDomPath);
				}
			}
		}
		
// 		glow.widgets.Editor.EditArea.prototype.formatblock_blockquote = function() {
// 			elmPath = this._domPath();
// 			currentTag = elmPath.split("|");
// 			if (currentTag[1] && currentTag[1].toUpperCase() == "BLOCKQUOTE") {
// 				if (glow.env.webkit) { // Webkit doesn't follow the blockquote spec requiring <p> elements
// 					this.contentWindow.document.execCommand("formatblock", false, "<p>");
// 				}
// 				else {
// 					this.contentWindow.document.execCommand("outdent", false, null);
// 					// Need to remove from IE generated code?
// 					// dir=ltr style="MARGIN-RIGHT: 0px"
// 					// style="MARGIN-RIGHT: 0px" dir=ltr
// 				}
// 			}
// 			else {
// 				if (glow.env.ie) { // IE incorrect applies a blockquote instead of an indent, which is good because it doesn't support formatblock(blockquote)
// 					this.contentWindow.document.execCommand("indent", false, null);
// 				}
// 				else if (glow.env.gecko <= 2) { // Oddly ff2 will accept almost any string and make it a new tag
// 					this.contentWindow.document.execCommand("formatblock", false, "blockquote");
// 				}
// 				else {
// 					this.contentWindow.document.execCommand("formatblock", false, "<blockquote>");
// 				}
// 			}
// 		}
		
		/* TODO: Use for later release...
		glow.widgets.Editor.EditArea.prototype.formatblock_h1 = function() {
			this.formatblock_heading("h1");
		}
		glow.widgets.Editor.EditArea.prototype.formatblock_h2 = function() {
			this.formatblock_heading("h2");
		}
		glow.widgets.Editor.EditArea.prototype.formatblock_h3 = function() {
			this.formatblock_heading("h3");
		}
		glow.widgets.Editor.EditArea.prototype.formatblock_h4 = function() {
			this.formatblock_heading("h4");
		}
		glow.widgets.Editor.EditArea.prototype.formatblock_h5 = function() {
			this.formatblock_heading("h5");
		}
		glow.widgets.Editor.EditArea.prototype.formatblock_h6 = function() {
			this.formatblock_heading("h6");
		}
		glow.widgets.Editor.EditArea.prototype.formatblock_p = function() {
			this.formatblock_heading("p");
		}
		glow.widgets.Editor.EditArea.prototype.formatblock_heading = function(lvl) {
			elmPath = this._domPath();
			currentTag = elmPath.split("|");
			if (currentTag[1].toUpperCase() == lvl.toUpperCase()) {
				this.contentWindow.document.execCommand("formatblock", false, "<p>");
			}
			else {
				this.contentWindow.document.execCommand("formatblock", false, "<"+lvl+">");
			}
		}
		glow.widgets.Editor.EditArea.prototype.toggleDesignMode = function() {
			if (this.contentWindow.document.designMode.toLowerCase() == "on") {
				if (glow.env.ie) { //IE resets the document, so...
					cntWin = glow.dom.get(this.editor.editArea.contentWindow.document).get('body').html();
					this.contentWindow.document.designMode = "off";
					this.editor.editArea.contentWindow.document.write(cntWin);
				}
				else {
					this.contentWindow.document.designMode = "off";
				}
			}
			else {
				this.contentWindow.document.designMode = "on";
			}
		} */
		
		/**
			@ignore
			@private
			@name glow.widgets.Editor.EditArea#_domPath
			@description
			@function
			@param {String} name
			@returns {glow.widgets.Editor.Toolbar.Tool}
		 */
		glow.widgets.Editor.EditArea.prototype._domPath = function(elm) {
			elm = elm || this._getSelectedNode();
			var elmBody = glow.dom.get(this.editor.editArea.contentWindow.document).get('body').item(0);
			var trail = "";
			
			if (elm === null) return null;
			
			while (elm.nodeName.toUpperCase() != elmBody.nodeName.toUpperCase()) {
				trail = '<' + elm.nodeName.toLowerCase() + ((elm.getAttribute('style'))? ' style="'+elm.getAttribute('style')+'"' : '') + '>' + trail;
				elm = elm.parentNode;
			}
			
			var cleanTrail = this.editor.cleaner.clean(trail);
			cleanTrail = cleanTrail.replace(/></g, "|").replace(/>/g, "|").replace(/</g, "|");
			cleanTrail = cleanTrail.replace(/\|\/[^\|]+\|/g, "|"); // collapse /named nodes that sometimes appear
			return cleanTrail;
		}

		/**
			@ignore
			@private
			@name glow.widgets.Editor.EditArea#_getSelectedNode
			@description Returns the parent node of the selected text in the edit area
			@function
			@returns {HTML node}
		 */
		glow.widgets.Editor.EditArea.prototype._getSelectedNode = function() { 
			var selected = this._getSelected();
			
			if (!glow.env.ie) {
				if (selected && selected.rangeCount === 0) {
					return null; // selection is not in the editor, can't get any selected node!
				}
				selectedNode = selected.getRangeAt(0).commonAncestorContainer;
				if (selectedNode.nodeType === 3) {
					return selectedNode.parentNode;
				}
				else {
					return selectedNode;
				}
			}
			else { // ie 6
				return selected.createRange().parentElement();
			}
		}
		
		/**
			@ignore
			@private
			@name glow.widgets.Editor.EditArea#_nodeAt
			@description Given a character offset, return the node that character is in.
			Useful for unit testing.
		 */
		glow.widgets.Editor.EditArea.prototype._nodeAt = function(location) {
			var w = this.contentWindow;
			var d = w.document;
			
			var counter = 0;
			var node = d.body;
			
			function walkNode(node, location) {
				if (node.nodeName == "#text") {
					counter += node.nodeValue.length;
					if (counter >= location) {					
						return node.parentNode;
					}
					
				}
				if (node.childNodes) {
					for (var i = 0; i < node.childNodes.length; i++) {
						var foundNode = walkNode(node.childNodes[i], location);
						if (foundNode) return foundNode;
					}
				}
			}
			
			var foundNode = walkNode(node, location);
			return foundNode;
		}
		
		/**
			@ignore
			@private
			@name glow.widgets.Editor.EditArea#_getContent
			@description Get the entire contents of the editArea. This will be in the browser's native format.
		 */
		glow.widgets.Editor.EditArea.prototype._getContent = function() { /*debug*///console.log("glow.widgets.Editor.EditArea#_getContent()");
			return this.contentWindow.document.body.innerHTML;
		}
		
		/**
			@ignore
			@private
			@name glow.widgets.Editor.EditArea#_setContent
			@description Set the entire contents of the editArea. This should be in the browser's native format.
		 */
		glow.widgets.Editor.EditArea.prototype._setContent = function(content) {
			this.contentWindow.document.body.innerHTML = content;
		}

		/**
			@ignore
			@private
			@name glow.widgets.Editor.EditArea#_select
			@description Select the entire contents of the editArea. Useful for unit testing.
		 */
		glow.widgets.Editor.EditArea.prototype._select = function() {
			var el = this.contentWindow;
			el.focus();

			if (glow.env.ie) { // ie, but not opera (faker)
				r = el.document.body.createTextRange();
				r.moveEnd('textedit');
				r.select();
			}
   			else { // moz, saf, opera
   				var r = el.document.createRange();
   				r.selectNodeContents(el.document.body.firstChild.childNodes[0]);
   				
   				var s = el.getSelection();
   				s.removeAllRanges();
   				el.getSelection().addRange(r);
			}
		}
	}
});
