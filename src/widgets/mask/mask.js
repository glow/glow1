(window.gloader || glow).module({
	name: "glow.widgets.Mask",
	library: ["glow", "@VERSION@"],
	depends: [[
		"glow", "@VERSION@",
		'glow.dom',
		'glow.events',
		'glow.widgets'
	]],
	builder: function(glow) {
		var dom = glow.dom,
			$ = dom.get,
			events = glow.events,
			widgets = glow.widgets,
			bodyProperties, //this is a holding place for body padding & margins
			htmlStr = '<div class="glowNoMask" style="margin:0;padding:0;position:absolute;width:100%;top:0;left:0;overflow:auto;', //reusable html string
			noScrollContainer,
			// javascript:false stops IE complaining over SSL
			iframeSrc = '<iframe class="glowNoMask" src="javascript:false" style="margin:0;padding:0;position:absolute;top:0;left:0;filter:alpha(opacity=0);display:none"></iframe>';
/**
@name glow.widgets.Mask
@class
@description A semi transparent layer covering the page

Use this if you're wanting to block out the main content of the page.
Anything you want to be on top of the mask needs to have a higher z-index (default: 9990).

<div class="info">Widgets must be called in a <code>glow.ready()</code> call.</div>

@see <a href="../furtherinfo/widgets/mask/">Mask user guide</a>

@param {Object} opts Object containing the attributes specified below.
@param {Number} [opts.opacity=0.7] The opacity of the mask (from 0 to 1).
@param {String} [opts.color=black] The colour of the mask
@param {Function} [opts.onClick] Shortcut to attach an event listener that is called when the user clicks on the mask.
@param {Number} [opts.zIndex=9990] The z-index of mask layer

@example
	var mask = new glow.widget.Mask({
		onClick : function () {
			this.remove();
		}
	});
	mask.add();

*/

/*
Deprecated glow.widgets.Mask() param

@param {Boolean} [opts.disableScroll=false] If set to true, scrolling is disabled in the main document.

This feature is experimental. It works by moving
the document into a new container, offsetting it and setting overflow
to none. Because this adds a new element between body and your document,
you may have problems if your scripts rely on certain elements. Children
of &lt;body> which have class "glowNoMask" will be left as children of
&lt;body>.

*/

/**
    @name glow.widgets.Mask#maskElement
    @type glow.dom.NodeList
    @description The node overlayed to create the mask.
    @example
		//create mask instance
		var myMask = new glow.widgets.Mask();

		//display mask
		myMask.maskElement.css("background", "url(stripe.png)");
 */

		function Mask(opts) {
			this.opts = glow.lang.apply({
				color: '#000',
				opacity: 0.7,
				zIndex: 9900,
				disableScroll: false
			}, opts || {});

			/*
			Property: maskElement
				The node overlayed to create the mask. Access this if you want to
				change its properties on the fly
			*/
			var docBody = document.body,
				mask = this.maskElement = dom.create(
				htmlStr + 'z-index:' + this.opts.zIndex + ';background:' + this.opts.color + ';visibility:hidden"></div>'
			).appendTo(docBody),
				that = this;

			mask.css("opacity", this.opts.opacity);

			if (glow.env.ie < 7) {
				this._iframe = dom.create(iframeSrc).css("z-index", this.opts.zIndex - 1).appendTo(docBody);
			}

			//add mask node click event, route it through to a Mask event
			events.addListener(mask, "click", function() {
				events.fire(that, "click");
			});
			if (this.opts.onClick) {
				events.addListener(this, "click", opts.onClick);
			}
		}

		Mask.prototype = {
			/**
			@name glow.widgets.Mask#add
			@function
			@description Displays the mask.
			@example

				// create the mask
				var myMask = new glow.widgets.Mask();

				// add the mask over the screen
				myMask.add()
			*/
			add: function () {
				var doc = $(document),
					body = $(document.body),
					win = $(window),
					that = this;

				if (this.opts.disableScroll && !noScrollContainer) { //avoid blocking scrolling twice
					noScrollContainer = glow.dom.create(
						htmlStr + 'height:100%;overflow:hidden;">' + htmlStr + '"></div></div>'
					);

					var scrollVals = widgets._scrollPos(),
						bodyStyle = body[0].style,
						clientHeight = win.height(),
						clientWidth = win.width(),
						noScroll = noScrollContainer.get("div"),
						//get children which don't have class "glowNoMask"
						bodyChildren = body.children().filter(function() { return (' ' + this.className + ' ').indexOf("glowNoMask") == -1 });

					bodyProperties = {
						margin: [body.css("margin-top"), body.css("margin-right"), body.css("margin-bottom"), body.css("margin-left")],
						padding: [body.css("padding-top"), body.css("padding-right"), body.css("padding-bottom"), body.css("padding-left")],
						height: body.css("height")
					};

					bodyStyle.margin = bodyStyle.padding = 0;

					bodyStyle.height = "100%";
					noScroll[0].style.zIndex = this.opts.zIndex - 1;

					noScrollContainer.appendTo(body);

					noScroll.css("margin", bodyProperties.margin.join(" ")).
							 css("padding", bodyProperties.padding.join(" ")).
							 css("top", -scrollVals.y - parseFloat(bodyProperties.margin[0]) + "px").
							 css("left", -scrollVals.x + "px").
							 append(bodyChildren);
				}

				function resizeMask() {
					// hide the mask so our measurement doesn't include the mask
					that.maskElement.hide();
					
					var newHeight = that.opts.disableScroll ? noScrollContainer.height() : Math.max( body.height(), win.height() ),
						newWidth  = that.opts.disableScroll ? noScrollContainer.width()  : Math.max( win.width(), doc.width() );
						
					// Work out the required width to set the mask (this is basically the width of the content but without the mask)
					that.maskElement.width(newWidth).height(newHeight);
					
					// resize the iframe if we're using it
					if (that._iframe) {
						that._iframe.width(newWidth).height(newHeight);
					}
					
					// show the mask again
					that.maskElement.show();
				}

				this.maskElement.css("visibility", "visible").css("display", "block");
				if (this._iframe) {
					this._iframe.css("display", "block");
				}
				resizeMask();
				this._resizeListener = events.addListener(window, "resize", resizeMask);
			},
			/**
			@name glow.widgets.Mask#remove
			@function
			@description Removes the mask.
			@example

				// create the mask
				var myMask = new glow.widgets.Mask();

				// add the mask over the screen
				myMask.add()

				// remove the mask from over the screen
				myMask.remove()
			*/
			remove : function () {
				this.maskElement.css("visibility", "hidden").css("display", "none");
				if (this._iframe) {
					this._iframe.css("display", "none");
				}
				events.removeListener(this._resizeListener);

				if (this.opts.disableScroll) {
					var body = $(document.body),
						noScroll = noScrollContainer.children();

					noScroll.children().appendTo(body);
					window.scroll(-parseInt(noScroll.css("left")), -parseInt(noScroll.css("top")));
					noScrollContainer.remove();
					body.css("margin", bodyProperties.margin.join(" ")).
						 css("padding", bodyProperties.padding.join(" ")).
						 css("height", bodyProperties.height);

					delete noScrollContainer;
					noScrollContainer = undefined;
				}

			}
		};

		glow.widgets.Mask = Mask;
	}
});
