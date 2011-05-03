(window.gloader || glow).module({
	name: "glow.widgets.Panel",
	library: ["glow", "@VERSION@"],
	depends: [[
		"glow", "@VERSION@",
		'glow.dom',
		'glow.events',
		'glow.widgets.Overlay',
		'glow.i18n'
	]],
	builder: function(glow) {
		var dom = glow.dom,
			$ = dom.get,
			$i18n = glow.i18n,
			events = glow.events,
			widgets = glow.widgets,
			Overlay = widgets.Overlay,
			lang = glow.lang,
			env = glow.env,
			defaultTemplate,
			//a hash of themes, true if their images have been preloaded
			themesPreloaded = {},
			accessAddition = '<div class="panelAccess">{END_LABEL}. <a href="#">{TOP_OF_PANEL_LINK}</a><a href="#">{CLOSE_LINK}</a></div>';

		$i18n.addLocaleModule("GLOW_WIDGETS_PANEL", "en", {
			END_LABEL : "End of panel",
			CLOSE_LINK : "Close Panel",
			TOP_OF_PANEL_LINK : "Back to top of panel"
		});
	

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
		 This block outputs CSS rules for IE only directly to the page.
		 It is here so that the path to the PNGs can be deduced from the location of the widgets
		 css file.
		 It is acceptable because this design will not be altered before version 2 of glow, and
		 at that point it will be modified to avoid the use of PNGs.
		 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		if(glow.env.ie) {
			glow.ready(function () {
				var widgetSheet = function (sheets) {
						var i=0,
						len = sheets.length,
						sheet;
						for (; i < len; i++) {
							if (sheets[i].href && sheets[i].href.indexOf("widgets/widgets") != -1) {
								return sheets[i];
							}
							else {
								if (sheets[i].imports.length && (sheet = arguments.callee(sheets[i].imports))) {
									return sheet;
								}
							}
						}
						return false;
					}(document.styleSheets),

					_ieCssRule = function(theme, className, image) {
						return ".glowCSSVERSION-ie .glowCSSVERSION-overlay" + cssPngThemes[theme].className + " ." +
								className + " {background:none;filter:progid:DXImageTransform.Microsoft.AlphaImageLoader(src='" +
								iePngRoot + "/images/" + cssPngThemes[theme].path + "/" + image + ".png', sizingMethod='crop');}";
					},

					cssPngThemes = {
						light : {
							className : " .panel-light",
							path : "lightpanel"
						},
						dark : {
							className : "",
							path : "darkpanel"
						}
					},

					iePngRoot = widgetSheet.href.substring(0, widgetSheet.href.lastIndexOf("/")),

					styleBlock = "<style type='text/css'>";

				for(var thm in cssPngThemes) {
					styleBlock = styleBlock
					+ _ieCssRule(thm, "tr", "ctr")
					+ _ieCssRule(thm, "tl", "ctl")
					+ _ieCssRule(thm, "bl", "cbl")
					+ _ieCssRule(thm, "br", "cbr")
					+ _ieCssRule(thm, "infoPanel-pointerT", "at")
					+ _ieCssRule(thm, "infoPanel-pointerR", "ar")
					+ _ieCssRule(thm, "infoPanel-pointerB", "ab")
					+ _ieCssRule(thm, "infoPanel-pointerL", "al");
				}

				styleBlock = styleBlock + "</style>";

				glow.dom.get("head").append(glow.dom.create(styleBlock));
			});
		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		/*
		PrivateMethod: generateDivString
			generates <div class="{arg}"></div> for 2nd arg onwards if first arg is false.
			generates <div class="{arg}"><div></div></div> for 2nd arg onwards if first arg is true.
		*/
		function generateDivString(nest) {
			var insideDiv = nest ? '<div></div>' : '';
			for (var i = 1, len = arguments.length, r = []; i < len; i++) {
				r[i-1] = '<div class="' + arguments[i] + '">' + insideDiv + '</div>';
			}
			return r.join("");
		}

		/*
		PrivateMethod: closeClick
			Run when one of the panel's close buttons are clicked
		*/
		function closeClick() {
			this.hide();
			return false;
		}

		/*
		PrivateProperty: defaultTemplate
			default template for a panel & infoPanel
		*/
		defaultTemplate = function() {
			var r = [], rLen = 0;
			r[rLen++] = '<div class="glowCSSVERSION-panel">';
				r[rLen++] = '<div class="defaultSkin">';
					r[rLen++] = generateDivString(false, "infoPanel-pointerT", "infoPanel-pointerL", "infoPanel-pointerR");
					r[rLen++] = '<div class="pc">';
						r[rLen++] = generateDivString(false, "tr", "tl");
						r[rLen++] = generateDivString(true, "tb");
						r[rLen++] = '<div class="tc">';
							r[rLen++] = generateDivString(false, "bars");
							r[rLen++] = '<div class="c">';
								r[rLen++] = '<a class="panel-close" href="#" title="close">X</a>';
								r[rLen++] = generateDivString(false, "panel-hd", "panel-bd", "panel-ft");
							r[rLen++] = '</div>';
						r[rLen++] = '</div>';
						r[rLen++] = generateDivString(false, "br", "bl");
						r[rLen++] = generateDivString(true, "bb");
					r[rLen++] = '</div>';
					r[rLen++] = generateDivString(false, "infoPanel-pointerB");
				r[rLen++] = '</div>';
			r[rLen++] = '</div>';
			return r.join("");
		}();
		
		/**
		@name glow.widgets.Panel
		@class
		@description An overlay with default themes and addtional functionality.
			Includes templating system.
		@augments glow.widgets.Overlay
		@see <a href="../furtherinfo/widgets/panel/">Panel user guide</a>

		@param {selector|Element|glow.dom.NodeList} content
			the element that contains the contents of the Panel. If this is
			in the document it will be moved to document.body. If your content node has a child element with class "hd"
			it will be added to the header of the panel. Similarly, an element with class "ft" will be added to the
			footer of the panel.

		@param {Object} opts
			Zero or more of the following as properties of an object:
			@param {Number|String} [opts.width=400] Width of the panel
				Default of 400px gives a content width of 360px in the default template
			@param {String} [opts.theme="dark"] Visual theme
				Only applies when using the default template. Currently supported themes are "dark" and "light".
			@param {String} [opts.template] An html template to use to create the panel
			@param {Boolean} [opts.modal=true] is the overlay modal?
				If true then a default Mask will be created if one is not provided.
			@param {String} [opts.ariaRole="dialog"] The aria role of the panel.
				This is used for accessibility purposes,
				the default is acceptable for panels which interupt the user and should
				be dealt with before interacting with the rest of the page.
			@param {Boolean} [opts.focusOnShow=true] Give the overlay keyboard focus when it appears?
				Use 'returnTo' to specify where to send focus when the overlay closes

		*/
		function Panel(content, opts) {
			content = $(content);
			opts = opts || {};

			if (typeof opts.width == "number") {
				opts.width += 'px';
			}

			if (opts.template) {
				var customTemplate = true;
			}

			//option defaults
			opts = glow.lang.apply({
				template: defaultTemplate,
				width: "400px",
				modal: true,
				theme: "dark",
				ariaRole: "dialog",
				focusOnShow: true
			}, opts);

			//dress content in template
			var fullContent = dom.create(opts.template),
				headContent = content.get("> .hd"),
				footerContent = content.get("> .ft"),
				docBody = document.body,
				that = this,
				fullContentClone,
				i,
				localePanelModule = glow.i18n.getLocaleModule("GLOW_WIDGETS_PANEL"),
				accessLinks = dom.create(accessAddition, {interpolate: setAccessibilityFooter(localePanelModule)});

			/**
			* @name setAccessibilityFooter
			* @private
			* @function
			* @description If the param opts.accessbilityFooter is set then override the i18n label with the contents of the param
			*
			* @param {glow.i18n.getLocaleModule} localePanelModule
			*/
			function setAccessibilityFooter(localePanelModule) {
				if (typeof opts.accessibilityFooter == "string") {
					localePanelModule["END_LABEL"] = opts.accessibilityFooter;
				}
				return localePanelModule;
			}

			if (!customTemplate) {
				fullContent.addClass("panel-" + opts.theme);
				//preload the images of the theme
				if (!themesPreloaded[opts.theme] && docBody.className.indexOf("glowCSSVERSION-basic") == -1) {
					fullContentClone = fullContent.clone().addClass("glowCSSVERSION-panel-preload").appendTo(docBody);
					themesPreloaded[opts.theme] = true;
				}
			}


			/*
				if we've been passed more than one node it's possible the user
				has ommited the container (usually if they're creating the panel
				from a string), let's be kind and deal with that.
			*/
			if (content.length > 1) {
				content.each(function() {
					var elm = $(this);
					if (elm.hasClass("hd")) {
						headContent = elm;
					} else if (elm.hasClass("ft")) {
						footerContent = elm;
					}
				});
			}

			/**
			@name glow.widgets.Panel#header
			@description The panel's header element
			@type glow.dom.NodeList
			*/
			this.header = fullContent.get(".panel-hd");
			/**
			@name glow.widgets.Panel#footer
			@description The panel's footer element
			@type glow.dom.NodeList
			*/
			this.footer = fullContent.get(".panel-ft");
			/**
			@name glow.widgets.Panel#body
			@description The panel's body element
			@type glow.dom.NodeList
			*/
			this.body = fullContent.get(".panel-bd");

			if (content.isWithin(docBody)) {
				fullContent.insertBefore(content);
			} else {
				fullContent.appendTo(docBody);
			}
			this.body.append(content);
			if (headContent.length) {
				this.header.append(headContent);
			} else if (!customTemplate) {
				fullContent.addClass("panel-noHeader");
			}
			if (footerContent.length) { this.footer.append(footerContent); }

			//add listeners for close buttons
			events.addListener(fullContent.get(".panel-close"), "click", closeClick, this);
			events.addListener(accessLinks.get("a").item(1), "click", closeClick, this);

			// accessibility link: give screen reader link to go back to the top of the panel
			events.addListener(accessLinks.get("a").item(0), "click", function() {
				$('.overlay-focalPoint')[0].focus();
			}, this);

			Overlay.call(this, fullContent, opts);

			//apply width
			this.container.css("width", opts.width).
				//add close button to end for accessability
				append(accessLinks);

		}
		lang.extend(Panel, Overlay);

		glow.widgets.Panel = Panel;
	}
});
