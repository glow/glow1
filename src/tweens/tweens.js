/**
@name glow.tweens
@namespace
@description Functions for modifying animations
@see <a href="../furtherinfo/tweens">What are tweens?</a>

*/
(window.gloader || glow).module({
	name: "glow.tweens",
	library: ["glow", "@VERSION@"],
	depends: [],
	builder: function(glow) {

		/*
		PrivateMethod: _reverse
			Takes a tween function and returns a function which does the reverse
		*/
		function _reverse(tween) {
			return function(t) {
				return 1 - tween(1 - t);
			}
		}

		glow.tweens = {
			/**
			@name glow.tweens.linear
			@function
			@description Returns linear tween.

				Will transition values from start to finish with no
				acceleration or deceleration.

			@returns {Function}
			*/
			linear: function() {
				return function(t) { return t; };
			},
			/**
			@name glow.tweens.easeIn
			@function
			@description Creates a tween which starts off slowly and accelerates.

			@param {Number} [strength=2] How strong the easing is.

				A higher number means the animation starts off slower and
				ends quicker.

			@returns {Function}
			*/
			easeIn: function(strength) {
				strength = strength || 2;
				return function(t) {
					return Math.pow(1, strength - 1) * Math.pow(t, strength);
				}
			},
			/**
			@name glow.tweens.easeOut
			@function
			@description Creates a tween which starts off fast and decelerates.

			@param {Number} [strength=2] How strong the easing is.

				A higher number means the animation starts off faster and
				ends slower

			@returns {Function}
			 */
			easeOut: function(strength) {
				return _reverse(this.easeIn(strength));
			},
			/**
			@name glow.tweens.easeBoth
			@function
			@description Creates a tween which starts off slowly, accelerates then decelerates after the half way point.

				This produces a smooth and natural looking transition.

			@param {Number} [strength=2] How strong the easing is.

				A higher number produces a greater difference between
				start / end speed and the mid speed.

			@returns {Function}
			*/
			easeBoth: function(strength) {
				return this.combine(this.easeIn(strength), this.easeOut(strength));
			},
			/**
			@name glow.tweens.overshootIn
			@function
			@description Returns the reverse of {@link glow.tweens.overshootOut overshootOut}

			@param {Number} [amount=1.70158] How much to overshoot.

				The default is 1.70158 which results in a 10% overshoot.

			@returns {Function}
			*/
			overshootIn: function(amount) {
				return _reverse(this.overshootOut(amount));
			},
			/**
			@name glow.tweens.overshootOut
			@function
			@description Creates a tween which overshoots its end point then returns to its end point.

			@param {Number} [amount=1.70158] How much to overshoot.

				The default is 1.70158 which results in a 10% overshoot.

			@returns {Function}
			*/
			overshootOut: function(amount) {
				amount = amount || 1.70158;
				return function(t) {
					if (t == 0 || t == 1) { return t; }
					return ((t -= 1)* t * ((amount + 1) * t + amount) + 1);
				}
			},
			/**
			@name glow.tweens.overshootBoth
			@function
			@description Returns a combination of {@link glow.tweens.overshootIn overshootIn} and {@link glow.tweens.overshootOut overshootOut}

			@param {Number} [amount=1.70158] How much to overshoot.

				The default is 1.70158 which results in a 10% overshoot.

			@returns {Function}
			*/
			overshootBoth: function(amount) {
				return this.combine(this.overshootIn(amount), this.overshootOut(amount));
			},
			/**
			@name glow.tweens.bounceIn
			@function
			@description Returns the reverse of {@link glow.tweens.bounceOut bounceOut}

			@returns {Function}
			*/
			bounceIn: function() {
				return _reverse(this.bounceOut());
			},
			/**
			@name glow.tweens.bounceOut
			@function
			@description Returns a tween which bounces against the final value 3 times before stopping

			@returns {Function}
			*/
			bounceOut: function() {
				return function(t) {
					if (t < (1 / 2.75)) {
						return 7.5625 * t * t;
					} else if (t < (2 / 2.75)) {
						return (7.5625 * (t -= (1.5 / 2.75)) * t + .75);
					} else if (t < (2.5 / 2.75)) {
						return (7.5625 * (t -= (2.25 / 2.75)) * t + .9375);
					} else {
						return (7.5625 * (t -= (2.625 / 2.75)) * t + .984375);
					}
				};
			},
			/**
			@name glow.tweens.bounceBoth
			@function
			@description Returns a combination of {@link glow.tweens.bounceIn bounceIn} and {@link glow.tweens.bounceOut bounceOut}

			@returns {Function}
			*/
			bounceBoth: function() {
				return this.combine(this.bounceIn(), this.bounceOut());
			},
			/**
			@name glow.tweens.elasticIn
			@function
			@description Returns the reverse of {@link glow.tweens.elasticOut elasticOut}

			@param {Number} [amplitude=1] How strong the elasticity is.

			@param {Number} [period=0.3] The frequency period.

			@returns {Function}
			*/
			elasticIn: function(a, p) {
				return _reverse(this.elasticOut(a, p));
			},
			/**
			@name glow.tweens.elasticOut
			@function
			@description Creates a tween which has an elastic movement.

				You can tweak the tween using the parameters but you'll
				probably find the defaults sufficient.

			@param {Number} [amplitude=1] How strong the elasticity is.

			@param {Number} [period=0.3] The frequency period.

			@returns {Function}
			*/
			elasticOut: function(a, p) {
				return function (t) {
					if (t == 0 || t == 1) {
						return t;
					}
					if (!p) {
						p = 0.3;
					}
					if (!a || a < 1) {
						a = 1;
						var s = p / 4;
					} else {
						var s = p / (2 * Math.PI) * Math.asin(1 / a);
					}
					return a * Math.pow(2, -10 * t) * Math.sin( (t-s) * (2 * Math.PI) / p) + 1;
				}
			},
			/**
			@name glow.tweens.elasticBoth
			@function
			@description Returns a combination of {@link glow.tweens.elasticIn elasticIn} and {@link glow.tweens.elasticOut elasticOut}

			@param {Number} [amplitude=1] How strong the elasticity is.

			@param {Number} [period=0.3] The frequency period.

			@returns {Function}
			*/
			elasticBoth: function(a, p) {
				p = p || 0.45;
				return this.combine(this.elasticIn(a, p), this.elasticOut(a, p));
			},
			/**
			@name glow.tweens.combine
			@function
			@description Create a tween from two tweens.

				This can be useful to make custom tweens which, for example,
				start with an easeIn and end with an overshootOut. To keep
				the motion natural, you should configure your tweens so the
				first ends and the same velocity that the second starts.

			@param {Function} tweenIn Tween to use for the first half

			@param {Function} tweenOut Tween to use for the second half

			@example
				// 4.5 has been chosen for the easeIn strength so it
				// ends at the same velocity as overshootOut starts.
				var myTween = glow.tweens.combine(
					glow.tweens.easeIn(4.5),
					glow.tweens.overshootOut()
				);

			@returns {Function}
			*/
			combine: function(tweenIn, tweenOut) {
				return function (t) {
					if (t < 0.5) {
						return tweenIn(t * 2) / 2;
					} else {
						return tweenOut((t - 0.5) * 2) / 2 + 0.5;
					}
				}
			}
		};
	}
});
