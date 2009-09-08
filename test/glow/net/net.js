t.module("glow.net");

t.test("glow.net.get async", function() {
	if (isLocal) {
		t.expect(5);
	} else {
		t.expect(9);
	}
	
	t.stop();
	
	var getRef = glow.net.get("testdata/xhr/basictext.txt", {
		onLoad: function(response) {
			t.ok(true, "correct callback used");
			if (!isLocal) {
				t.equals(response.status, 200, "Status code");
				t.equals(response.nativeResponse.status, 200, "Native response found");
				t.ok(response.statusText(), "Status returned: " + response.statusText());
				t.equals(response.header("Content-Type"), "text/plain", "Content-Type header");
			}
			t.equals(response.text(), "XHR Test Document", "Returned text");
			t.ok(getRef.completed, "Request completed");
			t.start();
		},
		onError: function() {
			t.ok(false, "correct callback used");
			t.start();
		}
	});
	t.ok(!getRef.completed, "Request not completed");
	
	t.equals(typeof getRef.abort, "function", "Return object has abort method");
});

t.test("glow.net.get sync", function() {
	if (isLocal) {
		t.expect(2);
	} else {
		t.expect(6);
	}
	
	var response = glow.net.get("testdata/xhr/basictext.txt", {
		onLoad: function() {
			t.ok(true, "correct callback used");
		},
		onError: function() {
			t.ok(false, "correct callback used");
		},
		async: false
	});
	if (!isLocal) {
		t.equals(response.status, 200, "Status code");
		t.equals(response.nativeResponse.status, 200, "Native response found");
		t.ok(response.statusText(), "Status returned: " + response.statusText());
		t.equals(response.header("Content-Type"), "text/plain", "Content-Type header");
	}
	t.equals(response.text(), "XHR Test Document", "Returned text");
	
});

t.test("glow.net.get aync header setting", function() {
	t.expect(4);
	t.stop();
	var request = glow.net.get("testdata/xhr/env.shtml", {
		headers: {
			"Custom-Header": "thisisatest",
			"Content-Type": "image/png"
		},
		onLoad: function(response) {
			if (/^<!--#printEnv -->/.test(response.text())) {
				t.start();
				t.skip("This test requires a web server running mod_include in shtml files"); return;
			}
			t.ok(true, "correct callback used");
			t.ok(/REQUEST_METHOD=GET/.test(response.text()), "Using get method");
			t.ok(/HTTP_CUSTOM_HEADER=thisisatest/.test(response.text()), "Custom Header Sent");
			t.ok(/CONTENT_TYPE=image\/png/.test(response.text()), "Content-type Changed");
			t.start();
		},
		onError: function() {
			t.ok(false, "correct callback used");
			t.start();
		}
	});
});

t.test("glow.net.get async xml", function() {
	t.expect(3);
	t.stop();
	var request = glow.net.get("testdata/xhr/xml.xml", {
		onLoad: function(response) {
			t.ok(true, "correct callback used");
			var xml = response.xml();
			t.ok(xml, "xml returned");
			t.equals(xml.getElementsByTagName("foo").length, 3, "3 elements of foo");
			t.start();
		},
		onError: function() {
			t.ok(false, "correct callback used");
			t.start();
		}
	});
});

t.test("glow.net.get async json", function() {
	t.expect(4);
	t.stop();
	var request = glow.net.get("testdata/xhr/json.txt", {
		onLoad: function(response) {
			t.ok(true, "correct callback used");
			var json = response.json();
			t.ok(json, "json returned");
			t.equals(json.hello, "world", "Returned correct value for 'hello'");
			t.equals(json.something, 3, "Returned correct value for 'something'");
			t.start();
		},
		onError: function() {
			t.ok(false, "correct callback used");
			t.start();
		}
	});
});

t.test("glow.net.abort", function() {
	t.expect(2);
	
	t.stop();
	var aborted = true;
	
	var request = glow.net.get("testdata/xhr/large.txt", {
		onLoad: function(response) {
			aborted = false;
		},
		onError: function() {
			aborted = false;
		},
		onAbort: function() {
			t.ok(true, "Abort event fired");
		}
	});
	request.abort();
	
	//wait a moment to be sure
	window.setTimeout(function() {
		t.ok(aborted, "Request aborted");
		t.start();
	}, 1000);
});

t.test("glow.net.post aync string", function() {
	t.expect(3);
	t.stop();
	var request = glow.net.post("testdata/xhr/env.shtml",
		"some=postData&blah=hurrah",
		{
			onLoad: function(response) {
				if (/^<!--#printEnv -->/.test(response.text())) {
					t.start();
					t.skip("This test requires a web server running mod_include in shtml files"); return;
				}
				t.ok(true, "correct callback used");
				t.equals(/REQUEST_METHOD=(\w+)/.exec(response.text())[1], "POST", "Using post method");
				t.equals(/CONTENT_LENGTH=(\d+)/.exec(response.text())[1], "25", "Correct content length");
				t.start();
			},
			onError: function() {
				t.ok(false, "correct callback used");
				t.start();
			}
		}
	);
});

t.test("glow.net.post aync json", function() {
	t.expect(3);
	t.stop();
	var request = glow.net.post("testdata/xhr/env.shtml",
		{some:"postData", blah:["something", "somethingElse"]},
		{
			onLoad: function(response) {
				if (/^<!--#printEnv -->/.test(response.text())) {
					t.start();
					t.skip("This test requires a web server running mod_include in shtml files"); return;
				}
				t.ok(true, "correct callback used");
				t.equals(/REQUEST_METHOD=(\w+)/.exec(response.text())[1], "POST", "Using post method");
				t.equals(/CONTENT_LENGTH=(\d+)/.exec(response.text())[1], "47", "Correct content length");
				t.start();
			},
			onError: function() {
				t.ok(false, "correct callback used");
				t.start();
			}
		}
	);
});

t.test("glow.net.get defering and multiple load events", function() {
	t.expect(2);
	t.stop();
	var loadCallbacks = 0;
	
	var request = glow.net.get("testdata/xhr/basictext.txt", {
		onLoad: function() {
			t.ok(true, "Option load event fired");
			if (++loadCallbacks == 2) {
				t.start();
			}
		},
		onError: function() {
			t.ok(false, "Request failed");
		},
		defer: true
	});
	
	//wait a moment, let's see if the request has really defered
	window.setTimeout(function() {
		glow.events.addListener(request, "load", function() {
			t.ok(true, "addListener load event fired");
			if (++loadCallbacks == 2) {
				t.start();
			}
		});
		request.send();
	}, 3000);
});

t.test("glow.net.get defering and multiple error events", function() {
	t.expect(2);
	t.stop();
	var errorCallbacks = 0;
	
	var request = glow.net.get("testdata/xhr/no_such_file", {
		onLoad: function() {
			t.ok(false, "Option load event fired");
		},
		onError: function() {
			t.ok(true, "Option error event fired");
			if (++errorCallbacks == 2) {
				t.start();
			}
		},
		defer: true
	});
	
	//wait a moment, let's see if the request has really defered
	window.setTimeout(function() {
		glow.events.addListener(request, "error", function() {
			t.ok(true, "addListener error event fired");
			if (++errorCallbacks == 2) {
				t.start();
			}
		});
		request.send();
	}, 3000);
});


//the following tests need mod_rewrite and mod_headers. Test for them
function testForRewriteAndHeaders(successCallback) {
	glow.net.get("testdata/xhr/testrewrite", {
		onLoad: function(response) {
			if (response.header("X-headertest") == "true") {
				successCallback();
			} else {
				t.start();
				t.skip("mod_headers not enabled"); return;
			}
		},
		onError: function() {
			t.start();
			t.skip("mod_rewrite / htaccess not enabled"); return;
		}
	});
}

//test redirects
for (var i = 1; i < 5; i++) {
	if (i == 4) i = 7;
	(function(i) {
		t.test("glow.net.get redirect 30" + i, function() {
			t.expect(2);
			t.stop();
			testForRewriteAndHeaders(function() {
				glow.net.get("testdata/xhr/30" + i, {
					onLoad: function(response) {
						t.ok(true, "onLoad called");
						t.equals(response.text(), "XHR Test Document", "File returned");
						t.start();
					},
					onError: function(response) {
						t.ok(false, "onLoad called");
						t.equals(response.text(), "XHR Test Document", "File returned");
						t.start();
					}
				});
			})
		});
	})(i);
}

//timeouts
t.test("glow.net.get timeout cancelling", function() {
	t.expect(2);
	t.stop();
	
	var noError = true;
	
	glow.net.get("testdata/xhr/basictext.txt", {
		onLoad: function() {
			t.ok(true, "load called");
		},
		onError: function() {
			noError = false;
		},
		timeout: 2
	});
	
	window.setTimeout(function () {
		t.ok(noError, "onError not called")
		t.start();
	}, 3000);
});

//xml with namespace

//get rid of all the script elements from end of the page
function clearScriptsFromEnd() {
	while (document.body.lastChild.nodeName.toLowerCase() == "script") {
		document.body.removeChild(document.body.lastChild);
	}
}

t.test("glow.net.loadScript general", function() {
	clearScriptsFromEnd();
	t.expect(3);
	t.stop();
	var timeoutCancelled = true;
	
	glow.net.loadScript("testdata/xhr/jsoncallback.js?callback={callback}", {
		onLoad: function(data) {
			t.ok(true, "Callback called");
			t.equals(data.hello, "world", "Data passed");
		},
		onError: function() {
			timeoutCancelled = false;
		},
		timeout: 2
	});
	
	window.setTimeout(function () {
		t.ok(timeoutCancelled, "onError not called")
		t.start();
	}, 3000);
});

t.test("glow.net.loadScript timeout and charset", function() {
	clearScriptsFromEnd();
	t.expect(3);
	t.stop();
	
	var onLoadCalled = false;
	
	//this script doesn't actually callback, so it'll timeout
	glow.net.loadScript("testdata/xhr/loadscriptfail.js?callback={callback}", {
		onLoad: function(data) {
			onLoadCalled = true;
		},
		onError: function() {
			t.ok(!onLoadCalled, "onLoad not called");
			t.ok(true, "onError called");
			t.start();
		},
		timeout: 2,
		charset: "utf-8"
	});
	
	t.equals(glow.dom.get(document.body.lastChild).attr("charset"), "utf-8", "Charset set");
});

t.test("glow.net.loadScript aborting", function() {
	clearScriptsFromEnd();
	t.expect(3);
	t.stop();
	var onLoadCalled = false;
	var onErrorCalled = false;
	var onAbortCalled = false;
	
	var request = glow.net.loadScript("testdata/xhr/jsoncallback.js?callback={callback}", {
		onLoad: function(data) {
			onLoadCalled = true;
		},
		onError: function() {
			onErrorCalled = true;
		},
		onAbort: function() {
			onAbortCalled = true;
		},
		timeout: 2
	});
	if (request.completed) {
		t.skip("Request complete, too late to abort"); return;
	}
	request.abort();
	
	window.setTimeout(function () {
		t.ok(!onLoadCalled, "onLoad not called");
		t.ok(!onErrorCalled, "onError not called");
		t.ok(onAbortCalled, "onAbort called");
		t.start();
	}, 3000);
})
