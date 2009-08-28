t.module("glow.widgets.Carousel");

t.test("Load DOM", function() {
  t.expect(1);
  t.stop();
  glow.ready(function() {
    t.ok(glow.isReady, "Document Ready");
    t.start();
  });
});

t.test("new glow.widgets.Carousel with items", function() {
	t.expect(3);
	
	window.t_carouselul = glow.dom.create("<ul id='carousel'>"
                                               + "<li style='width:40px;height:40px'>one</li>"
                                                + "<li style='width:40px;height:40px'>two</li>"
                                                + "<li style='width:40px;height:40px'>three</li>"
                                                + "<li style='width:40px;height:40px'>four</li>"
                                                + "<li style='width:40px;height:40px'>five</li>"
                                                + "<li style='width:40px;height:40px'>six</li>"
                                               +" </ul>");
	glow.dom.get("body").append(window.t_carouselul);

        
	window.t_carousel = new glow.widgets.Carousel(
			"#carousel",
			{
                            id: "testCarouselID",
                            className: "testCarouselClass",
			    size: 3,
			    step: 1,
			    loop: true
			});
		
	t.equals(t_carousel.items.length, 9, 'Correct list items (3 are clones)')
        t.ok(typeof window.t_carouselul, "The ul with 6 li is defined.");
	t.ok(typeof window.t_carousel, "The carousel is defined.");
       
});

t.test("Carousel has a theme", function() {
	t.expect(1);
	
	var divs = document.body.getElementsByTagName("div");
	var foundTheme = null;

	for (var i = 0, l = divs.length; i < l; i++) {
		if (/carousel-(light|dark)/.test(divs[i].className)){
                    foundTheme = RegExp.$1;               
                }
	}
	
	t.equals(foundTheme, "light", "The default theme is");
});

t.test("Carousel has an id", function() {
	t.expect(1); 
        
	var divs = document.body.getElementsByTagName("div");
	var foundID = null;

	for (var i = 0, l = divs.length; i < l; i++) {
		if (divs[i].id == "testCarouselID"){
                    foundID = divs[i].id;               
                }
	}
	
	t.equals(foundID, "testCarouselID", "The test ID is applied as");
});

t.test("Carousel.visibleIndexes", function() {
	t.expect(2);
	
	t.equals(window.t_carousel.visibleIndexes().length, "3", "The visibleIndex is");
        t.equals(window.t_carousel.visibleIndexes(), "0,1,2", "The visible items indexes are");
});

t.test("Carousel.addItems", function() {
	t.expect(1);
        
        window.t_newitems = glow.dom.create("<ul id='newitems'>"
                                               + "<li style='width:40px;height:40px'>new</li>"
                                               +" </ul>");
	glow.dom.get("body").append(window.t_newitems);
        window.t_carousel.addItems("ul#newitems li");
	t.equals(window.t_carousel.items.length, "10", "The number of items is");


});

t.test("Carousel.removeItem", function() {
	t.expect(1);
	
        window.t_carousel.removeItem(4);
	t.equals(window.t_carousel.items.length, "9", "The number of items is");
});

t.test("Carousel.moveBy", function() {
	t.expect(4);
        
        window.t_carousel.moveBy(1, false);
	t.equals(window.t_carousel.visibleIndexes().length, "3", "The visibleIndex is length after moving forward 1");
	t.equals(window.t_carousel.visibleIndexes(), "1,2,3", "The visible items indexes after moving forward 1");
	
	window.t_carousel.moveBy(-1, false);
	t.equals(window.t_carousel.visibleIndexes().length, "3", "The visibleIndex is length after moving backward 1");
	t.equals(window.t_carousel.visibleIndexes(), "0,1,2", "The visible items indexes after moving backward 1");
});

t.test("Carousel.prev", function() {
	t.stop();
	t.expect(2);      
        
        window.t_carousel.prev();
	
	var eid = glow.events.addListener(window.t_carousel, "afterScroll", function(event) {
	  t.equals(window.t_carousel.visibleIndexes().length, "3", "The visibleIndex is length");
	  t.equals(window.t_carousel.visibleIndexes(), "5,0,1", "The visible items indexes are");
	  t.start();
	  
	  glow.events.removeListener(eid);
	});	
});

t.test("Carousel.next", function() {
	t.stop();
	t.expect(2);
	
        window.t_carousel.next();
	
	var eid = glow.events.addListener(window.t_carousel, "afterScroll", function(event) {
	    t.equals(window.t_carousel.visibleIndexes().length, "3", "The visibleIndex is length");
	    t.equals(window.t_carousel.visibleIndexes(), "0,1,2", "The visible items indexes are");
	    t.start();
	    
	    glow.events.removeListener(eid);
	});
});

t.test("Carousel.moveTo", function() {	
	t.expect(4);
	
        window.t_carousel.moveTo(3, false);
	t.equals(window.t_carousel.visibleIndexes().length, "3", "The visibleIndex is after moving to position 3");
	t.equals(window.t_carousel.visibleIndexes(), "3,4,5", "The visible items indexes after moving to position 3");
	
	window.t_carousel.moveTo(0, false);
	t.equals(window.t_carousel.visibleIndexes().length, "3", "The visibleIndex is after moving to position 0");
	t.equals(window.t_carousel.visibleIndexes(), "0,1,2", "The visible items indexes after moving to position 0");
});


t.test("Carousel has a classname", function() {
	t.expect(1);  
        
	var divs = document.body.getElementsByTagName("div");
	var foundClass = null;

	for (var i = 0, l = divs.length; i < l; i++) {
		if (/testCarouselClass/.test(divs[i].className)){
                    foundClass = "testCarouselClass";              
                }
	}
	
	t.equals(foundClass, "testCarouselClass", "The test Class is applied as");
});

t.test("new glow.widgets.Carousel with 0 items", function() {
	t.expect(2);
	
	window.t_carouselul = glow.dom.create("<ul id='carousel'></ul>");
	glow.dom.get("body").append(window.t_carouselul);

        
	window.t_carousel = new glow.widgets.Carousel(
			window.t_carouselul,
			{
                            id: "testCarouselID",
			    size: 5,
			    step: 2,
			    loop: true
			});
	
        t.ok(typeof window.t_carouselul, "The empty list is defined.");
	t.ok(typeof window.t_carousel, "The carousel is defined.");
});

t.test("Tear down", function() {
	t.expect(2);

	
	glow.dom.get("#testCarouselID").remove();
	window.t_carouselul = undefined;
	window.t_carousel = undefined;

	t.equals(typeof window.t_carouselul , "undefined", "The example list is no longer defined.");
	t.equals(typeof window.t_carousel , "undefined", "The carousel is no longer defined.");

});