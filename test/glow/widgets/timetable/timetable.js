(function () {

function arrEquals(ex, ac)
{
	if(ex.length != ac.length)
	{
		console.log("Different lengths : expected " + ex.length + " got " + ac.length);
		console.dir(ac);
		return false;
	}

	var i = ac.length;

	while(i--)
	{
		if (ex[i].valueOf() != ac[i].valueOf())
		{
			console.log("Different at " + i);
			console.dir(ac);
			return false;
		}
	}

	return true;
}

t.module("glow.widgets.Timetable");

t.test("Data construction and querying", function() {
	t.expect(16);

	var myTimetable = new glow.widgets.Timetable(glow.dom.create("<p></p>"), 0, 100, 1, 10, {tracks: [["Peter", 20], ["Paul", 20], ["Mary", 20]]});

	t.equals(myTimetable.tracks.length, 3, "Timetable tracks");
	t.equals(myTimetable.tracks[0].title, "Peter", "1st track title");

	var foo = myTimetable.addTrack("foo", 20, {disabled: true});

	t.equals(myTimetable.tracks.length, 4, "addTrack()");
	t.equals(foo.id, glow.UID + "TimetableWidget4", "Auto-generated id"); // 4 because there are previous tracks
	t.isObj(foo.data, {}, "Tracks have empty data by default");

	var bar = myTimetable.addTrack("bar", 20, {id: "timmy", data: {a: "B"}, items: [["Item 1", 0.1, 0.2], ["Item 2", 0, 0.1], ["Item 3", 0.5, 0.6], ["Item 4", 0.4, 0.5]]});

	t.equals(bar.id, "timmy", "Custom id");
	t.equals(bar.data.a, "B", "Custom data");
	t.equals(bar.itemAt(0.1).title,"Item 1", "itemAt()");

	t.equals(bar.items.length, 4, "number items");

	var myItem1 = bar.addItem("Has Data", 0, 1);
	var myItem2 = bar.addItem("Has Data", 0, 1, {data: {foo: "bar"}});

	t.isObj(myItem1.data, {}, "Items have empty data by default");
	t.equals(myItem2.data.foo, "bar", "Adding arbitrary data to an Item");

	t.equals(foo.disabled, true, "Disabled track");
	t.equals(bar.disabled, false, "Not disabled track");

	t.ok(myTimetable instanceof glow.widgets.Timetable, "Timetable type");
	t.ok(foo instanceof glow.widgets.Timetable.Track, "Track type");
	t.ok(myItem1 instanceof glow.widgets.Timetable.Item, "Item type");

});

t.test("Advanced Querying", function() {
	function _block(type, start, end, viewsstart, viewend, items, error, at0, at1, atmany, rangestart, rangeend)
	{
		var myTimetable = new glow.widgets.Timetable(glow.dom.create("<p></p>"), start, end, viewsstart, viewend);

		var bar = myTimetable.addTrack("foo", 20, {items: items});

		t.equals(bar.items.join(","), "i5,i2,i4,i8,i10,i7,i9,i1,i3,i11,i6", "Adding a track with items (" + type + ")");

		var e;
		try {
			e = bar.itemAt(error);
		} catch(err) {
			e = err.message;
		}
		t.ok(e.indexOf("Cannot get Item(s) - point(s) not in the correct scale type.") == 0, "itemAt with incorrect point type (" + type + ")");

		t.equals(bar.itemAt(at0), undefined, "itemAt at empty point (" + type + ")");
		t.equals(bar.itemAt(at1), "i2", "itemAt at point with several items (" + type + ")");
		t.equals(bar.itemsAt(atmany), "i2,i4,i8,i7,i9", "itemsAt at point with several items (" + type + ")");
		t.equals(bar.itemsInRange(rangestart, rangeend), "i2,i4,i8,i7,i9,i1,i3", "itemsInRange (" + type + ")");

		t.equals(bar.indexAt(at0), undefined, "indexAt at empty point (" + type + ")");
		t.equals(bar.indexAt(at1), "1", "indexAt at point with several items (" + type + ")");
		t.equals(bar.indicesAt(atmany), "1,2,3,5,6", "indicesAt at point with several items (" + type + ")");
		t.equals(bar.indicesInRange(rangestart, rangeend), "1,2,3,5,6,7,8", "indicesInRange (" + type + ")");

		t.equals(bar.items[0].inRange(rangestart, rangeend), false, "Item not in range");
		t.equals(bar.items[2].inRange(rangestart, rangeend), true, "Item in range");
	}

	t.expect(36);

	_block(
	"Dates",
	"01 October 2010 00:00", "01/11/2010 00:00", "01 October 2010 00:00", "02 October 2010 00:00",
	[
		["i1",  "12 October 2010 00:00", "18 October 2010 00:00"],
		["i2",  "06 October 2010 00:00", "18 October 2010 00:00"],
		["i3",  "12 October 2010 00:00", "24 October 2010 00:00"],
		["i4",  "06 October 2010 00:00", "24 October 2010 00:00"],
		["i5",  "04 October 2010 00:00", "08 October 2010 00:00"],
		["i6",  "22 October 2010 00:00", "26 October 2010 00:00"],
		["i7",  "10 October 2010 00:00", "20 October 2010 00:00"],
		["i8",  "06 October 2010 00:00", "20 October 2010 00:00"],
		["i9",  "10 October 2010 00:00", "24 October 2010 00:00"],
		["i10", "06 October 2010 00:00", "10 October 2010 00:00"],
		["i11", "20 October 2010 00:00", "24 October 2010 00:00"]
	],
	23,
	"01 October 2010 00:00",
	"10 October 2010 00:00",
	"10 October 2010 00:00",
	"10 October 2010 00:00", "20 October 2010 00:00"
	);

	_block(
	"Times",
	"10 October 2010 10:00", "10 October 2010 11:00", "10 October 2010 10:12", "10 October 2010 10:18",
	[
		["i1",  "10 October 2010 10:12", "10 October 2010 10:18"],
		["i2",  "10 October 2010 10:06", "10 October 2010 10:18"],
		["i3",  "10 October 2010 10:12", "10 October 2010 10:24"],
		["i4",  "10 October 2010 10:06", "10 October 2010 10:24"],
		["i5",  "10 October 2010 10:04", "10 October 2010 10:08"],
		["i6",  "10 October 2010 10:22", "10 October 2010 10:26"],
		["i7",  "10 October 2010 10:10", "10 October 2010 10:20"],
		["i8",  "10 October 2010 10:06", "10 October 2010 10:20"],
		["i9",  "10 October 2010 10:10", "10 October 2010 10:24"],
		["i10", "10 October 2010 10:06", "10 October 2010 10:10"],
		["i11", "10 October 2010 10:20", "10 October 2010 10:24"]
	],
	23,
	"10 October 2010 10:01",
	"10 October 2010 10:10",
	"10 October 2010 10:10",
	"10 October 2010 10:10", "10 October 2010 10:20"
	);

	_block(
	"Numbers",
	0, 100, 1, 10,
	[
		["i1" , 12, 18],
		["i2" ,  6, 18],
		["i3" , 12, 24],
		["i4" ,  6, 24],
		["i5" ,  4,  8],
		["i6" , 22, 26],
		["i7" , 10, 20],
		["i8" ,  6, 20],
		["i9" , 10, 24],
		["i10",  6, 10],
		["i11", 20, 24]
	],
	"12/01/2009",
	1,
	10,
	10,
	10, 20
	);
});

t.test("Item Content creation", function() {
	t.expect(18);

	var myTimetable = new glow.widgets.Timetable(glow.dom.create("<p></p>"),0, 100, 1, 10,{tracks:[["foo",20,{items:[["item", 0, 1, {data: {foo: "bar"}}]]}]]});

	myTimetable.setItemTemplate("/{title} - {data.foo}/");
	var nodes = myTimetable.tracks[0].items[0].getContent();
	t.equals(nodes.length, 1, "getContent / String / Timetable : one node");
	t.equals(nodes[0].tagName.toLowerCase(), "div", "getContent / String / Timetable : correct tag");
	t.equals(nodes[0].innerHTML, "/item - bar/", "getContent / String / Timetable : correct content");

	myTimetable.setItemTemplate(function(item){return "[" + item.title + ":" + item.title.length + "] " + item.data.foo});
	var nodes = myTimetable.tracks[0].items[0].getContent();
	t.equals(nodes.length, 1, "getContent / function(string) / Timetable : one node");
	t.equals(nodes[0].tagName.toLowerCase(), "div", "getContent / function(string) / Timetable : correct tag");
	t.equals(nodes[0].innerHTML, "[item:4] bar", "getContent / function(string) / Timetable : correct content");

	myTimetable.setItemTemplate(function(item){return glow.dom.create("<span>" + item.title + " / " + item.data.foo + "</span>")});
	var nodes = myTimetable.tracks[0].items[0].getContent();
	t.equals(nodes.length, 1, "getContent / function(nodelist) / Timetable : one node");
	t.equals(nodes[0].tagName.toLowerCase(), "div", "getContent / function(nodelist) / Timetable : correct tag");
	t.equals(nodes[0].innerHTML.toLowerCase(), "<span>item / bar</span>", "getContent / function(nodelist) / Timetable : correct content");

	myTimetable.setItemTemplate(glow.dom.create("<span>flat</span>"));
	var nodes = myTimetable.tracks[0].items[0].getContent();
	t.equals(nodes.length, 1, "getContent / nodelist / Timetable : one node");
	t.equals(nodes[0].tagName.toLowerCase(), "div", "getContent / nodelist / Timetable : correct tag");
	t.equals(nodes[0].innerHTML.toLowerCase(), "<span>flat</span>", "getContent / nodelist / Timetable : correct content");

	myTimetable.setItemTemplate("/error-timetable/");

	myTimetable.tracks[0].setItemTemplate("^{title}^ {data.foo}");
	var nodes = myTimetable.tracks[0].items[0].getContent();
	t.equals(nodes.length, 1, "getContent / String / track : one node");
	t.equals(nodes[0].tagName.toLowerCase(), "div", "getContent / String / track : correct tag");
	t.equals(nodes[0].innerHTML, "^item^ bar", "getContent / String / track : correct content");

	myTimetable.tracks[0].setItemTemplate("/error-track/");

	myTimetable.tracks[0].items[0].setItemTemplate("~{title}~ {data.foo}");
	var nodes = myTimetable.tracks[0].items[0].getContent();
	t.equals(nodes.length, 1, "getContent / String / item : one node");
	t.equals(nodes[0].tagName.toLowerCase(), "div", "getContent / String / item : correct tag");
	t.equals(nodes[0].innerHTML, "~item~ bar", "getContent / String / item : correct content");
});

t.test("Header and Footer Content creation", function() {
	t.expect(12);

	var myTimetable = new glow.widgets.Timetable(glow.dom.create("<p></p>"),0, 100, 1, 10,{tracks:[["foo",20,{items:[["item", 0, 1, {data: {foo: "bar"}}]]}]]});
	myTimetable.setTrackHeaderTemplate("{title} H");
	myTimetable.setTrackFooterTemplate("{title} F");

	var headerNodes = myTimetable.tracks[0].getHeader();
	var footerNodes = myTimetable.tracks[0].getFooter();

	t.equals(headerNodes.length, 1, "header one node");
	t.equals(headerNodes[0].tagName.toLowerCase(), "div", "header correct tag");
	t.equals(headerNodes[0].innerHTML, "foo H", "header correct content");

	t.equals(footerNodes.length, 1, "footer one node");
	t.equals(footerNodes[0].tagName.toLowerCase(), "div", "footer correct tag");
	t.equals(footerNodes[0].innerHTML, "foo F", "footer correct content");

	myTimetable.tracks[0].setTrackHeaderTemplate("{title} TH");
	myTimetable.tracks[0].setTrackFooterTemplate("{title} TF");

	var headerNodes = myTimetable.tracks[0].getHeader();
	var footerNodes = myTimetable.tracks[0].getFooter();

	t.equals(headerNodes.length, 1, "header one node");
	t.equals(headerNodes[0].tagName.toLowerCase(), "div", "header correct tag");
	t.equals(headerNodes[0].innerHTML, "foo TH", "header correct content");

	t.equals(footerNodes.length, 1, "footer one node");
	t.equals(footerNodes[0].tagName.toLowerCase(), "div", "footer correct tag");
	t.equals(footerNodes[0].innerHTML, "foo TF", "footer correct content");
});

t.test("Timetable banding data", function() {
	// banding tests provide segmentaion coverage for scales and scrollbars as well

	t.expect(10);

	var numLine = new glow.widgets.Timetable(glow.dom.create("<p></p>"),0, 100, 1, 10);
	numLine.setBanding(20);
	t.ok(arrEquals([0,20,40,60,80,100], numLine._banding), "numbers / default start");

	numLine.setBanding(20, {start: 10});
	t.ok(arrEquals([10,30,50,70,90,110], numLine._banding), "numbers / custom start");

	numLine.setBanding(function (prev){return ((prev + 1) * 2)});
	t.ok(arrEquals([0, 2, 6, 14, 30, 62, 126], numLine._banding), "function / default start");

	numLine.setBanding(function (prev){return ((prev + 1) * 2)}, {start: 10});
	t.ok(arrEquals([10, 22, 46, 94, 190], numLine._banding), "function / custom start");

	numLine.setBanding([1,5,9]);
	t.ok(arrEquals([1,5,9], numLine._banding), "array");

	var dateLine = new glow.widgets.Timetable(glow.dom.create("<p></p>"), new Date(2009, 0, 5), new Date(2009, 3, 1), new Date(2009, 1, 1), new Date(2009, 2, 1));
	dateLine.setBanding("month");
	t.ok(arrEquals([new Date(2009, 0, 1), new Date(2009, 1, 1), new Date(2009, 2, 1), new Date(2009, 3, 1)], dateLine._banding), "dates / month / auto start");
	dateLine.setBanding("month", {start: new Date(2009,0,10)});
	t.ok(arrEquals([new Date(2009, 0, 10), new Date(2009, 1, 10), new Date(2009, 2, 10), new Date(2009, 3, 10)], dateLine._banding), "dates / month / custom start");

	var dateLine = new glow.widgets.Timetable(glow.dom.create("<p></p>"), new Date(2009, 3, 1), new Date(2012, 0, 1), new Date(2009, 1, 1), new Date(2009, 2, 1));
	dateLine.setBanding("year");
	t.ok(arrEquals([new Date(2009, 0, 1), new Date(2010, 0, 1), new Date(2011, 0, 1), new Date(2012, 0, 1)], dateLine._banding), "dates / year / auto start");

	var dateLine = new glow.widgets.Timetable(glow.dom.create("<p></p>"), new Date(2009, 0, 1), new Date(2009, 0, 2), new Date(2009, 0, 1), new Date(2009, 0, 2));
	dateLine.setBanding(8 * 60 * 60 * 1000);
	t.ok(arrEquals([new Date(2009, 0, 1, 0), new Date(2009, 0, 1, 8), new Date(2009, 0, 1, 16), new Date(2009, 0, 2)], dateLine._banding), "dates / interval / default start");

	dateLine.setBanding(8 * 60 * 60 * 1000, {start: new Date(2009, 0, 1, 2)});
	t.ok(arrEquals([new Date(2009, 0, 1, 2), new Date(2009, 0, 1, 10), new Date(2009, 0, 1, 18), new Date(2009, 0, 2, 2)], dateLine._banding), "dates / interval / custom start");
});

t.test("Timetable scale data", function() {
	// no need to test segmentation options while banding tests provide that coverage

	t.expect(12);

	var numLine = new glow.widgets.Timetable(glow.dom.create("<p></p>"),0, 100, 1, 10);
	numLine.addScale(5,  "top", 1);
	numLine.addScale(10, "bottom", 2);
	numLine.addScale(20, "both", 3);

	numLine.addScale(2,  "left", 4);
	numLine.addScale(4, "right", 5);
	numLine.addScale(25, "right", 6, {id: "foo"});
	numLine.addScale(20, "both", 7);

	t.equals(numLine._primaryScales.length, 4, "correct number of primary scales");
	t.equals(numLine._secondaryScales.length, 5, "correct number of primary scales");

	t.ok(arrEquals([0,5,10,15,20,25,30,35,40,45,50,55,60,65,70,75,80,85,90,95,100], numLine._primaryScales[0].points), "simple segmentation on first primary scale");
	t.equals(numLine._primaryScales[0].size, 1, "correct size on first primary scale");

	t.ok(arrEquals([0,10,20,30,40,50,60,70,80,90,100], numLine._secondaryScales[0].points), "simple segmentation on first secondary scale");
	t.equals(numLine._secondaryScales[0].size, 2, "correct size on first secondary scale");

	t.ok(arrEquals([0,20,40,60,80,100], numLine._primaryScales[1].points), "simple segmentation on second primary scale");
	t.equals(numLine._primaryScales[1].size, 3, "correct size on second primary scale");

	t.ok(arrEquals([0,20,40,60,80,100], numLine._secondaryScales[1].points), "simple segmentation on second secondary scale");
	t.equals(numLine._secondaryScales[1].size, 3, "correct size on second secondary scale");

	t.isObj(numLine._secondaryScales[3].opts, {id: "foo"}, "options passed through");

	try {
		numLine.addScale(20, "both", 8, {id: "foo"});
		t.ok(false, "adding to both with an id");
	} catch(err) {
		t.ok(err.message.indexOf("Cannot apply an id when adding to both sides of the timetable") === 0, "Id error caught");
	}

});

t.test("Timetable scrollbar data", function() {
	// no need to test segmentation options while banding tests provide that coverage

	t.expect(6);

	var numLine = new glow.widgets.Timetable(glow.dom.create("<p></p>"),0, 100, 1, 10);
	numLine.addScrollbar(50,  "top", 1);
	numLine.addScrollbar(55, "bottom", 2);

	t.ok(arrEquals([0,50,100], numLine._primaryScrollbar.points), "correct primary scrollbar points");
	t.equals(numLine._primaryScrollbar.size, 1, "correct primary scrollbar size");
	t.ok(arrEquals([0,55,110], numLine._secondaryScrollbar.points), "correct secondary scrollbar points");
	t.equals(numLine._secondaryScrollbar.size, 2, "correct secondary scrollbar size");

	numLine.addScrollbar(55, "bottom", 3);
	t.equals(numLine._secondaryScrollbar.size, 3, "correct secondary scrollbar after adding another");

	try {
		numLine.addScale(20, "both", 8, {id: "foo"});
		t.ok(false, "adding to both with an id");
	} catch(err) {
		t.ok(err.message.indexOf("Cannot apply an id when adding to both sides of the timetable") === 0, "Id error caught");
	}

});

t.test("Timetable view", function() {
	t.expect(4);

	var numLine = new glow.widgets.Timetable(glow.dom.create("<p></p>"),0, 100, 1, 10);

	t.equals(numLine._view._headerElm[0].className, "timetable-track-headers", "HTML Structure");
	t.equals(numLine._view._accessibiltyElm[0].className, "timetable-accessibility-navigation", "HTML Structure");
	t.equals(numLine._view._stateElm[0].className, "timetable-state", "HTML Structure");
	t.equals(numLine._view._dragAreaElm[0].className, "timetable-dragArea", "HTML Structure");
});


})();