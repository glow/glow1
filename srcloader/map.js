/**
	@fileoverview
	@description This file map is for use when loading Glow in its unbuilt 
	source form only. You may want to do this for testing purposes whilst 
	doing work on the source code.
	@example
	
		<script type="text/javascript" src="../../../gloader/src/gloader.js">
			// change the relative paths depending on where your test file is
			gloader.use(
				"glow",
				{
					$base: "../../src",
					map:   "../../srcloader/map.js"
				}
			)
		</script>
		
		<script type="text/javascript">
			// the version id of the unbuilt library is always: @VERSION@
			gloader.load(
				["glow", "@VERSION@", "glow.dom", "glow.events"],
				{
					onLoad: function(glow) {
						// ...
					}
				}
			);
		</script>

*/

gloader.map.add(
	"glow",
	{
		$version: "@VERSION@",
		"glow":                      ["{$base}/glow/glow.js"],
		"glow.dom":                  ["{$base}/dom/dom.js"],
		"glow.events":               ["{$base}/events/events.js"],
		"glow.data":                 ["{$base}/data/data.js"],
		"glow.net":                  ["{$base}/net/net.js"],
		"glow.tweens":               ["{$base}/tweens/tweens.js"],
		"glow.anim":                 ["{$base}/anim/anim.js"],
		"glow.dragdrop":             ["{$base}/dragdrop/dragdrop.js"],
		"glow.embed":                ["{$base}/embed/embed.js"],
		"glow.forms":                ["{$base}/forms/forms.js"],
		"glow.widgets":              ["{$base}/widgets/widgets.js", "{$base}/widgets/widgets.css"],
		"glow.widgets.Mask":         ["{$base}/widgets/mask/mask.js"],
		"glow.widgets.Overlay":      ["{$base}/widgets/overlay/overlay.js"],
		"glow.widgets.Panel":        ["{$base}/widgets/panel/panel.js"],
		"glow.widgets.InfoPanel":    ["{$base}/widgets/infopanel/infopanel.js"],
		"glow.widgets.Sortable":     ["{$base}/widgets/sortable/sortable.js"],
		"glow.widgets.Slider":       ["{$base}/widgets/slider/slider.js"],
		"glow.widgets.AutoSuggest":  ["{$base}/widgets/autosuggest/autosuggest.js"],
		"glow.widgets.AutoComplete": ["{$base}/widgets/autocomplete/autocomplete.js"],
		"glow.widgets.Carousel":     ["{$base}/widgets/carousel/carousel.js"],
		"glow.widgets.Timetable":    ["{$base}/widgets/timetable/timetable.js"],
		"glow.widgets.Editor":       ["{$base}/widgets/editor/editor.js"]
	}
)
		
	