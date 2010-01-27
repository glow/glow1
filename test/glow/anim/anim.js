t.module("glow.anim");

t.test("Load DOM", function() {
  t.expect(1);
  t.stop();
  glow.ready(function() {
    t.ok(glow.isReady, "Document Ready");
    t.start();
  });
});

t.test("glow.anim.Animation events", function() {
	t.expect(12);
	var events = glow.events;
	var constructorFrameFired = false;
	var anim = new glow.anim.Animation(1, {
		onStart: function() {
			t.ok(true, "Start fired from constructor");
		},
		onStop: function() {
			t.ok(true, "Stop fired from constructor");
		},
		onResume: function() {
			t.ok(true, "Resume fired from constructor");
		},
		onFrame: function() {
			if (!constructorFrameFired) {
				t.ok(true, "Frame fired from constructor");
			}
			constructorFrameFired = true;
		},
		onComplete: function() {
			t.ok(true, "Complete fired from constructor");
		}
	});
	var frameCount = 0;
	var haveStopped = false;
	
	t.stop();
	
	events.addListener(anim, "start", function() {
		t.ok(true, "Start fired");
	});
	events.addListener(anim, "stop", function() {
		t.ok(true, "Stop fired");
	});
	events.addListener(anim, "resume", function() {
		t.ok(true, "Resume fired");
	});
	events.addListener(anim, "frame", function() {
		frameCount++;
		if (this.position > 0.5 && !haveStopped) {
			t.equals(this.isPlaying(), true, "isPlaying()");
			this.stop();
			haveStopped = true;
			t.equals(this.isPlaying(), false, "isPlaying()");
			this.resume();
		}
	});
	events.addListener(anim, "complete", function() {
		t.ok(true, "Animation completed");
		t.ok(frameCount > 1, "Done " + frameCount + " frames");
		t.start();
	});
	
	anim.start();
});

t.test("glow.anim.Animation goTo", function() {
	t.expect(3);
	var events = glow.events;
	var anim = new glow.anim.Animation(1);
	
	events.addListener(anim, "start", function() {
		t.ok(false, "Start shouldn't fire");
	});
	
	events.addListener(anim, "resume", function() {
		t.ok(true, "Resume fired");
		t.equals(this.position, 0.5, "Position");
		t.equals(this.value, 0.5, "Value");
	});
	
	anim.goTo(0.5).resume();
	anim.stop();
});

t.test("glow.anim.fadeOut fadeOut", function() {
	t.expect(3);
	var events = glow.events;
	var elm = glow.dom.get("#fadeout");
	elm.css("opacity", 1);
	t.stop();
		
	glow.anim.fadeOut(elm, 0.1, {
		onStart: function(){ 
			t.ok(true, "Start fired") 
		}, 
		onComplete: function(){ 
			t.ok(true, "Complete fired"); 
			t.equals(elm.css("opacity"), 0, "Opacity");
			t.start();
		} 
	});
	
});

t.test("glow.anim.fadeIn fadeIn", function() {
	t.expect(3);
	var events = glow.events;
	var elm = glow.dom.get("#fadeout");
	elm.css("opacity", 0);
	t.stop();
		
	glow.anim.fadeIn(elm, 0.1, {
		onStart: function(){ 
			t.ok(true, "Start fired") 
		}, 
		onComplete: function(){ 
			t.ok(true, "Complete fired"); 
			t.equals(elm.css("opacity"), 1, "Opacity");
			t.start();
		} 
	});	
	
});

t.test("glow.anim.highlight highlight", function() {
	t.expect(4);
	var events = glow.events;
	var elm = glow.dom.get("#fadeout");
	t.stop();

	glow.anim.highlight(elm, '', 0.3, {
		onStart: function(){ 
			t.ok(true, "Start fired");
			t.equals(elm.css("background-color"), "transparent", "Highlight Color");
		}, 
		onComplete: function(){ 
			t.ok(true, "Complete fired");
			t.equals(elm.css("background-color"), "rgb(255, 255, 255)", "Complete Color");
			t.start();
		} 
	});
});

t.test("glow.anim.slideUp", function() {
	t.expect(4);
	var events = glow.events;
	var elm = glow.dom.get("#slideup");
	t.stop();

	glow.anim.slideUp(elm, 0.1, {
		onStart: function(){ 
			t.ok(true, "Start fired");
			t.equals(elm.css("height"), "100px", "Start height");
		}, 
		onComplete: function(){ 
			t.ok(true, "Complete fired");
			t.equals(elm.css("height"), "0px", "Completed height");
			t.start();
		} 
	});
});

t.test("glow.anim.slideDown", function() {
	t.expect(4);
	// we need the test to be visible to get correct height readings
	var animTests = glow.dom.get('#animTests').css('display', 'block');
	var elm = glow.dom.get("#slidedown");
	var openHeight = elm.css("height");
	
	elm.css("height", 0).css("overflow", "hidden");
	t.stop();

	glow.anim.slideDown(elm, 0.1, {
		onStart: function(){ 
			t.ok(true, "Start fired");
			t.equals(elm.css("height"), "0px", "Start height");
		}, 
		onComplete: function(){ 
			t.ok(true, "Complete fired");
			t.equals(elm.css("height"), openHeight, "End height");
			animTests.css('display', 'none');
			t.start();
		} 
	});
});

t.test("glow.anim.slideDown (with start height 0 in CSS)", function() {
	t.expect(4);
	// we need the test to be visible to get correct height readings
	var animTests = glow.dom.get('#animTests').css('display', 'block');
	var elm = glow.dom.get("#slidedown2");
	
	t.stop();

	glow.anim.slideDown(elm, 0.1, {
		onStart: function(){ 
			t.ok(true, "Start fired");
			t.equals(elm.css("height"), "0px", "Start height");
		}, 
		onComplete: function(){ 
			t.ok(true, "Complete fired");
			t.equals(elm.css("height"), '100px', "End height");
			animTests.css('display', 'none');
			t.start();
		} 
	});
});

t.test('glow.anim.css background colour', function() {
	t.expect(2);
	t.stop();
	
	var elm = glow.dom.create('<div style="background:#0fa"></div>').appendTo(document.body);
	var myAnim = glow.anim.css(elm, 0.5, {
		'background-color': '#05a'
	}, {
		onComplete: function() {
			t.ok(true, 'animation complete');
			t.start();
		}
	});
	t.ok(myAnim, 'animation created');
	myAnim.start();
});