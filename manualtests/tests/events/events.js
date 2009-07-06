
(function () {
	var eventCounter = 0;
	var clickListener;
	registerTestCase(
		new ManualTestCase({
			name: 'click event',
			setup: function () {
				if (window.location.hash && window.location.hash.length > 1) {
					alert("test requires no fragment on url, removing " + window.location.hash);
					window.location.hash = '';
					return false;
				}
				clickListener = glow.events.addListener(
					this.container.get("a.click")[0],
					"click",
					function () {
						eventCounter++;
						return false;
					}
				);
			},
			reset: function () {
				eventCounter = 0;
				glow.events.removeListener(clickListener);
			},
			check: function () {
				this.diag("checking event handler was called");
				if (eventCounter != 1) { throw "event called " + eventCounter + " time(s) - expected 1"; }
				this.diag("checking no fragment on url");
				if (window.location.hash.length > 1) { throw "url has # - return false does not prevent default action"; }
			}
		})
	);

})();


(function () {
	var eventCounter = 0;
	var clickListener;
	var controlListener;
	var clicks = 0;
	registerTestCase(
		new ManualTestCase({
			name: 'remove handler',
			setup: function () {
				clickListener = glow.events.addListener(
					this.container.get("a.click")[0],
					"click",
					function () {
						eventCounter++;
						glow.events.removeListener(clickListener);
						return false;
					}
				);
				controlListener = glow.events.addListener(
					this.container.get("a.click")[0],
					"click",
					function () {
						clicks++;
						return false;
					}
				);
			},
			reset: function () {
				eventCounter = 0;
				clicks = 0;
				glow.events.removeListener(clickListener);
				glow.events.removeListener(controlListener);
			},
			check: function () {
				this.diag("checking link was clicked twice");
				if (clicks != 2) { throw "link was clicked " + clicks + " time(s)"; }
				this.diag("checking event handler was called once and only once");
				if (eventCounter != 1) { throw "event called " + eventCounter + " time(s) - expected 1"; }
			}
		})
	);

})();

(function () {
	var clickListener, mouseUpListener, mouseDownListener;
	var buttonsClicked = [];
	registerTestCase(
		new ManualTestCase({
			name: 'mouse buttons',
			setup: function () {
				clickListener = glow.events.addListener(
					this.container.get("a.click")[0],
					"click",
					function () { return false; }
				);
				mouseDownListener = glow.events.addListener(
					this.container.get("a.click")[0],
					"contextmenu",
					function () { return false; }
				);
				mouseUpListener = glow.events.addListener(
					this.container.get("a.click")[0],
					"mouseup",
					function (e) {
						buttonsClicked[buttonsClicked.length] =
							e.button == 0 ? 'left' :
							e.button == 1 ? 'middle' :
							e.button == 2 ? 'right' :
								'unknown';
						return false;
					}
				);
			},
			reset: function () {
				eventCounter = 0;
				glow.events.removeListener(clickListener);
				glow.events.removeListener(mouseUpListener);
				glow.events.removeListener(mouseDownListener);
				buttonsClicked = [];
			},
			check: function () {
				this.diag("checking for three clicks");
				if (buttonsClicked.length != 3) { throw "expected 3 button clicks, but only got " + buttonsClicked.length; }
				this.diag("checking left button pressed first");
				if (buttonsClicked[0] != 'left') { throw "expected first button click to be the left button, got " + buttonsClicked[0]; }
				this.diag("checking middle button pressed second");
				if (buttonsClicked[1] != 'middle') { throw "expected second button click to be the middle button, got " + buttonsClicked[0]; }
				this.diag("checking right button pressed third");
				if (buttonsClicked[2] != 'right') { throw "expected third button click to be the right button, got " + buttonsClicked[0]; }
			}
		})
	);

})();

(function () {
	var wheelListener;
	var movements = [];
	registerTestCase(
		new ManualTestCase({
			name: 'mouse wheel on document',
			setup: function () {
				wheelListener = glow.events.addListener(
					document,
					"mousewheel",
					function (e) {
						movements[movements.length] = e.wheelDelta;
					}
				);
			},
			reset: function () {
				movements = [];
				glow.events.removeListener(wheelListener);
			},
			check: function () {
				this.diag("checking for two wheel movements");
				if (movements.length != 2) { throw "found " + movements.length + " wheel movement(s) (expected 2)"; }
				this.diag("checking first movement was up one click");
				if (movements[0] != 1) { throw "first movement was " + movements[0] + " (expected 1)"; }
				if (movements[1] != -1) { throw "second movement was " + movements[1] + " (expected -1)"; }
			}
		})
	);

})();

(function () {
	var upWheelListener, downWheelListener;
    var upAmount = 0;
	var downAmount = 0;
	registerTestCase(
		new ManualTestCase({
			name: 'mouse wheel on element',
			setup: function () {
				upWheelListener = glow.events.addListener(
					this.container.get("#mouse-wheel-up")[0],
					"mousewheel",
					function (e) {
							upAmount += e.wheelDelta;
					}
				);
				downWheelListener = glow.events.addListener(
					this.container.get("#mouse-wheel-down")[0],
					"mousewheel",
					function (e) {
							downAmount += e.wheelDelta;
					}
				);
			},
			reset: function () {
				upAmount = 0;
				downAmount = 0;
				glow.events.removeListener(upWheelListener);
				glow.events.removeListener(downWheelListener);
			},
			check: function () {
				this.diag("checking wheelDelta for up");
				if (upAmount != 1) { throw "wheelDelta for up was " + upAmount + " (expected 1)"; }
				this.diag("checking wheelDelta for down");
				if (downAmount != -1) { throw "wheelDelta for down was " + downAmount + " (expected -1)"; }
			}
		})
	);

})();


(function () {
	var enterListener, leaveListener, overRelatedTarget, outRelatedTarget;
	registerTestCase(
		new ManualTestCase({
			name: 'mouseover and mouseout',
			setup: function () {
				enterListener = glow.events.addListener(
					glow.dom.get("#overout-top"),
					"mouseover",
					function (e) {
						overRelatedTarget = e.relatedTarget;
					}
				);

				leaveListener = glow.events.addListener(
					"#overout-top",
					"mouseout",
					function (e) {
						outRelatedTarget = e.relatedTarget;
					}
				);

			},
			reset: function () {
				glow.events.removeListener(enterListener);
				glow.events.removeListener(leaveListener);
				overRelatedTarget = null;
				outRelatedTarget = null;
			},
			check: function () {
				this.diag("checking related target for mouseover");
				if (overRelatedTarget != glow.dom.get("#overout-bottom")[0]) { throw "incorrect relatedTarget for mouseover: " + overRelatedTarget; }
				this.diag("checking related target for mouseout");
				if (outRelatedTarget != glow.dom.get("#overout-bottom")[0]) { throw "incorrect relatedTarget for mouseout: " + outRelatedTarget; }
			}
		})
	);
})();


(function () {
	var keypressListener, keyupListener, keydownListener;
	registerTestCase(
		new ManualTestCase({
			name: 'simple keypresses',
			userResult : true,
			setup: function () {
				keypressListener = glow.events.addListener(
					document,
					"keypress",
					function (e) {
						glow.dom.get('#key-pressed h3').addClass('fired');
						setTimeout(function () { glow.dom.get('#key-pressed h3').removeClass('fired'); }, 0.5);
						var container = glow.dom.get('#key-pressed');
						container.get(".charCode").text(e.charCode || '');
						container.get(".char").text(e.chr ? '"' + e.chr + '"' : '');
						container.get(".keyCode").text(e.keyCode || '');
						container.get(".key").text(e.key || '');
						return false;
					}
				 );
				 keydownListener = glow.events.addListener(
					document,
					"keydown",
					function (e) {
						glow.dom.get('#key-down h3').addClass('fired');
						setTimeout(function () { glow.dom.get('#key-down h3').removeClass('fired'); }, 0.5);
						var container = glow.dom.get('#key-down');
						container.get(".charCode").text(e.charCode || '');
						container.get(".chr").text(e.chr ? '"' + e.chr + '"' : '');
						container.get(".keyCode").text(e.keyCode || '');
						container.get(".key").text(e.key || '');
						if (e.key) {
							return false;
						}
					}
				 );
				 keyupListener = glow.events.addListener(
					document,
					"keyup",
					function (e) {
						glow.dom.get('#key-up h3').addClass('fired');
						setTimeout(function () { glow.dom.get('#key-up h3').removeClass('fired'); }, 0.5);
						var container = glow.dom.get('#key-up');
						container.get(".charCode").text(e.charCode || '');
						container.get(".chr").text(e.chr ? '"' + e.chr + '"' : '');
						container.get(".keyCode").text(e.keyCode || '');
						container.get(".key").text(e.key || '');
						if (e.key) {
							return false;
						}
					}
				 );
			},
			reset: function () {
				glow.events.removeListener(keypressListener);
				glow.events.removeListener(keyupListener);
				glow.events.removeListener(keydownListener);
				glow.dom.get('#key-press').text("");
				glow.dom.get('#key-up').text("");
				glow.dom.get('#key-down').text("");
			}
		})
	);
})();

(function () {
	var events = [];
	var combos = [
		{ text: 'a', chr: 'a', shift: false, ctrl: false, alt: false, capsLock: false },
		{ text: 'B (caps-lock off)', specifier: 'B', chr: 'B', shift: true,  ctrl: false, alt: false, capsLock: false },
		{ text: 'SHIFT+c (caps-lock on)', specifier: 'SHIFT+c', chr: 'c', shift: true,  ctrl: false, alt: false, capsLock: true },
		{ text: 'ALT+SHIFT++', chr: '+', shift: true, ctrl: false, alt: true, capsLock: undefined },
		{ text: 'CTRL+D', chr: 'D', shift: true, ctrl: true, alt: false, capsLock: false },
		{ text: 'SHIFT+CTRL+e', chr: 'E', shift: true, ctrl: true, alt: false, capsLock: false }
	];
	var keys = function (obj) {
		var keys = [];
		for (var i in obj) {
			keys[keys.length] = i;
		}
		return keys;
	};

	if (!Array.prototype.map) {
		Array.prototype.map = function(fun /*, thisp*/) {
			var len = this.length;
			if (typeof fun != "function")
				throw new TypeError();
			var res = new Array(len);
			var thisp = arguments[1];
			for (var i = 0; i < len; i++) {
				if (i in this)
					res[i] = fun.call(thisp, this[i], i, this);
			}
			return res;
		};
	}
	
	var keysPressed = [];
	registerTestCase(
		new ManualTestCase({
			name: 'key manager',
			setup: function () {
				this.container.get(".test-steps").html(
					combos.map(function (combo) { return "<li>Type: " + combo.text + "</li>";  }).join("")
				);
				for (var i = 0, len = combos.length; i < len; i++) {
					events[events.length] = glow.events.addKeyListener(
						combos[i].specifier || combos[i].text,
						'press',
						function (e) {
							keysPressed[keysPressed.length] = {
								chr:     e.chr,
								shift:    e.shiftKey,
								ctrl:     e.ctrlKey,
								alt:      e.altKey,
								capsLock: e.capsLock
							};
						}
					);
				}
			},
			reset: function () {
				for (var i = 0, len = events.length; i < len; i++) {
					glow.events.removeListener(events[i]);
				}
				events = [];
				keysPressed = [];
			},
			check: function () {
				for (var i = 0, len = combos.length; i < len; i++) {
					this.diag("checking keypress " + combos[i].text);
					if (! keysPressed[i]) {
						throw "expected " + combos.length + " key presses, found " + keysPressed.length;
					}
				    for (var j in { chr: 1, ctrl: 1, shift: 1, alt: 1, capsLock: 1 }) {
						if (combos[i][j] != keysPressed[i][j]) {
							throw combos[i].text + ": expected " + j + " to be " + combos[i][j] + ", found " + keysPressed[i][j];
						}
					}
				}
			}
		})
	);
})();

attachTests();
