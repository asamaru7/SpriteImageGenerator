(function () {
	"use strict";

	// todo : auto fixed size
	// 기본값 정리
	// 입력 항목 정리
	// prefix, postfix
	// padding
	// github 페이지로 추가
	requirejs.config({
		'baseUrl': './js/',
		'waitSeconds': 0,   // infinity
		'urlArgs': window.cacheBust || (new Date()).getTime(),
		'paths': {
			'Knockout': 'https://cdnjs.cloudflare.com/ajax/libs/knockout/3.3.0/knockout-min',
			'Sortable': 'https://cdnjs.cloudflare.com/ajax/libs/Sortable/1.2.1/Sortable.min',
			'Masonry': 'https://cdnjs.cloudflare.com/ajax/libs/masonry/3.3.1/masonry.pkgd.min',
			'SpriteGenerator': 'SpriteImageGenerator',
			'RectanglePacking': 'RectanglePacking',
			'FileSaver': 'FileSaver.min',
			'JSZip': 'https://cdnjs.cloudflare.com/ajax/libs/jszip/2.5.0/jszip.min'
		},
		'shim': {}
	});

	$(function () {
		//if (document.queryCommandSupported('copy')) {
		$('.cCopy').on('click', function () {
			console.log($(this).data('copy-target'));
			var $target = $($(this).data('copy-target'));
			if ($target.length <= 0) {
				return;
			}

			var range = document.createRange();
			range.selectNode($target.get(0));
			window.getSelection().addRange(range);
			range = null;

			$target = null;

			var successful = false;
			try {
				successful = document.execCommand('copy');
			} catch (err) {
			}
			if (successful) {
				alert("복사되었습니다.");
			} else {
				alert("정상적으로 복사되지 않았습니다.\n직접 복사하세요.");
			}
			window.getSelection().removeAllRanges();
		});
		//}

		$('#cSort').find('button').on('click', function () {
			var $itemBox = $('#cFiles');
			var $items = $itemBox.children();

			var tmp = $(this).data('sort-type').split('-');
			$items.sort(function (type, dir) {
				return function (a, b) {
					var an = $(a).data('sprite-item');
					var bn = $(b).data('sprite-item');
					var d = ((dir == 'asc') ? 1 : -1);
					if (type == 'size') {
						return ((an.width * an.height) - (bn.width * bn.height)) * d;
					} else {
						return String(an.name).localeCompare(bn.name) * d;
					}
				};
			}(tmp[0], tmp[1]));
			tmp = null;
			$items.detach().appendTo($itemBox);
		});
	});

	require(['SpriteGenerator'], function (SpriteGenerator) {
		var spriteGenerator = new SpriteGenerator({
			onFileAdded: function (file) {
				//console.log(file);
				var $width = $('#pWidth');
				if ((parseInt($width.val()) || 0) < file.width) {
					$width.val(file.width);
				}
				var $height = $('#pHeight');
				if ((parseInt($height.val()) || 0) < file.height) {
					$height.val(file.height);
				}
			},
			onValidation: function (result) {
				$('#cValidation').empty().append(result);
				require(['Masonry'], function (Masonry) {
					new Masonry('#cValidation ul', {
						itemSelector: 'li'
					});
				});
			},
			filesElement: $('#files'),
			dropElement: $('#cFiles')
		});
		//spriteGenerator.initialize();

		var getRunOption = function () {
			var paddingHor = parseInt($('#pPaddingHor').val());
			var paddingVer = parseInt($('#pPaddingVer').val());
			return {
				retina: $('#resample').prop('checked'),
				useCr: $('#useCr').prop('checked'),
				useDataUrl: $('#useDataUrl').prop('checked'),
				fixedSize: $('#fixedSize').prop('checked'),
				width: parseInt($('#pWidth').val()),
				height: parseInt($('#pHeight').val()),
				padding: {top: paddingVer, right: paddingHor, bottom: paddingVer, left: paddingHor},
				layout: $('[name=layout]:checked').val(),
				className: $('#pClassName').val(),
				prefix: $('#pPrefix').val(),
				filename: $('#pFileName').val(),
				urlPrefix: $('#pUrlPrefix').val()
			};
		};

		$('#cResultTab, #cValidationTab, #cExportTab').on('show.bs.tab', function (e) {
			// e.target : newly activated tab, e.relatedTarget : previous active tab
			var generatedResult = spriteGenerator.generate(getRunOption());
			if (generatedResult == null) {
				e.preventDefault();
			}
			var css = generatedResult.css.common + '\n' + generatedResult.css.each;
			css = css.replace(/\n/g, '<br />').replace(/\t/g, '&nbsp;&nbsp;');
			var $cResultBox = $('.cResultBox').empty();
			$cResultBox.append('<pre class="generated-css">' + css + '</pre>');

			var styleElement = document.createElement('style');
			styleElement.innerHTML = generatedResult.css.validation;
			//styleElement.setAttribute('contenteditable', true);
			$cResultBox.append(styleElement);
			styleElement = null;
			$cResultBox = null;

			switch ($(e.target).attr('id')) {
				case 'cResultTab':

					break;
				case 'cExportTab':
					var result = spriteGenerator.export(getRunOption(), true);
					$('.cExportData').empty().html(result.setting);
					var $cExport = $('#cExport');
					var filename = result.data.option.filename;
					$cExport.find('.pNormal, .pRetina').empty();

					if (result.normal) {
						$cExport.find('.pNormalTitle').html(spriteGenerator.getFileName(false));
						$cExport.find('.pNormal').html('<img src="' + result.normal + '" alt="normal"/>');
					}
					if (result.retina) {
						$cExport.find('.pRetinaTitle').html(spriteGenerator.getFileName(true));
						$cExport.find('.pRetina').html('<img src="' + result.retina + '" alt="retina"/>');
					}
					$cExport.find('.cJsonTitle').html(spriteGenerator.getJsonFileName());
					result = null;
					$cExport = null;
					filename = null;
					break;
			}
		});

		/** -------------------------------------------------------------------
		 * 설정 탭
		 */
		(function () {
			require(['Knockout'], function (ko) {
				var vm = {
					fixedSize: ko.observable($('#fixedSize').prop('checked')),
					useDataUrl: ko.observable($('#useDataUrl').prop('checked'))
				};
				ko.applyBindings(vm, $('#cSetting').get(0));
				vm = null;
			});

			$('#pImport').on('dragover', function (e) {
				e.stopPropagation();
				e.preventDefault();
				$(this).removeClass('btn-default').addClass('btn-success');
			}).on('dragleave', function (e) {
				e.stopPropagation();
				e.preventDefault();
				$(this).removeClass('btn-success').addClass('btn-default');
			}).on('drop', function (e) {
				e.stopPropagation();
				e.preventDefault();
				$(this).trigger('dragleave');

				var evt = e.originalEvent;
				var files = evt.target.files || evt.dataTransfer.files;
				if (files.length > 1) {
					alert('한개의 파일만 Import 가능합니다.');
					return;
				}
				var file = files[0];
				if (!file.type.match('application/json*')) {
					return;
				}
				var fileReader = new FileReader();
				fileReader.onload = function (loadEvent) {
					importSetting(String(loadEvent.target.result).replace(/^data:application\/(json);base64,/, ""));
				};
				fileReader.readAsText(file);
				fileReader = null;
			});

			function importSetting(dataText) {
				try {
					var data = JSON.parse(dataText);

					$('#resample').prop('checked', data.option.retina);
					$('#useCr').prop('checked', data.option.useCr);
					$('#fixedSize').prop('checked', data.option.fixedSize);
					$('#pWidth').val(data.option.width);
					$('#pHeight').val(data.option.height);

					$('#pPaddingHor').val(data.option.padding.left);
					$('#pPaddingVer').val(data.option.padding.top);
					$(':radio[value=' + data.option.layout + ']').prop('checked', true);

					$('#pClassName').val(data.option.className);
					$('#pPrefix').val(data.option.prefix);
					$('#pFileName').val(data.option.filename);
					$('#useDataUrl').prop('checked', data.option.useDataUrl);
					$('#pUrlPrefix').val(data.option.urlPrefix);

					spriteGenerator.replaceFiles(data.files);

					$('.cImportBox').modal('hide');
				} catch (e) {
					console.error(e.message);
				}
			};

			$('#pImportOk').on('click', function () {
				importSetting($('#cImportTextarea').val());
			});

			$('#pGenerate').on('submit', function (e) {
				e.preventDefault();
				$('#cResultTab').tab('show');
			});

			//$('#pImageAdd').on('click', function() {
			//	var url = $('#pImageUrl').val();
			//	if (!$.trim(url)) {
			//		alert('추가하려는 이미지 URL을 먼저 넣으세요.');
			//		return;
			//	}
			//	spriteGenerator.addItemByUrl(url);
			//});

			// test
			//importSetting($('#cImportTextarea').val());
		})();

		/** -------------------------------------------------------------------
		 * 결과 탭
		 */
		(function () {
		})();

		/** -------------------------------------------------------------------
		 * 확인 탭
		 */
		(function () {
		})();

		/** -------------------------------------------------------------------
		 * Export 탭
		 */
		(function () {
			$('#pExportDown').on('click', function () {
				spriteGenerator.exportToZip(getRunOption());
			});
		})();
	});
})();