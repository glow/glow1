t.module("glow.tweens");

t.test("glow.tween basic tests", function() {
	t.expect(39);
	
	var tweenTypes = [
		"linear",
		"easeIn", "easeOut", "easeBoth",
		"overshootIn", "overshootOut", "overshootBoth",
		"bounceIn", "bounceOut", "bounceBoth",
		"elasticIn", "elasticOut", "elasticBoth"
	],
		i,
		len = tweenTypes.length,
		tween;
	
	for (i = 0; i < len; i++) {
		tween = glow.tweens[tweenTypes[i]]();
		t.ok(tween instanceof Function, tweenTypes[i] + " is function");
		t.equals(tween(0), 0, tweenTypes[i] + " starts at 0");
		t.equals(tween(1), 1, tweenTypes[i] + " ends at 1");
	}
});