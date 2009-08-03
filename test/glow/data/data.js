t.module("glow.data");

t.test("glow.data.encodeJson", function() {
	t.expect(7);

	t.equals(glow.data.encodeJson({a: "a", b: 1}),
			'{"a":"a","b":1}',
			"Encode 1 level");
	t.equals(glow.data.encodeJson({a: "a", b: 1, c:{x: 7, y: 9, z: 9}}),
			'{"a":"a","b":1,"c":{"x":7,"y":9,"z":9}}',
			"Encode 2 levels object");
	t.equals(glow.data.encodeJson({a: "a", b: 1, c:{x: 7, y: 9, z: 9}, d: [1,2,3,4,5,6,7,8,9,0]}),
			'{"a":"a","b":1,"c":{"x":7,"y":9,"z":9},"d":[1,2,3,4,5,6,7,8,9,0]}',
			"Encode 2 levels mixed");
	t.equals(glow.data.encodeJson({a: {a: {a: {a: 1}}},b: {b: {b: {b: 1}}}, c: {c: {c: {c: 1}}}}),
			'{"a":{"a":{"a":{"a":1}}},"b":{"b":{"b":{"b":1}}},"c":{"c":{"c":{"c":1}}}}',
			"Encode multi level");
	t.equals(glow.data.encodeJson({a: "\b\n\r\t\f\"\\"}),
			'{"a":"\\b\\n\\r\\t\\f\\\"\\\\"}',
			"Encode Adds slashes");

	try {
		var j = glow.data.encodeJson(1);
		t.ok(false, "Primitive is not Json");
	} catch(e) {
		t.ok(true, "Primitive is not Json");
	}

	try {
		var j = glow.data.encodeJson({a: function(){}});
		t.ok(false, "Json can't contain a function");
	} catch(e) {
		t.ok(true, "Json can't contain a function");
	}
});

t.test("glow.data.decodeJson", function() {
	t.expect(8);

	var t1 = glow.data.decodeJson('{"a":"a","b":1}');
	t.equals([t1.a, t1.b].join(":"),
			"a:1",
			"Decode 1 level");

	var t2 = glow.data.decodeJson('{"a":"a","b":1,"c":{"x":7,"y":8,"z":9}}');
	t.equals([t2.a, t2.b, t2.c.x, t2.c.y, t2.c.z].join(":"),
			"a:1:7:8:9",
			"Decode 2 levels object");

	var t3 = glow.data.decodeJson('{"a":"a","b":1,"c":{"x":7,"y":8,"z":9},"d":[1,2,3,4,5,6,7,8,9,0]}');
	t.equals([t3.a, t3.b, t3.c.x, t3.c.y, t3.c.z, t3.d[0], t3.d[1], t3.d[2], t3.d[3], t3.d[4], t3.d[5], t3.d[6], t3.d[7], t3.d[8], t3.d[9]].join(":"),
			"a:1:7:8:9:1:2:3:4:5:6:7:8:9:0",
			"Decode 2 levels mixed");

	var t4 = glow.data.decodeJson('{"a":{"a":{"a":{"a":1}}},"b":{"b":{"b":{"b":2}}},"c":{"c":{"c":{"c":3}}}}');
	t.equals([t4.a.a.a.a, t4.b.b.b.b, t4.c.c.c.c].join(":"),
			"1:2:3",
			"Decode multi level");

	var t5 = glow.data.decodeJson('{"a":"\\b\\n\\r\\t\\f\\\"\\\\"}');
	t.equals(t5.a,
			"\b\n\r\t\f\"\\",
			"Decode removes slashes");

	try {
		var j = glow.data.decodeJson('{"a": function(){}}', {safeMode: true});
		t.ok(false, "Unsafe Json can't contain a function");
	} catch(e) {
		t.ok(true, "Unsafe Json can't contain a function");
	}

	try {
		var j = glow.data.decodeJson('foo:bar');
		t.ok(false, "Json must be valid");
	} catch(e) {
		t.ok(true, "Json must be valid");
	}

	try {
		var j = glow.data.decodeJson({a:1});
		t.ok(false, "Json must be a string");
	} catch(e) {
		t.ok(true, "Json must be a string");
	}
});

t.test("glow.data.encodeUrl", function() {
	t.expect(5);

	t.equals(glow.data.encodeUrl({a: "a", b: 1}),
			'a=a&b=1',
			"Encode 1 level");
	t.equals(glow.data.encodeUrl({a: "a", b: [1,2]}),
			'a=a&b=1&b=2',
			"Encode 2 levels mixed");

	try {
		var u = glow.data.encodeUrl({a: "a", b: 1, c:{x: 7, y: 9, z: 9}});
		t.ok(false, "URLs can be only one level");
	} catch(e) {
		t.ok(true, "URLs can be only one level");
	}

	try {
		var u = glow.data.encodeUrl([1,2,3,4]);
		t.ok(false, "URLs cannot be arrays");
	} catch(e) {
		t.ok(true, "URLs cannot be arrays");
	}

	try {
		var u = glow.data.encodeUrl(10);
		t.ok(false, "URLs cannot be primitives");
	} catch(e) {
		t.ok(true, "URLs cannot be primitives");
	}
});

t.test("glow.data.decodeUrl", function() {
	t.expect(5);

	var t1 = glow.data.decodeUrl("a=a&b=1");
	t.equals([t1.a, t1.b].join(":"),
			"a:1",
			"Decode 1 level");

	var t2 = glow.data.decodeUrl("a=a&b=1&b=2");
	t.equals([t2.a, t2.b[0], t2.b[1]].join(":"),
			"a:1:2",
			"Decode 2 levels");
	try {
		var u = glow.data.decodeUrl({a:1});
		t.ok(false, "Input must be a string");
	} catch(e) {
		t.ok(true, "Input must be a string");
	}

	try {
		var u = glow.data.decodeUrl("foo");
		t.ok(false, "URLs must be well formed");
	} catch(e) {
		t.ok(true, "URLs must be well formed");
	}
	
	// http://glow-project.lighthouseapp.com/projects/33663-glow/tickets/16
	// Ensure it works with ; seperators
	var data = glow.data.decodeUrl("BBC-UID=abc123; foo=Domestic; bar=+acv+ba; helloworld=-99");
	var obj = {
		"BBC-UID": "abc123",
		"foo": "Domestic",
		"bar": "+acv+ba",
		"helloworld": "-99"
	}
	t.isObj(data, obj, "Correct decoding with ;");
});





