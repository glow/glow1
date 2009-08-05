/**
@name glow.i18n.localePacks.cy
@namespace
@description Welsh Locale Pack for Internationalisation Module.
@requires glow, glow.i18n
@see <a href="#">placeholer</a>
*/
(window.gloader || glow).module({
	name: "glow.i18n.localePacks.cy",
	library: ["glow", "@VERSION@"],
	depends: [["glow", "@VERSION@", "glow.i18n"]],
	builder: function(glow) {
		glow.i18n.addLocalePack("cy", {
			PROPERTIES : {
				LANGUAGE : "Cymraeg"
			},
			GLOW_WIDGETS_PANEL : {
				END_LABEL : "Darfod chan banel",
				CLOSE_LINK : "Caea banel"
			},
			GLOW_WIDGETS_TIMETABLE : {
				ACCESSIBILITY_MENU_START : "Chychwyn",
				ACCESSIBILITY_MENU_END : "Darfod",
				ACCESSIBILITY_INTRO : "Arfer hon ddewislen at ddethol beth adran chan 'r amserlen at golyga.",
				SKIPLINK_TO_TRACK : "chrychneidia at adrywedd data",
				SKIPLINK_BACK_TO_HEADERS : "bacia at adrywedd headers"
			},
			GLOW_WIDGETS_EDITOR : {
				ENTER_MESSAGE  : "Ach am at chofnoda a 'n Abl Destun Golygydd",
				SKIP_LINK_TEXT : "Chrychneidia heibio i",
				LEAVE_MESSAGE  : "Adawaist 'r 'n Abl Destun Golygydd",
	
				BOLD_TITLE : "Eglur",
				BOLD_LABEL : "E",
	
				ITALICS_TITLE : "Italaidd",
				ITALICS_LABEL : "I",
	
				STRIKE_TITLE : "Bwra drwo",
				STRIKE_LABEL : "Bwra"
			},
			GLOW_WIDGETS_CAROUSEL : {
				PREVIOUS: "blaenorol",
				NEXT : "cyfnesaf"
			},
			GLOW_FORMS : {
				TEST_MESSAGE_REQUIRED  : "Brisio gofynnir.",
				TEST_MESSAGE_IS_NUMBER : "Must bod dalm.",
				TEST_MESSAGE_MIN       : "'r brisio must bod o leiaf {arg}.",
				TEST_MESSAGE_MAX       : "'r brisio must bod 'n llai na {arg}.",
				TEST_MESSAGE_RANGE     : "'r brisio must bod {min} ai 'n fwy , a 'n llai na {max}.",
				TEST_MESSAGE_MIN_COUNT : "Must bod ca o leiaf {arg} brisiau.",
				TEST_MESSAGE_MAX_COUNT : "Must bod ca am odiaeth {arg} brisiau.",
				TEST_MESSAGE_COUNT     : "Must ca {arg} brisiau.",
				TEST_MESSAGE_REGEX     : "Must bod i mewn 'r cerydda fformat.",
				TEST_MESSAGE_MIN_LEN   : "Must bod o leiaf {arg} chymeriadau.",
				TEST_MESSAGE_MAX_LEN   : "Must bod am odiaeth {arg} chymeriadau.",
				TEST_MESSAGE_IS_EMAIL  : "Must bod a valid eheba anercha.",
				TEST_MESSAGE_SAME_AS   : "Must bod yr un fel: {arg}",
				TEST_MESSAGE_AJAX      : "gweinyddwr ymatebedig",
				TEST_MESSAGE_IS        : "Must bod {arg}",
				TEST_MESSAGE_IS_NOT    : "Must mo bod {arg}"
			},
			GLOW_EMBED : {
				FLASH_MESSAGE : "Hon bodlona requires Flash Player chyfieithiad {min} ( gorseddedig chyfieithiad : {installed})",
				NO_PLAYER_MESSAGE : "Na Fflachia Flash Player, ai chyfieithiad ydy pre 6.0.0"
			}
		});
		
		glow.i18n.localePacks = glow.i18n.localePacks || {};
		glow.i18n.localePacks.cy = "cy";
	}
});
