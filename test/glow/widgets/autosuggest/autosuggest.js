t.module("glow.widgets.AutoSuggest");

t.test("Load DOM", function() {
  t.expect(1);
  t.stop();
  glow.ready(function() {
    t.ok(glow.isReady, "Document Ready");
    t.start();
  });
});

t.test("Set up", function() {
	t.expect(1);
	
	window.tempContainer = glow.dom.create('<div><div><input type="text" id="example"/></div></div>').appendTo("#mainOutput");
	/*1*/ t.ok(glow.dom.get("#example"), "A test form element can be created.");
});

t.test("glow.widgets.AutoSuggest", function() {
	t.expect(3);
	
	/*1*/ t.ok(glow.widgets.AutoSuggest, "AutoSuggest module exists");
	/*2*/ t.equals(typeof glow.widgets.AutoSuggest, "function", "glow.widgets.AutoSuggest is a function.");
	
	var myForm = glow.dom.get("#example");
	var myAutoSuggest = new glow.widgets.AutoSuggest(myForm, {}, {});
	
	/*3*/ t.ok(myAutoSuggest, "A new form instance can be created.");
});

t.test("index", function() {
	t.expect(6);
	
	var myForm = glow.dom.get("#example");
	
	glow.widgets.AutoSuggest.testDataSource = [
	   {ingredients:["Chilli"], name:"Ray's Firehouse Chilli", chef:"Raymond Blanc"},
	   {ingredients:["coriander", "Swordfish", "fish"], name:"Coriander spiced swordfish", chef:"Ainsley Harriott"},
	   {ingredients:["fish", "cherry"], name:"Poached Trout With Cherry Sauce", chef:"Antony Worrall Thompson"},
	   {ingredients:["apples","pears", "pecans"], name:"Flan", chef:"Delia Smith"}
	];
	
	var myAutoSuggest = new glow.widgets.AutoSuggest(
		myForm,
		glow.widgets.AutoSuggest.testDataSource,
		{
			index: "ingredients" // can be a single string, the name of a field in your data items
		}
	);
	
	/*1*/ t.ok(myAutoSuggest.index["=cherry"], "Indexing on a field name should cause an item in that field to appear as a key in the index.");
	/*2*/ t.ok(myAutoSuggest.index["=chilli"], "Keys should be indexed in lowercase.");
		
	myAutoSuggest = new glow.widgets.AutoSuggest(
		myForm,
		glow.widgets.AutoSuggest.testDataSource,
		{
			index: ["ingredients", "chef"] // or can be multiple field names
		}
	);

	/*3*/ t.ok(myAutoSuggest.index["=delia smith"], "Indexing on an array of field names should cause items in those fields to appear as keys in the index.");
	
	myAutoSuggest = new glow.widgets.AutoSuggest(
		myForm,
		glow.widgets.AutoSuggest.testDataSource,
		{
			index: function(item) { // or can be a function that generates keywords to be indexed on
				return item.ingredients.concat(item.chef.split(' ')); 
			}
		}
	);
	
	/*4*/ t.ok(myAutoSuggest.index["=delia"], "Using a function to generate the index should cause the generated keywords to appear as keys in the index.");
	
	myAutoSuggest = new glow.widgets.AutoSuggest(
		myForm,
		glow.widgets.AutoSuggest.testDataSource,
		{
			index: ["chef"],
			caseSensitive: true
		}
	);
	
	/*5*/ t.ok(myAutoSuggest.index["=Delia Smith"], "Case sensitive indexing on an array of field names should cause items in those fields to appear as keys in the case sensitive index.");
	
	myAutoSuggest = new glow.widgets.AutoSuggest(
		myForm,
		glow.widgets.AutoSuggest.testDataSource,
		{
			index: "ingredients" // or can be multiple field names
		}
	);
	
	myAutoSuggest.find("pe"); // could be "pears" or "pecans"?
	/*6*/ t.equals(myAutoSuggest._found.length, 1, "When a lookFor matches multiple indexes in the same suggestion, the suggestion should only be found once.");
	myAutoSuggest.find("");

});

t.test("val", function() {
	t.expect(4);
	
	var myForm = glow.dom.get("#example");	
	myAutoSuggest = new glow.widgets.AutoSuggest(
		myForm,
		[]
	);
	
	/*1*/ t.equals(myAutoSuggest.val(), undefined, "The val should initially be empty.");
	myAutoSuggest.val("test value 1");
	/*2*/ t.equals(myAutoSuggest.val(), "test value 1", "The set val should be the same as the get value.");
	
	myAutoSuggest.suggest("test value 1xyz");
	/*3*/ t.equals(myAutoSuggest.inputElement.val(), "test value 1xyz", "The inputelement val should include suggested text.");
	/*4*/ t.equals(myAutoSuggest.val(), "test value 1", "But the val should not include suggested text.");

});

t.test("filter", function() {
	t.expect(3);
	
	var myForm = glow.dom.get("#example");
	var recipes = [
	   {name:"Green-bean Chilli", type:"Vegetarian"},
	   {name:"Green Seaweed Soup", type:"Seafood"},
	   {name:"Green Oysters on Ice", type:"Seafood"},
	   {name:"Green Apple Flan", type:"Pastry"}
	];
		
	myAutoSuggest = new glow.widgets.AutoSuggest(
		myForm,
		recipes,
		{
			filter: function(results) {
				return results.slice(0, 2); // limit results to first 2
			}
		}
	);
	
	myAutoSuggest.find("green"); // should find all recipes
	/*1*/ t.equals(myAutoSuggest._found.length, 2, "A filter can be applied to limit the results to a given length.");
	
	myAutoSuggest._filter = function(results) {
		var filtered = [];
		
		for (var i = results.length; i--;) {
			if (results[i].type == "Vegetarian") {
				filtered.push(results[i]);
			}
		}
		
		return filtered;
	};
	
	myAutoSuggest.find("green"); // should find all recipes
	/*2*/ t.equals(myAutoSuggest._found.length, 1, "A filter can be applied to limit the results to those with a certain property.");
	/*3*/ t.equals(myAutoSuggest._found[0].name, "Green-bean Chilli", "A filter can be applied and the expected result is returned.");

	myAutoSuggest.find(""); // to hide the results
});


t.test("cleanup", function() {
	t.expect(1);
	tempContainer.css("height", 0).css("overflow", "hidden").css("visibility", "hidden");
	t.ok(true, "Cleaned");
});