t.module("glow.events listeners");

t.test("Simple add, fire and remove", function() {
	t.expect(10);
	var attachTo = {};
	var eventParam1, eventParam2;
	var passedEvent;
	var listener = glow.events.addListener(
		attachTo,
		'trigger',
		function (e) {
			passedEvent = e;
			e.i = 10;
		}
	);
	var e = glow.events.fire(attachTo, 'trigger');
	t.ok(e instanceof glow.events.Event, "generated event is glow.events.Event");

	t.ok(! e.defaultPrevented(), "default is not prevented without call to preventDefault");
	e.preventDefault()
	t.ok(e.defaultPrevented(), "default is prevented after call to preventDefault");

	t.ok(! e.propagationStopped(), "propagation is not stopped without call to stopPropagation");
	e.stopPropagation()
	t.ok(e.propagationStopped(), "propagation is stopped after call to stopPropagation");

	t.equals(passedEvent, e, "event passed to listener is same as that returned from fire");
	t.equals(e.i, 10, "listener called");
	t.ok(glow.events.removeListener(listener), "removeListener returns true when listener removed");
	t.ok(! glow.events.removeListener(listener), "removeListener returns false when listener not removed");
	var e = glow.events.fire(attachTo, 'trigger');
	t.equals(e.i, undefined, "listener called not called after removal");
});

t.test("Shortcutting adding properties to event", function() {
	t.expect(4);
	var attachTo = {};
		
	glow.events.addListener(attachTo, "customEvent", function (event) {
		t.equals(event.hello, "world", "hello property set");
		t.equals(event.foo, "bar", "foo property set");
	});
	
	// first shortcut method
	var event = new glow.events.Event({
		hello : "world",
		foo   : "bar"
	});
	
	glow.events.fire(attachTo, "customEvent", event);
	
	// 2nd shortcut method
	glow.events.fire(attachTo, "customEvent", {
		hello : "world",
		foo   : "bar"
	});
	
});

t.test("Adding to single and multiple dom nodes", function() {
	t.expect(3);
	
	var nodes = glow.dom.create("<div></div><div></div><div></div><div></div>");
	
	var singleNodeListener = glow.events.addListener(nodes[0], "mouseover", function() {});
	var multipleNodeListener = glow.events.addListener(nodes, "click", function() {});
	
	t.ok(typeof singleNodeListener == "number", "Number ID returned for single node listener");
	t.ok(multipleNodeListener instanceof Array, "Array of IDs returned for multiple node listener");
	t.equals(multipleNodeListener.length, 4, "Array is correct length");
});

t.test("Load DOM", function() {
  t.expect(1);
  t.stop();
  glow.ready(function() {
    t.ok(glow.isReady, "Document Ready");
    t.start();
  });
});

t.test("Removing all events from an object / nodelist", function() {
	t.expect(5);
	
	var nodes = glow.dom.create('<div id="eventsTest"><b class="removeEventsPls">Hello</b><b class="removeEventsPls">World</b></div>').appendTo(document.body);
	var objA = {};
	var objB = {};
	var objC = {};
	var eventsFired = [];
	
	glow.events.addListener("#eventsTest b", "fakeEvent", function() {
		eventsFired.push("b");
	});
	
	glow.events.addListener(objA, "fakeEvent", function() {
		eventsFired.push("objA");
	});
	
	glow.events.addListener(objB, "fakeEvent", function() {
		eventsFired.push("objB");
	});
	
	glow.events.addListener(objC, "fakeEvent", function() {
		eventsFired.push("objC");
	});
	
	glow.events.addListener("#eventsTest b", "fakeEvent2", function() {
		eventsFired.push("b2");
	});
	
	glow.events.addListener(objA, "fakeEvent2", function() {
		eventsFired.push("objA2");
	});
	
	glow.events.addListener(objB, "fakeEvent2", function() {
		eventsFired.push("objB2");
	});
	
	glow.events.addListener(objC, "fakeEvent2", function() {
		eventsFired.push("objC2");
	});
	
	t.equals(eventsFired.length, 0, "Events fired");
	
	function fireEvents() {
		eventsFired = [];
		glow.events.fire(glow.dom.get("#eventsTest b")[0], "fakeEvent");
		glow.events.fire(glow.dom.get("#eventsTest b")[1], "fakeEvent");
		glow.events.fire(objA, "fakeEvent");
		glow.events.fire(objB, "fakeEvent");
		glow.events.fire(objC, "fakeEvent");
		glow.events.fire(glow.dom.get("#eventsTest b")[0], "fakeEvent2");
		glow.events.fire(glow.dom.get("#eventsTest b")[1], "fakeEvent2");
		glow.events.fire(objA, "fakeEvent2");
		glow.events.fire(objB, "fakeEvent2");
		glow.events.fire(objC, "fakeEvent2");
	}
	
	fireEvents();
	
	t.isSet(
		eventsFired,
		["b", "b", "objA", "objB", "objC", "b2", "b2", "objA2", "objB2", "objC2"],
		"Obj events fired in order"
	);
	
	glow.events.removeAllListeners("#eventsTest b");
	fireEvents();
	t.isSet(
		eventsFired,
		["objA", "objB", "objC", "objA2", "objB2", "objC2"],
		"Obj events fired in order"
	);
	
	glow.events.removeAllListeners(objA);
	fireEvents();
	t.isSet(
		eventsFired,
		["objB", "objC", "objB2", "objC2"],
		"Obj events fired in order"
	);
	
	glow.events.removeAllListeners([objB, objC]);
	fireEvents();
	t.isSet(
		eventsFired,
		[],
		"All events removed"
	);
	
	// cleanup
	nodes.empty().remove();
});