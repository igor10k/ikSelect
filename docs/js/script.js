$(function () {
	$.ikSelect.extendDefaults({
		extraWidth: 1
	});

	var $sectionSet = $('.section');

	$('.intro-select1').ikSelect({
		customClass: 'intro-select1',
		ddFullWidth: false,
		filter: true
	});

	$('.intro-select2').ikSelect({
		syntax: '<div class="ik_select_link"><div class="ik_select_link_inner"><span class="ik_select_link_text"></span></div></div><div class="ik_select_dropdown"><div class="ik_select_list"></div></div>',
		customClass: 'intro-select2',
		extractLink: true,
		ddMaxHeight: 1000,
		onShow: function (inst) {
			inst.$dropdown.css({
				top: inst.$link.offset().top - inst.$hover.position().top
			});
			setTimeout(function () {
				inst.$link.add(inst.$dropdown).addClass('transition');
				inst.$link.add(inst.$dropdown).addClass('animate');
			}, 0);
		},
		onHide: function (inst) {
			inst.$link.add(inst.$dropdown).removeClass('animate');
			inst.$link.add(inst.$dropdown).removeClass('transition');
		},
		onKeyDown: function (inst, keycode) {
			if (keycode === 40 || keycode === 38) {
				inst.$dropdown.css({
					top: inst.$link.offset().top - inst.$hover.position().top
				});
				inst._makeOptionActive(inst.hoverIndex, true);
			}
		}
	});

	$('.intro-select-link').ikSelect({
		customClass: 'intro-select-link',
		dynamicWidth: true
	});

	$('.intro-select-osx').ikSelect({
		customClass: 'intro-select-osx'
	});

	$('.intro-select-ie').ikSelect({
		customClass: 'intro-select-ie'
	});

	$sectionSet.each(function () {
		var $section = $(this);
		if ($section.data('hidden')) {
			$section.hide();
		}
	});

	$('.header').each(function () {
		var $header = $(this);
		$(window).on('resize scroll', function () {
			if ($(window).width() < 960) {
				$header.css({
					left: 0,
					marginLeft: -$(window).scrollLeft()
				});
			} else {
				$header.css({
					left: '50%',
					marginLeft: -490
				});
			}
		});
	});

	$('.header-nav').each(function () {
		var $nav = $(this);
		var $linkSet = $('a', $nav);
		var $activeLink = $linkSet.eq(0);
		$(window).on('scroll', function () {
			var $section;
			for (var i = 0; i < $sectionSet.length; i++) {
				$section = $sectionSet.eq(i);
				if ($section.is(':visible') && $section.offset().top + $section.outerHeight() >= $(window).scrollTop() + 115) {
					break;
				}
			}
			$activeLink.removeClass('active');
			$activeLink = $linkSet.eq(i).addClass('active');
		});
		$(window).scroll();
	});

	$('.header-nav a, .features-link').on('click', function (event) {
		event.preventDefault();
		var $link = $(this);
		var $block = $($link.attr('href'));
		if ($block.data('hidden')) {
			$block.show();
			var height = $block.height();
			var marginBottom = parseInt($block.css('marginBottom'), 10);
			$block.css({
				height: 0,
				marginBottom: 0,
				overflow: 'hidden'
			});
			$block.addClass('transition');
			$block.css({
				height: height,
				marginBottom: marginBottom
			});
			$(window).scroll();
		}
		$('html, body').animate({ 'scrollTop': $block.offset().top - 115 });
	});

	$('.examples-options, .examples-callbacks').each(function () {
		var $example = $(this);
		var $select = $('select', this);
		var selectOptions = {};

		$select.ikSelect();

		$('.list-examples', $example).each(function () {
			var $list = $(this);
			var $buttonSet = $('button', $list);

			$buttonSet.each(function () {
				var $button = $(this);
				var key = $('.key', $button).text();
				var value = $button.data('value');
				var currentValue = value;
				var altValue = $button.data('altvalue');
				var $value = $('.value', $button);

				var renderValue = function () {
					$value.text(typeof currentValue === 'string' ? ('\'' + currentValue + '\'') : currentValue);
				};

				var storeValue = function () {
					selectOptions[key] = currentValue;
					if (typeof currentValue === 'string') {
						if (currentValue.indexOf('function') === 0) {
							selectOptions[key] = eval('callback = ' + currentValue, currentValue);
						}
					}
				};

				renderValue();
				storeValue();

				$button.on('click', function (event) {
					event.preventDefault();
					currentValue = currentValue === value ? altValue : value;
					renderValue();
					storeValue();
					$select.ikSelect('detach').prop('disabled', false).ikSelect(selectOptions);
				});
			});
		});
	});

	$('.examples-api').each(function () {
		var $example = $(this);
		var $select = $('select', this);
		var $selectWrap = $('.select-wrap', this);
		var $placeHelper = $('<div/>');
		var $selectBackup = $select.clone();

		$select.before($placeHelper);

		$select.ikSelect();

		$(window).on('scroll', function () {
			if ($(window).scrollTop() > $example.offset().top - 37) {
				$selectWrap.addClass('floating');
			} else {
				$selectWrap.removeClass('floating');
			}
		});

		$('.list-examples', $example).each(function () {
			var $list = $(this);
			var $buttonSet = $('button', $list);

			$buttonSet.each(function () {
				var $button = $(this);
				var altValue = $button.data('altvalue');
				var $value = $('.value', $button);
				var value = $value.html();
				var currentValue = value;
				var method = $('.method', $button).html();

				if ($.isArray(altValue)) {
					altValue = '[' + altValue.join(', ') + ']';
				}

				$button.on('click', function (event) {
					event.preventDefault();
					if ($button.data('reset')) {
						$select.ikSelect('detach').remove();
						$select = $selectBackup.clone();
						$placeHelper.after($select);
						$select.ikSelect();
					}
					if (currentValue === value) {
						if (typeof altValue !== 'undefined') {
							if ($button.data('extend')) {
								currentValue = altValue;
								eval('$.ikSelect.extendDefaults(' + currentValue + ')');
							} else {
								currentValue = ', ' + altValue;
								eval('$select.ikSelect(' + method + currentValue + ')');
							}
						} else {
							setTimeout(function () {
								eval('$select.ikSelect(' + (method || '') + ')');
							}, 1);
						}
					} else {
						currentValue = value;
					}
					$value.html(currentValue);
				});
			});
		});
	});
});
