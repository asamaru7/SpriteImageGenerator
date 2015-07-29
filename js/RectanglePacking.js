// http://www.codeproject.com/Articles/210979/Fast-optimizing-rectangle-packing-algorithm-for-bu
define('RectanglePacking', [], function () {
	'use strict';
	// https://github.com/munro/boxpack

	var Boxpack = function (opts) {
		opts = opts || {};
		this._empty = [{
			x: 0,
			y: 0,
			drawWidth: opts.drawWidth || Infinity,
			drawHeight: opts.drawHeight || Infinity
		}];
		this.canvasWidth = 0;
		this.canvasHeight = 0;
	};

	Boxpack.prototype = {
		pack: function (rects) {
			if (rects instanceof Array) {
				var self = this;
				rects.map(function (rect) {
					self._packOne(rect);
				});
			} else if (rects instanceof Object) {
				for (var key in rects) {
					if (rects.hasOwnProperty(key)) {
						this._packOne(rects[key]);
					}
				}
			} else {
				this._packOne(rects);
			}
		},
		_packOne: function (rect) {
			var self = this,
				pack = false;
			self._empty.some(function (fit) {
				if (Boxpack.rectFit(rect, fit)) {
					pack = fit;
					return true;
				}
				return false;
			});
			if (!pack) {
				return false;
			}

			rect.x = pack.x;
			rect.y = pack.y;

			var new_empty = [];
			self._empty.forEach(function (fit) {
				if (!Boxpack.intersect(rect, fit)) {
					return new_empty.push(fit);
				}
				new_empty = new_empty.concat(Boxpack.subtract(rect, fit));
			});

			var sorted = new_empty.sort(Boxpack.algo.dist);
			this._empty = sorted.filter(function (a) {
				return sorted.every(function (b) {
					return a === b || !Boxpack.boxFit(a, b);
				});
			});

			this.canvasWidth = Math.max(this.canvasWidth, rect.x + rect.drawWidth);
			this.canvasHeight = Math.max(this.canvasHeight, rect.y + rect.drawHeight);
		}
	};

	/*
	 function makeAxisAlgo(fst, snd) {
	 return function (a, b) {
	 var sort = a[fst] - b[fst];
	 if (sort !== 0) {
	 return sort;
	 }
	 return a[snd] - b[snd];
	 };
	 }
	 */

	Boxpack.algo = {
		dist: function (a, b) {
			return (
				(Math.pow(a.x, 2) + Math.pow(a.y, 2)) -
				(Math.pow(b.x, 2) + Math.pow(b.y, 2))
			);
		}//,
		//top: makeAxisAlgo('y', 'x'),
		//left: makeAxisAlgo('x', 'y')
	};

	Boxpack.rectFit = function (rect, bin) {
		return (
			rect.drawWidth <= bin.drawWidth &&
			rect.drawHeight <= bin.drawHeight
		);
	};

	Boxpack.boxFit = function (a, b) {
		return (
			a.x >= b.x && (a.x + a.drawWidth) <= (b.x + b.drawWidth) &&
			a.y >= b.y && (a.y + a.drawHeight) <= (b.y + b.drawHeight)
		);
	};

	Boxpack.intersect = function (a, b) {
		return (
			a.x < (b.x + b.drawWidth) && (a.x + a.drawWidth) > b.x &&
			a.y < (b.y + b.drawHeight) && (a.y + a.drawHeight) > b.y
		);
	};

	Boxpack.divideX = function (box, x) {
		if (x <= box.x || x >= (box.x + box.drawWidth)) {
			return [];
		}
		return [
			{x: box.x, y: box.y, drawWidth: (x - box.x), drawHeight: box.drawHeight},
			{x: x, y: box.y, drawWidth: (box.x + box.drawWidth - x), drawHeight: box.drawHeight}
		];
	};

	Boxpack.divideY = function (box, y) {
		if (y <= box.y || y >= (box.y + box.drawHeight)) {
			return [];
		}
		return [
			{x: box.x, y: box.y, drawWidth: box.drawWidth, drawHeight: (y - box.y)},
			{x: box.x, y: y, drawWidth: box.drawWidth, drawHeight: (box.y + box.drawHeight - y)}
		];
	};

	Boxpack.subtract = function (sub, from) {
		return [sub].concat(
			Boxpack.divideX(from, sub.x),
			Boxpack.divideX(from, sub.x + sub.drawWidth),
			Boxpack.divideY(from, sub.y),
			Boxpack.divideY(from, sub.y + sub.drawHeight)
		).filter(function (box) {
				return !Boxpack.intersect(sub, box);
			});
	};

	return Boxpack;
});