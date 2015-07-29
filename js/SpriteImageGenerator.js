/**
 * http://paulrhayes.com/sprite-generator/
 */
define('SpriteGenerator', ['RectanglePacking'], function (RectanglePacking) {
	var SpriteGenerator = function (setting) {
		this.setting = {
			onFileAdded: function (file) {
			},
			onValidation: function (result) {
			},
			filesElement: null,
			dropElement: null
		};
		$.extend(true, this.setting, setting);
		this.option = null;
		this.items = [];

		this.resultDataURL = {'normal': null, 'retina': null};
		this.resultCSS = {'common': null, 'each': null, 'validation': null};

		this._initialize();
	};

	SpriteGenerator.prototype.addItemByFile = function (file) {
		if (!file.type.match('image.*')) {
			return;
		}
		var fileReader = new FileReader();
		fileReader.onload = (function (self, fileX) {
			return function (loadEvent) {
				self._addImageItem(loadEvent.target.result, fileX.name, fileX.size);
			};
		})(this, file);
		fileReader.readAsDataURL(file);
		fileReader = null;
	};

	//SpriteGenerator.prototype.addItemByUrl = function (url) {
	//	var image = new Image();
	//	image.setAttribute('crossOrigin', 'anonymous');
	//	image.onload = (function (self) {
	//		return function (e) {
	//			var name = this.src.split('/').pop();
	//			var canvas = document.createElement("canvas");
	//			canvas.width = this.width;
	//			canvas.height = this.height;
	//			var ctx = canvas.getContext("2d");
	//			ctx.drawImage(this, 0, 0);
	//			//var dataURL = canvas.toDataURL("image/png");
	//			//return dataURL.replace(/^data:image\/(png|jpg);base64,/, "");
	//
	//			self._addImageItem(canvas.toDataURL("image/png"), name, 0);
	//		};
	//	})(this);
	//	image.src = url;
	//	image = null;
	//};
	SpriteGenerator.prototype.getItems = function () {
		if (this.setting.dropElement != null) {
			return this.setting.dropElement.children().map(function () {
				return $(this).data('sprite-item');
			});
		}
		return this.items;
	};
	// sprite 이미지 생성
	SpriteGenerator.prototype.generate = function (option) {
		var items = this.getItems();
		if ((items == null) || (items.length == 0)) {
			alert('Please select at least 1 image files.');
			return null;
		}
		this._initializeOption();
		$.extend(true, this.option, option);
		this.option.width = parseInt(this.option.width);
		this.option.height = parseInt(this.option.height);
		if (isNaN(this.option.width) || isNaN(this.option.height)) {
			this.option.fixedSize = false;
		}

		var originalCanvas = document.createElement('canvas');
		var canvasSize = this._calcImageLayout(items, false);
		originalCanvas.width = canvasSize.width;
		originalCanvas.height = canvasSize.height;
		//this._setCanvasDimensions(images, originalCanvas);
		this._drawCanvas(items, originalCanvas);

		this.resultDataURL = {'normal': null, 'retina': null};
		if (this.option.retina) {
			var downSampledCanvas = document.createElement('canvas');
			canvasSize = this._calcImageLayout(items, this.option.retina);
			downSampledCanvas.width = canvasSize.width;
			downSampledCanvas.height = canvasSize.height;
			//this._setCanvasDimensions(images, downSampledCanvas, this.option.retina);
			this._drawCanvas(items, downSampledCanvas);
			this.resultDataURL.normal = downSampledCanvas.toDataURL();
			this.resultDataURL.retina = originalCanvas.toDataURL();
			this._generateCSS(items, downSampledCanvas, originalCanvas, this.option.retina);
			downSampledCanvas = null;
		} else {
			this.resultDataURL.normal = originalCanvas.toDataURL();
			this._generateCSS(items, originalCanvas);
		}
		originalCanvas = null;

		this._validateCSS(items, this.option.retina);
		items = null;

		return {
			'dataURL': this.resultDataURL,
			'css': this.resultCSS
		};
	};

	SpriteGenerator.prototype.export = function (runOpt, syntaxHighlight) {
		var rtn = {
			option: runOpt,
			files: []
		};
		var items = this.getItems();
		for (var i = 0, iCnt = items.length; i < iCnt; i++) {
			rtn.files.push({
				name: items[i].name,
				data: items[i].data,
				width: items[i].width,
				height: items[i].height,
				fileSize: items[i].fileSize
			});
		}
		items = null;
		var json = JSON.stringify(rtn, null, 2);
		if (syntaxHighlight) {
			json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
			json = json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
				var cls = 'number';
				if (/^"/.test(match)) {
					if (/:$/.test(match)) {
						cls = 'key';
					} else {
						cls = 'string';
					}
				} else if (/true|false/.test(match)) {
					cls = 'boolean';
				} else if (/null/.test(match)) {
					cls = 'null';
				}
				return '<span class="' + cls + '">' + match + '</span>';
			});
		}
		return {'data': rtn, 'setting': json, 'normal': this.resultDataURL.normal, 'retina': this.resultDataURL.retina};
	};

	SpriteGenerator.prototype.exportToZip = function (runOpt) {
		require(['JSZip'], (function (self) {
			return function (JSZip) {
				var zip = new JSZip();
				zip.file(self.getJsonFileName(), self.export(runOpt, false).setting);
				if (self.resultDataURL.normal != null) {
					zip.file(self.getFileName(false), dataURLtrim(self.resultDataURL.normal), {base64: true});
				}
				if (self.resultDataURL.retina != null) {
					zip.file(self.getFileName(true), dataURLtrim(self.resultDataURL.retina), {base64: true});
				}
				require(['FileSaver'], function (data, name) {
					return function () {
						window.saveAs(data, name);
					};
				}(zip.generate({type: 'blob'}), self.option.filename + '.zip'));
			};
		})(this));
	};

	SpriteGenerator.prototype.getFileName = function (retina) {
		return this.option.filename + (retina ? '@2x' : '') + '.png';
	};

	SpriteGenerator.prototype.getJsonFileName = function () {
		return this.option.filename + '.sprite.json';
	};

	function dataURLtrim(dataURL) {
		return dataURL.replace(/^data:image\/(png|jpg);base64,/, "");
	}

	SpriteGenerator.prototype.replaceFiles = function (files) {
		this.items = [];
		if (this.setting.dropElement != null) {
			this.setting.dropElement.empty();
		}
		if ($.isArray(files)) {
			var file = null;
			for (var i = 0, iCnt = files.length; i < iCnt; i++) {
				file = files[i];
				this._addImageItem(file.data, file.name, file.fileSize);
			}
		}
	};

	// -------------------------------------------------------------------------------------
	// Private
	SpriteGenerator.prototype._initialize = function () {
		if (this.setting.filesElement != null) {
			this.setting.filesElement.on('change', (function (self) {
				return function (evt) {
					var fileList = evt.target.files;
					for (var i = 0, l = fileList.length; i < l; i++) {
						self.addItemByFile(fileList[i]);
					}
				};
			})(this));
		}
		if ((this.setting.dropElement != null) && (window.File && window.FileList && window.FileReader)) {
			var $cFileDrag = this.setting.dropElement;
			$cFileDrag.on("dragover dragleave", function (e) {
				e.stopPropagation();
				e.preventDefault();

				this.className = (e.type == "dragover" ? "hover" : "");
			});
			$cFileDrag.on("drop", (function (self) {
				return function (e) {
					e.stopPropagation();
					e.preventDefault();

					$(this).trigger('dragleave');
					var evt = e.originalEvent;
					var files = evt.target.files || evt.dataTransfer.files;
					for (var i = 0, file; file = files[i]; i++) {
						self.addItemByFile(file);
					}
				};
			})(this));
			$cFileDrag = null;

			require(['Sortable'], (function (self) {
				return function (Sortable) {
					Sortable.create(self.setting.dropElement.get(0));
				};
			})(this));
		}
	};

	SpriteGenerator.prototype._initializeOption = function () {
		this.option = {
			retina: false,
			useCr: false,	// Carriage Return
			useDataUrl: false,	// use Data Url
			fixedSize: false,
			width: -1,
			height: -1,
			padding: {top: 0, right: 0, bottom: 0, left: 0},
			layout: 'ver',
			className: 'sprite',
			prefix: '',
			filename: 'sprite',
			urlPrefix: ''
		};
	};

	SpriteGenerator.prototype._addImageItem = function (imageData, name, size) {
		var image = new Image();
		image.src = imageData;
		var item = {
			name: name,
			image: image,
			data: imageData,
			width: image.width,
			height: image.height,
			fileSize: size,
			drawWidth: 0,	// 여백 등을 포함한 차지 영역
			drawHeight: 0,
			drawImageWidth: 0,	// 출력을 위한 이미지 사이즈
			drawImageHeight: 0,
			xOffset: 0,	// 고정 사이즈 사용시 중앙 정렬을 위한 위치
			yOffset: 0,
			x: 0,	// canvas 내에서의 위치
			y: 0
		};
		this.items.push(item);

		if (this.setting.dropElement != null) {
			var title = '<span>' + item.name + '</span> <i>(' + item.width + 'x' + item.height;
			if (!isNaN(item.fileSize)) {
				title += ', ' + humanFileSize(item.fileSize, true);
			}
			title += ')</i>';
			var $item = $('<li/>').append(item.image).append('<span>' + title + '</span>')
				.data('sprite-item', item);
			$item.find('span > span').on('save', (function ($el) {
				return function (e, params) {
					var data = $el.data('sprite-item');
					data.name = params.newValue;
					$el.data('sprite-item', data);
				};
			})($item)).editable();
			$item.appendTo(this.setting.dropElement);
			$item = null;
			title = null;
		}

		this.setting.onFileAdded(item);
		item = null;
	};

	SpriteGenerator.prototype._calcImageLayout = function (items, downsample) {
		var ratio = (downsample ? 2 : 1);
		var revRatio = (!downsample ? 2 : 1);
		var fixedSize = this.option.fixedSize;
		var retinaOption = (this.option.retina ? 2 : 1);
		var fixedWidth = Math.ceil(this.option.width * retinaOption / ratio);
		var fixedHeight = Math.ceil(this.option.height * retinaOption / ratio);
		var nowX = 0;
		var nowY = 0;
		var maxWidth = 0;
		var maxHeight = 0;
		for (var i = 0, iCnt = items.length; i < iCnt; i++) {
			//console.log(items[i]);
			items[i].drawImageWidth = Math.ceil(items[i].width / ratio);
			items[i].drawImageHeight = Math.ceil(items[i].height / ratio);
			if (fixedSize) {
				items[i].drawWidth = fixedWidth;
				items[i].drawHeight = fixedHeight;
			} else {
				items[i].drawWidth = items[i].drawImageWidth;
				items[i].drawHeight = items[i].drawImageHeight;
			}
			//console.log(items[i].drawWidth);
			items[i].xOffset = (this.option.padding.left * revRatio) + Math.ceil((items[i].drawWidth - items[i].drawImageWidth) / 2);
			items[i].yOffset = (this.option.padding.top * revRatio) + Math.ceil((items[i].drawHeight - items[i].drawImageHeight) / 2);
			items[i].drawWidth += ((this.option.padding.left + this.option.padding.right) * revRatio);
			items[i].drawHeight += ((this.option.padding.top + this.option.padding.bottom) * revRatio);

			if (this.option.layout != 'compat') {
				items[i].x = nowX;
				items[i].y = nowY;
				switch (this.option.layout) {
					case 'ver' :
						nowY += items[i].drawHeight;
						break;
					case 'hor' :
						nowX += items[i].drawWidth;
						break;
				}
				//console.log(items[i].drawWidth);
				maxWidth = Math.max(maxWidth, items[i].x + items[i].drawWidth);
				maxHeight = Math.max(maxHeight, items[i].y + items[i].drawHeight);
			}
		}
		if (this.option.layout == 'compat') {
			var packer = new RectanglePacking();
			//if (!fixedSize) {
			//	items.sort(function (a, b) {
			//		return (b.drawWidth * b.drawHeight) - (a.drawWidth * a.drawHeight);
			//	});
			//}
			packer.pack(items);
			maxWidth = packer.canvasWidth;
			maxHeight = packer.canvasHeight;
		}

		return {width: maxWidth, height: maxHeight};
	};

	SpriteGenerator.prototype._drawCanvas = function (items, canvas) {
		var canvasContext = canvas.getContext('2d');
		var x, y;
		for (var i = 0, l = items.length; i < l; i++) {
			x = items[i].x + items[i].xOffset;
			y = items[i].y + items[i].yOffset;
			canvasContext.drawImage(items[i].image, x, y, items[i].drawImageWidth, items[i].drawImageHeight);
		}
		canvasContext = null;
	};

	SpriteGenerator.prototype._getNormalCss = function (fixedSize, fixedWidth, fixedHeight, cr, tb) {
		var css = '.' + this.option.className + ' {' + cr;
		css += tb + 'background-image: url(\'__NORMAL_IMAGE__\');' + cr;
		if (this.option.fixedSize) {
			css += tb + 'width: ' + fixedWidth + 'px;' + cr;
			css += tb + 'height: ' + fixedHeight + 'px;' + cr;
		}
		css += '}\n\n';
		return css;
	};

	SpriteGenerator.prototype._getRetinaCss = function (canvasWidth, canvasHeight, fixedSize, fixedWidth, fixedHeight, cr, tb) {
		var css = '.' + this.option.className + ' {' + cr;
		css += tb + tb + 'background-image: url(\'__RETINA_IMAGE__\');' + cr;
		// Set background size of large retina sprite to the smaller sprite dimensions : http://miekd.com/articles/using-css-sprites-to-optimize-your-website-for-retina-displays/
		css += tb + tb + 'background-size: ' + canvasWidth + 'px ' + canvasHeight + 'px;' + cr;
		if (this.option.fixedSize) {
			css += tb + tb + 'width: ' + fixedWidth + 'px;' + cr;
			css += tb + tb + 'height: ' + fixedHeight + 'px;' + cr;
		}
		css += tb + '}\n';
		return css;
	};

	SpriteGenerator.prototype._getItemCss = function (image, cr, tb) {
		var css = '.' + this.option.className + '-' + getClassNameFromFilename(image.name) + ' {' + cr;
		if (!this.option.fixedSize) {
			css += tb + 'width: ' + image.drawWidth + 'px;' + cr;
			css += tb + 'height: ' + image.drawHeight + 'px;' + cr;
		}
		css += tb + 'background-position: -' + image.x + 'px -' + image.y + 'px;' + cr;
		css += '}\n' + cr;
		return css;
	};

	SpriteGenerator.prototype._generateCSS = function (images, canvas, retinaCanvas, includeRetina) {
		this.resultCSS = {'common': null, 'each': null, 'validation': null};

		//var fixedWidth = (this.option.width / (this.option.retina ? 2 : 1));
		//var fixedHeight = (this.option.height / (this.option.retina ? 2 : 1));
		var fixedWidth = this.option.width;
		var fixedHeight = this.option.height;
		var cr = this.option.useCr ? "\n" : '';
		var tb = this.option.useCr ? "\t" : ' ';

		var normalCss = this._getNormalCss(this.option.fixedSize, fixedWidth, fixedHeight, cr, tb);
		var css = this.option.prefix + normalCss;
		// 검증용 CSS
		var validationCss = '.cNormal' + normalCss;
		normalCss = null;

		if (includeRetina) {
			var retinaCss = this._getRetinaCss(canvas.width, canvas.height, this.option.fixedSize, fixedWidth, fixedHeight, cr, tb);
			// Bulletproof retina media query (Firefox, Opera, Webkit and defaults) From: https://gist.github.com/2997187
			css += '@media (min--moz-device-pixel-ratio: 1.5), (-o-min-device-pixel-ratio: 3/2), (-webkit-min-device-pixel-ratio: 1.5), (min-device-pixel-ratio: 1.5), (min-resolution: 1.5dppx) {\n';
			css += tb + this.option.prefix + retinaCss;
			css += '}\n';

			validationCss += '.cRetina' + $.trim(retinaCss);
			retinaCss = null;
		}
		this.resultCSS.common = css;

		css = '';
		var itemCss;
		for (var i = 0, l = images.length; i < l; i++) {
			itemCss = this._getItemCss(images[i], cr, tb);
			css += this.option.prefix + itemCss;
			validationCss += itemCss;
		}
		itemCss = null;
		this.resultCSS.each = css.replace(/-0px/g, '0px');
		css = null;

		validationCss = validationCss.replace('__NORMAL_IMAGE__', this.resultDataURL.normal);
		if (includeRetina) {
			validationCss = validationCss.replace('__RETINA_IMAGE__', this.resultDataURL.retina);
		}
		this.resultCSS.validation = validationCss;
		validationCss = null;

		if (this.option.useDataUrl) {
			this.resultCSS.common = this.resultCSS.common.replace('__NORMAL_IMAGE__', this.resultDataURL.normal);
			if (includeRetina) {
				this.resultCSS.common = this.resultCSS.common.replace('__RETINA_IMAGE__', this.resultDataURL.retina);
			}
		} else {
			this.resultCSS.common = this.resultCSS.common.replace('__NORMAL_IMAGE__', this.option.urlPrefix + this.getFileName(false));
			if (includeRetina) {
				this.resultCSS.common = this.resultCSS.common.replace('__RETINA_IMAGE__', this.option.urlPrefix + this.getFileName(true));
			}
		}
		return this.resultCSS;
	};

	SpriteGenerator.prototype._validateCSS = function (images, includeRetina) {
		if (this.setting.onValidation) {
			var $validationElement = $('<ul/>');
			var $li;
			for (var i = 0, l = images.length; i < l; i++) {
				var name = images[i].name, classname = getClassNameFromFilename(name);
				var classNames = this.option.className + ' ' + this.option.className + '-' + classname;

				$li = $('<li/>');
				$li.append('<h3>' + classname + '</h3>');
				$li.append('<div class="cNormal ' + classNames + '"/>');

				if (includeRetina) {
					$li.append('<div class="cRetina ' + classNames + '"/>');
				}
				$li.appendTo($validationElement);
			}
			this.setting.onValidation($validationElement);
			$validationElement = null;
		}
	};

	function humanFileSize(bytes, si) {
		var thresh = si ? 1000 : 1024;
		if (Math.abs(bytes) < thresh) {
			return bytes + ' B';
		}
		var units = si
			? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
			: ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
		var u = -1;
		do {
			bytes /= thresh;
			++u;
		} while (Math.abs(bytes) >= thresh && u < units.length - 1);
		return bytes.toFixed(1) + ' ' + units[u];
	}

	function getClassNameFromFilename(name) {
		//return name.substr(0, name.lastIndexOf('.')).replace(/[\._]/g, '-').toLowerCase();
		return name.substr(0, name.lastIndexOf('.')).replace(/[\._]/g, '-');
	}

	return SpriteGenerator;
});