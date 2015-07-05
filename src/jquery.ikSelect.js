/*! ikSelect 1.1.0
	Copyright (c) 2013 Igor Kozlov
	http://igorkozlov.me */

;(function (factory) {
	if (typeof define === 'function' && define.amd) {
		define(['jquery'], factory);
	} else {
		factory(jQuery);
	}
}(function ($) {
	var $window = $(window);
	var defaults = {
		syntax: '<div class="ik_select_link"><div class="ik_select_link_text"></div></div><div class="ik_select_dropdown"><div class="ik_select_list"></div></div>',
		autoWidth: true, // set select width according to the longest option
		ddFullWidth: true, // set dropdown width according to the longest option
		equalWidths: true, // include scrollbar width in fake select calculations
		dynamicWidth: false, // change fake select's width according to it's contents
		extractLink: false,
		customClass: '',
		linkCustomClass: '',
		ddCustomClass: '',
		ddMaxHeight: 200,
		extraWidth: 0,
		filter: false,
		nothingFoundText: 'Nothing found',
		isDisabled: false,
		onInit: function() {},
		onShow: function () {},
		onHide: function () {},
		onKeyUp: function () {},
		onKeyDown: function () {},
		onHoverMove: function () {}
	};

	var instOpened; // instance of the currently opened select

	// browser detection part was taken from jQuery migrate
	// https://github.com/jquery/jquery-migrate/blob/e6bda6a84c294eb1319fceb48c09f51042c80892/src/core.js
	var uaMatch = function (ua) {
		ua = ua.toLowerCase();

		var match = /(chrome)[ \/]([\w.]+)/.exec(ua) ||
			/(webkit)[ \/]([\w.]+)/.exec(ua) ||
			/(opera)(?:.*version|)[ \/]([\w.]+)/.exec(ua) ||
			/(msie) ([\w.]+)/.exec(ua) ||
			ua.indexOf('compatible') < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec(ua) ||
			[];

		return {
			browser: match[1] || '',
			version: match[2] || '0'
		};
	};

	if (! $.browser) {
		var matched = uaMatch(navigator.userAgent);
		var browser = {};

		if (matched.browser) {
			browser[matched.browser] = true;
			browser.version = matched.version;
		}

		if (browser.chrome) {
			browser.webkit = true;
		} else if (browser.webkit) {
			browser.safari = true;
		}

		$.browser = browser;
	}

	$.browser.mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile/i.test(navigator.userAgent);
	$.browser.operamini = Object.prototype.toString.call(window.operamini) === '[object OperaMini]';

	function IkSelect(element, options) {
		var dataOptions = {}; // parsed data- attributes

		this.el = element;
		this.$el = $(element); // original select

		for (var key in defaults) {
			dataOptions[key] = this.$el.data(key.toLowerCase());
		}

		this.options = $.extend({}, defaults, options, dataOptions);

		if ($.browser.mobile) {
			this.options.filter = false;
		}

		this.init();
	}

	$.extend(IkSelect.prototype, {
		init: function () {
			this.$wrapper = $('<div class="ik_select">' + this.options.syntax + '</div>'); // wrapper for the fake select and the fake dropdown
			this.$link = $('.ik_select_link', this.$wrapper); // fake select
			this.$linkText = $('.ik_select_link_text', this.$wrapper); // fake select's text
			this.$dropdown = $('.ik_select_dropdown', this.$wrapper); // fake dropdown
			this.$list = $('.ik_select_list', this.$wrapper); // options list inside the fake dropdown
			this.$listInner = $('<div class="ik_select_list_inner"/>'); // support dropdown for scrolling
			this.$active = $([]); // active fake option
			this.$hover = $([]); // hovered fake option
			this.hoverIndex = 0; // hovered fake option's index

			this.$optionSet = $([]);
			this.$optgroupSet = $([]);

			this.$list.append(this.$listInner);

			if (this.options.filter) {
				this.$filter = $([]); // filter text input
				this.$optionSetOriginal = $([]); // contains original list items when filtering
				this.$nothingFoundText = $('<div class="ik_select_nothing_found"/>').html(this.options.nothingFoundText);
				this.$filterWrap = $('.ik_select_filter_wrap', this.$wrapper);

				if (! this.$filterWrap.length) {
					this.$filterWrap = $('<div class="ik_select_filter_wrap"/>');
				}

				this.$filter = $('<input type="text" class="ik_select_filter">');

				this.$filterWrap.append(this.$filter);
				this.$list.prepend(this.$filterWrap);

				this.$filter.on({
					// keyboard controls should work even if the filter is in focus
					'keydown.ikSelect keyup.ikSelect': $.proxy(this, '_elKeyUpDown'),
					// actual filtering happens on keyup
					'keyup.ikSelect': $.proxy(this, '_filterKeyup')
				});
			}

			this.$wrapper.addClass(this.options.customClass);
			this.$link.addClass(this.options.linkCustomClass || (this.options.customClass && this.options.customClass + '-link'));
			this.$dropdown.addClass(this.options.ddCustomClass || (this.options.customClass && this.options.customClass + '-dd'));

			// creating fake option list
			this.reset();

			// disable select if an option or attribute are truthy
			this.toggle(!(this.options.isDisabled || this.$el.prop('disabled')));

			// click event for fake select
			this.$link.on('click.ikSelect', $.proxy(this, '_linkClick'));

			this.$el.on({
				// when focus is on the original select add a focus class to the fake one
				'focus.ikSelect': $.proxy(this, '_elFocus'),
				// when focus lost remove the focus class from the fake one
				'blur.ikSelect': $.proxy(this, '_elBlur'),
				// make sure that the fake select shows correct data
				'change.ikSelect': $.proxy(this, '_syncOriginalOption'),
				// keyboard controls for the fake select
				'keydown.ikSelect keyup.ikSelect': $.proxy(this, '_elKeyUpDown')
			});

			this.$list.on({
				'click.ikSelect': $.proxy(this, '_optionClick'),
				'mouseover.ikSelect': $.proxy(this, '_optionMouseover')
			}, '.ik_select_option');

			// stop propagation of click events on the wrapper
			this.$wrapper.on('click', function () {
				return false;
			});

			// appending the fake select right after the original one
			this.$el.after(this.$wrapper);

			// set correct dimensions
			this.redraw();

			// move original select inside the wrapper
			this.$el.appendTo(this.$wrapper);

			this.options.onInit(this);
			this.$el.trigger('ikinit', this);
		},

		// click listener for fake select
		_linkClick: function () {
			if (this.isDisabled) {
				return;
			}
			if (this === instOpened) {
				this.hideDropdown();
			} else {
				this.showDropdown();
			}
		},

		// click listener for the fake options
		_optionClick: function () {
			this._makeOptionActive(this.searchIndexes ? this.$optionSetOriginal.index(this.$hover) : this.hoverIndex, true);
			this.hideDropdown();
			this.$el.change().focus();
		},

		// hover listener for the fake options
		_optionMouseover: function (event) {
			var $option = $(event.currentTarget);
			if ($option.hasClass('ik_select_option_disabled')) {
				return;
			}
			this.$hover.removeClass('ik_select_hover');
			this.$hover = $option.addClass('ik_select_hover');
			this.hoverIndex = this.$optionSet.index(this.$hover);
		},

		// makes fake option active without syncing the original select
		_makeOptionActive: function (index, shouldSync) {
			var $option = $(this.el.options[index]);
			this.$linkText.text($option.text());

			this.$link.toggleClass('ik_select_link_novalue', !$option.attr('value'));

			this.$hover.removeClass('ik_select_hover');
			this.$active.removeClass('ik_select_active');
			this.$hover = this.$active = this.$optionSet.eq(index).addClass('ik_select_hover ik_select_active');
			this.hoverIndex = index;

			if (shouldSync) {
				this._syncFakeOption();
			}
		},

		// keyboard controls for the fake select
		_elKeyUpDown: function (event) {
			var $handle = $(event.currentTarget);
			var type = event.type;
			var keycode = event.which;
			var newTop;

			switch (keycode) {
			case 38: // up
				if (type === 'keydown') {
					event.preventDefault();
					this._moveToPrevActive();
				}
				break;
			case 40: // down
				if (type === 'keydown') {
					event.preventDefault();
					this._moveToNextActive();
				}
				break;
			case 33: // page up
				if (type === 'keydown') {
					event.preventDefault();
					newTop = this.$hover.position().top - this.$listInner.height();
					this._moveToPrevActive(function (optionTop) {
						return optionTop <= newTop;
					});
				}
				break;
			case 34: // page down
				if (type === 'keydown') {
					event.preventDefault();
					newTop = this.$hover.position().top + this.$listInner.height();
					this._moveToNextActive(function (optionTop) {
						return optionTop >= newTop;
					});
				}
				break;
			case 36: // home
				if (type === 'keydown' && $handle.is(this.$el)) {
					event.preventDefault();
					this._moveToFirstActive();
				}
				break;
			case 35: // end
				if (type === 'keydown' && $handle.is(this.$el)) {
					event.preventDefault();
					this._moveToLastActive();
				}
				break;
			case 32: // space
				if (type === 'keydown' && $handle.is(this.$el)) {
					event.preventDefault();
					if (! this.$dropdown.is(':visible')) {
						this._linkClick();
					} else {
						this.$hover.click();
					}
				}
				break;
			case 13: // enter
				if (type === 'keydown' && this.$dropdown.is(':visible')) {
					event.preventDefault();
					this.$hover.click();
				}
				break;
			case 27: // esc
				if (type === 'keydown' && this.$dropdown.is(':visible')) {
					event.preventDefault();
					this.hideDropdown();
				}
				break;
			case 9: // tab
				if (type === 'keydown') {
					if ($.browser.webkit && this.$dropdown.is(':visible')) {
						event.preventDefault();
					} else {
						this.hideDropdown();
					}
				}
				break;
			default:
				if (type === 'keyup' && $handle.is(this.$el)) {
					this._syncOriginalOption();
				}
				break;
			}

			// mozilla ignores preventDefault for select navigation
			// this ensures that original select is in sync
			if (type === 'keyup' && $.browser.mozilla) {
				this._syncFakeOption();
			}

			if (type === 'keydown') {
				this.options.onKeyDown(this, keycode);
				this.$el.trigger('ikkeydown', [this, keycode]);
			}
			if (type === 'keyup') {
				this.options.onKeyUp(this, keycode);
				this.$el.trigger('ikkeyup', [this, keycode]);
			}
		},

		// controls hover/active states for options and makes selected with keyboard options fully visible
		_moveTo: function (index) {
			var optionTopLine, optionBottomLine;
			var $optgroup;

			if (!this.$dropdown.is(':visible') && $.browser.webkit) {
				this.showDropdown();
				return this;
			}

			if (!this.$dropdown.is(':visible') || $.browser.mozilla) {
				this._makeOptionActive(index, true);
			} else {
				this.$hover.removeClass('ik_select_hover');
				this.$hover = this.$optionSet.eq(index).addClass('ik_select_hover');
				this.hoverIndex = index;
			}

			// make option fully visible
			optionTopLine = this.$hover.position().top;
			optionBottomLine = optionTopLine + this.$active.outerHeight();
			// make optgroup label visible if first option witin this optgroup is hovered
			if (!this.$hover.index()) {
				$optgroup = this.$hover.closest('.ik_select_optgroup');
				if ($optgroup.length) {
					optionTopLine = $optgroup.position().top;
				}
			}
			if (optionBottomLine > this.$listInner.height()) {
				this.$listInner.scrollTop(this.$listInner.scrollTop() + optionBottomLine - this.$listInner.height());
			} else if (optionTopLine < 0) {
				this.$listInner.scrollTop(this.$listInner.scrollTop() + optionTopLine);
			}

			this.options.onHoverMove(this);
			this.$el.trigger('ikhovermove', this);
		},

		_moveToFirstActive: function () {
			for (var i = 0; i < this.$optionSet.length; i++) {
				if (!this.$optionSet.eq(i).hasClass('ik_select_option_disabled')) {
					this._moveTo(i);
					break;
				}
			}
		},

		_moveToLastActive: function () {
			for (var i = this.$optionSet.length - 1; i >= 0; i++) {
				if (!this.$optionSet.eq(i).hasClass('ik_select_option_disabled')) {
					this._moveTo(i);
					break;
				}
			}
		},

		_moveToPrevActive: function (condition) {
			var $option;
			for (var i = this.hoverIndex - 1; i >= 0; i--) {
				$option = this.$optionSet.eq(i);
				if (!$option.hasClass('ik_select_option_disabled') && (typeof condition === 'undefined' || condition($option.position().top))) {
					this._moveTo(i);
					break;
				}
			}
		},

		_moveToNextActive: function (condition) {
			var $option;
			for (var i = this.hoverIndex + 1; i < this.$optionSet.length; i++) {
				$option = this.$optionSet.eq(i);
				if (!$option.hasClass('ik_select_option_disabled') && (typeof condition === 'undefined' || condition($option.position().top))) {
					this._moveTo(i);
					break;
				}
			}
		},

		// when focus is on the original select add a focus class to the fake one
		_elFocus:  function () {
			var wrapperOffsetTop, wrapperHeight, windowScrollTop, windowHeight;
			if (this.isDisabled) {
				return this;
			}
			this.$link.addClass('ik_select_link_focus');

			// scroll the window so that focused select is visible
			wrapperOffsetTop = this.$wrapper.offset().top;
			wrapperHeight = this.$wrapper.height();
			windowScrollTop = $window.scrollTop();
			windowHeight = $window.height();
			if ((wrapperOffsetTop + wrapperHeight > windowScrollTop + windowHeight) ||
				(wrapperOffsetTop < windowScrollTop)) {
				$window.scrollTop(wrapperOffsetTop - windowHeight / 2);
			}
		},

		// when focus lost remove the focus class from the fake one
		_elBlur: function () {
			this.$link.removeClass('ik_select_link_focus');
		},

		// filtering on key up
		_filterKeyup: function () {
			var filterVal = $.trim(this.$filter.val());
			var filterValOld;
			this.$listInner.show();

			if (typeof this.searchIndexes === 'undefined') {
				this.$optionSetOriginal = this.$optionSet;
				this.searchIndexes = $.makeArray(this.$optionSet.map(function (optionIndex, option) {
					return $(option).text().toLowerCase();
				}));
			}

			if (filterVal !== filterValOld) {
				if (filterVal === '') {
					this.$optionSet = this.$optionSetOriginal.show();
					this.$optgroupSet.show();
					this.$nothingFoundText.remove();
				} else {
					this.$optionSet = $([]);
					this.$optgroupSet.show();
					this.$optionSetOriginal.each($.proxy(function (optionIndex, option) {
						var $option = $(option);
						if (this.searchIndexes[optionIndex].indexOf(filterVal.toLowerCase()) >= 0) {
							this.$optionSet = this.$optionSet.add($option);
							$option.show();
						} else {
							$option.hide();
						}
					}, this));

					if (this.$optionSet.length) {
						this.$nothingFoundText.remove();
						this.$optgroupSet.each(function (optgroupIndex, optgroup) {
							var $optgroup = $(optgroup);
							if (!$('.ik_select_option:visible', $optgroup).length) {
								$optgroup.hide();
							}
						});

						if (!this.$hover.is(':visible')) {
							this._moveToFirstActive();
						}
					} else {
						this.$listInner.hide();
						this.$list.append(this.$nothingFoundText);
					}
				}

				filterValOld = filterVal;
			}
		},

		// sync selected option in the fake select with the original one
		_syncFakeOption: function () {
			this.el.selectedIndex = this.hoverIndex;
		},

		// sync selected option in the original select with the fake one
		_syncOriginalOption: function () {
			this._makeOptionActive(this.el.selectedIndex);
		},

		// sets fixed height to dropdown if it's bigger than ddMaxHeight
		_fixHeight: function () {
			this.$dropdown.show();
			this.$listInner.css('height', 'auto');
			if (this.$listInner.height() > this.options.ddMaxHeight) {
				this.$listInner.css({
					overflow: 'auto',
					height: this.options.ddMaxHeight,
					position: 'relative'
				});
			}
			this.$dropdown.hide();
		},

		// calculates the needed data for showing the dropdown
		redraw: function () {
			var maxWidthOuter, scrollbarWidth, wrapperParentWidth;

			if (this.options.filter) {
				this.$filter.hide();
			}

			this.$wrapper.css({
				position: 'relative'
			});
			this.$dropdown.css({
				position: 'absolute',
				zIndex: 9998,
				width: '100%'
			});
			this.$list.css({
				position: 'relative'
			});

			this._fixHeight();

			// width calculations for the fake select when "autoWidth" is "true"
			if (this.options.dynamicWidth || this.options.autoWidth || this.options.ddFullWidth) {
				this.$wrapper.width('');

				this.$dropdown.show().width(9999);
				this.$listInner.css('float', 'left');
				this.$list.css('float', 'left');
				maxWidthOuter = this.$list.outerWidth(true) + (this.options.extraWidth || 0);
				scrollbarWidth = this.$listInner.width() - this.$listInnerUl.width();
				this.$list.css('float', '');
				this.$listInner.css('float', '');
				this.$dropdown.css('width', '100%');

				if (this.options.ddFullWidth) {
					this.$dropdown.width(maxWidthOuter + scrollbarWidth);
				}

				if (this.options.dynamicWidth) {
					this.$wrapper.css({
						display: 'inline-block',
						width: 'auto',
						verticalAlign: 'top'
					});
				} else if (this.options.autoWidth) {
					this.$wrapper.width(maxWidthOuter + (this.options.equalWidths ? scrollbarWidth : 0)).addClass('ik_select_autowidth');
				}

				wrapperParentWidth = this.$wrapper.parent().width();
				if (this.$wrapper.width() > wrapperParentWidth) {
					this.$wrapper.width(wrapperParentWidth);
				}
			}

			if (this.options.filter) {
				this.$filter.show().outerWidth(this.$filterWrap.width());
			}

			this.$dropdown.hide();

			// hide the original select
			this.$el.css({
				position: 'absolute',
				margin: 0,
				padding: 0,
				top: 0,
				left: -9999
			});

			// show the original select in mobile browsers
			if ($.browser.mobile) {
				this.$el.css({
					opacity: 0,
					left: 0,
					height: this.$wrapper.height(),
					width: this.$wrapper.width()
				});
			}
		},

		// creates or recreates dropdown and sets selected options's text into fake select
		reset: function () {
			var html = '';

			// init fake select's text
			this.$linkText.html(this.$el.val());

			this.$listInner.empty();

			// creating an ul>li list identical to the original dropdown
			html = '<ul>';
			this.$el.children().each($.proxy(function (childIndex, child) {
				var $child = $(child);
				var tagName = child.tagName.toLowerCase();
				var options;
				if (tagName === 'optgroup') {
					options = $child.children().map($.proxy(function (optionIndex, option) {
						return this._generateOptionObject($(option));
					}, this));
					options = $.makeArray(options);
					html += this._renderListOptgroup({
						label: $child.attr('label') || '&nbsp;',
						isDisabled: $child.is(':disabled'),
						options: options
					});
				} else if (tagName === 'option') {
					html += this._renderListOption(this._generateOptionObject($child));
				}
			}, this));
			html += '</ul>';
			this.$listInner.append(html);
			this._syncOriginalOption();

			this.$listInnerUl = $('> ul', this.$listInner);
			this.$optgroupSet = $('.ik_select_optgroup', this.$listInner);
			this.$optionSet = $('.ik_select_option', this.$listInner);
		},

		// hides dropdown
		hideDropdown: function () {
			if (this.options.filter) {
				this.$filter.val('');
				this._filterKeyup();
			}

			this.$dropdown.hide().appendTo(this.$wrapper).css({
				left: '',
				top: ''
			});

			if (this.options.extractLink) {
				this.$wrapper.outerWidth(this.$wrapper.data('outerWidth'));
				this.$wrapper.height('');
				this.$link.removeClass('ik_select_link_extracted').css({
					position: '',
					top: '',
					left: '',
					zIndex: ''
				}).prependTo(this.$wrapper);
			}

			instOpened = null;
			this.$el.focus();

			this.options.onHide(this);
			this.$el.trigger('ikhide', this);
		},

		// shows dropdown
		showDropdown: function () {
			var dropdownOffset, dropdownOuterWidth, dropdownOuterHeight;
			var wrapperOffset, wrapperOuterWidth;
			var windowWidth, windowHeight, windowScroll;
			var linkOffset;

			if (instOpened === this || !this.$optionSet.length) {
				return;
			} else if (instOpened) {
				instOpened.hideDropdown();
			}

			this._syncOriginalOption();
			this.$dropdown.show();

			dropdownOffset = this.$dropdown.offset();
			dropdownOuterWidth = this.$dropdown.outerWidth(true);
			dropdownOuterHeight = this.$dropdown.outerHeight(true);
			wrapperOffset = this.$wrapper.offset();
			windowWidth = $window.width();
			windowHeight = $window.height();
			windowScroll = $window.scrollTop();

			// if the dropdown's right border is beyond window's edge then move the dropdown to the left so that it fits
			if (this.options.ddFullWidth && wrapperOffset.left + dropdownOuterWidth > windowWidth) {
				dropdownOffset.left = windowWidth - dropdownOuterWidth;
			}

			// if the dropdown's bottom border is beyond window's edge then move the dropdown to the top so that it fits
			if (dropdownOffset.top + dropdownOuterHeight > windowScroll + windowHeight) {
				dropdownOffset.top = windowScroll + windowHeight - dropdownOuterHeight;
			}

			this.$dropdown.css({
				left: dropdownOffset.left,
				top: dropdownOffset.top,
				width: this.$dropdown.width()
			}).appendTo('body');

			if (this.options.extractLink) {
				linkOffset = this.$link.offset();
				wrapperOuterWidth = this.$wrapper.outerWidth();
				this.$wrapper.data('outerWidth', wrapperOuterWidth);
				this.$wrapper.outerWidth(wrapperOuterWidth);
				this.$wrapper.outerHeight(this.$wrapper.outerHeight());
				this.$link.outerWidth(this.$link.outerWidth());
				this.$link.addClass('ik_select_link_extracted').css({
					position: 'absolute',
					top: linkOffset.top,
					left: linkOffset.left,
					zIndex: 9999
				}).appendTo('body');
			}

			this.$listInner.scrollTop(this.$active.position().top - this.$list.height() / 2);

			if (this.options.filter) {
				this.$filter.focus();
			} else {
				this.$el.focus();
			}

			instOpened = this;

			this.options.onShow(this);
			this.$el.trigger('ikshow', this);
		},

		_generateOptionObject: function ($option) {
			return {
				value: $option.val(),
				label: $option.html() || '&nbsp;',
				isDisabled: $option.is(':disabled')
			};
		},

		// generates option code for the fake dropdown
		_renderListOption: function (option) {
			var html;
			var disabledClass = option.isDisabled ? ' ik_select_option_disabled' : '';
			html = '<li class="ik_select_option' + disabledClass + '" data-value="' + option.value + '">';
			html += '<span class="ik_select_option_label">';
			html += option.label;
			html += '</span>';
			html += '</li>';
			return html;
		},

		// generates optgroup code for the fake dropdown
		_renderListOptgroup: function (optgroup) {
			var html;
			var disabledClass = optgroup.isDisabled ? ' ik_select_optgroup_disabled' : '';
			html = '<li class="ik_select_optgroup' + disabledClass + '">';
			html += '<div class="ik_select_optgroup_label">' + optgroup.label + '</div>';
			html += '<ul>';
			if ($.isArray(optgroup.options)) {
				$.each(optgroup.options, $.proxy(function (optionIndex, option) {
					html += this._renderListOption({
						value: option.value,
						label: option.label || '&nbsp;',
						isDisabled: option.isDisabled
					});
				}, this));
			}
			html += '</ul>';
			html += '</li>';
			return html;
		},

		// generates option code for the select
		_renderOption: function (option) {
			return '<option value="' + option.value + '">' + option.label + '</option>';
		},

		// generates optgroup code for the select
		_renderOptgroup: function (optgroup) {
			var html;
			html = '<optgroup label="' + optgroup.label + '">';
			if ($.isArray(optgroup.options)) {
				$.each(optgroup.options, $.proxy(function (optionIndex, option) {
					html += this._renderOption(option);
				}, this));
			}
			html += '</option>';
			return html;
		},

		addOptions: function (options, optionIndex, optgroupIndex) {
			var listHtml = '', selectHtml = '';
			var $destinationUl = this.$listInnerUl;
			var $destinationOptgroup = this.$el;
			var $ulOptions, $optgroupOptions;

			options = $.isArray(options) ? options : [options];

			$.each(options, $.proxy(function (index, option) {
				listHtml += this._renderListOption(option);
				selectHtml += this._renderOption(option);
			}, this));

			if ($.isNumeric(optgroupIndex) && optgroupIndex < this.$optgroupSet.length) {
				$destinationUl = this.$optgroupSet.eq(optgroupIndex);
				$destinationOptgroup = $('optgroup', this.$el).eq(optgroupIndex);
			}
			if ($.isNumeric(optionIndex)) {
				$ulOptions = $('.ik_select_option', $destinationUl);
				if (optionIndex < $ulOptions.length) {
					$ulOptions.eq(optionIndex).before(listHtml);
					$optgroupOptions = $('option', $destinationOptgroup);
					$optgroupOptions.eq(optionIndex).before(selectHtml);
				}
			}
			if (!$optgroupOptions) {
				$destinationUl.append(listHtml);
				$destinationOptgroup.append(selectHtml);
			}

			this.$optionSet = $('.ik_select_option', this.$listInner);
			this._fixHeight();
		},

		addOptgroups: function (optgroups, optgroupIndex) {
			var listHtml = '', selectHtml = '';
			if (!optgroups) {
				return;
			}
			optgroups = $.isArray(optgroups) ? optgroups : [optgroups];

			$.each(optgroups, $.proxy(function (optgroupIndex, optgroup) {
				listHtml += this._renderListOptgroup(optgroup);
				selectHtml += this._renderOptgroup(optgroup);
			}, this));

			if ($.isNumeric(optgroupIndex) && optgroupIndex < this.$optgroupSet.length) {
				this.$optgroupSet.eq(optgroupIndex).before(listHtml);
				$('optgroup', this.$el).eq(optgroupIndex).before(selectHtml);
			} else {
				this.$listInnerUl.append(listHtml);
				this.$el.append(selectHtml);
			}

			this.$optgroupSet = $('.ik_select_optgroup', this.$listInner);
			this.$optionSet = $('.ik_select_option', this.$listInner);
			this._fixHeight();
		},

		removeOptions: function (optionIndexes, optgroupIndex) {
			var $removeList = $([]);
			var $listContext;
			var $selectContext;

			if ($.isNumeric(optgroupIndex)) {
				if (optgroupIndex < 0) {
					$listContext = $('> .ik_select_option', this.$listInnerUl);
					$selectContext = $('> option', this.$el);
				} else if (optgroupIndex < this.$optgroupSet.length) {
					$listContext = $('.ik_select_option', this.$optgroupSet.eq(optgroupIndex));
					$selectContext = $('optgroup', this.$el).eq(optgroupIndex).find('option');
				}
			}
			if (!$listContext) {
				$listContext = this.$optionSet;
				$selectContext = $(this.el.options);
			}

			if (!$.isArray(optionIndexes)) {
				optionIndexes = [optionIndexes];
			}

			$.each(optionIndexes, $.proxy(function (index, optionIndex) {
				if (optionIndex < $listContext.length) {
					$removeList = $removeList.add($listContext.eq(optionIndex)).add($selectContext.eq(optionIndex));
				}
			}, this));

			$removeList.remove();
			this.$optionSet = $('.ik_select_option', this.$listInner);
			this._syncOriginalOption();
			this._fixHeight();
		},

		removeOptgroups: function (optgroupIndexes) {
			var $removeList = $([]);
			var $selectOptgroupSet = $('optgroup', this.el);

			if (!$.isArray(optgroupIndexes)) {
				optgroupIndexes = [optgroupIndexes];
			}

			$.each(optgroupIndexes, $.proxy(function (index, optgroupIndex) {
				if (optgroupIndex < this.$optgroupSet.length) {
					$removeList = $removeList.add(this.$optgroupSet.eq(optgroupIndex)).add($selectOptgroupSet.eq(optgroupIndex));
				}
			}, this));

			$removeList.remove();
			this.$optionSet = $('.ik_select_option', this.$listInner);
			this.$optgroupSet = $('.ik_select_optgroup', this.$listInner);
			this._syncOriginalOption();
			this._fixHeight();
		},

		// disable select
		disable: function () {
			this.toggle(false);
		},

		// enable select
		enable: function () {
			this.toggle(true);
		},

		// toggle select
		toggle: function (bool) {
			this.isDisabled = typeof bool !== 'undefined' ? !bool : !this.isDisabled;
			this.$el.prop('disabled', this.isDisabled);
			this.$link.toggleClass('ik_select_link_disabled', this.isDisabled);
		},

		// make option selected by value
		select: function (value, isIndex) {
			if (!isIndex) {
				this.$el.val(value);
			} else {
				this.el.selectedIndex = value;
			}
			this._syncOriginalOption();
		},

		disableOptgroups: function (optgroupIndexes) {
			this.toggleOptgroups(optgroupIndexes, false);
		},

		enableOptgroups: function (optgroupIndexes) {
			this.toggleOptgroups(optgroupIndexes, true);
		},

		toggleOptgroups: function (optgroupIndexes, bool) {
			if (!$.isArray(optgroupIndexes)) {
				optgroupIndexes = [optgroupIndexes];
			}

			$.each(optgroupIndexes, $.proxy(function (index, optgroupIndex) {
				var isDisabled;
				var $optionSet, indexes = [], indexFirst;
				var $optgroup = $('optgroup', this.$el).eq(optgroupIndex);
				isDisabled = typeof bool !== 'undefined' ? bool : $optgroup.prop('disabled');
				$optgroup.prop('disabled', !isDisabled);
				this.$optgroupSet.eq(optgroupIndex).toggleClass('ik_select_optgroup_disabled', !isDisabled);

				$optionSet = $('option', $optgroup);
				indexFirst = $(this.el.options).index($optionSet.eq(0));
				for (var i = indexFirst; i < indexFirst + $optionSet.length; i++) {
					indexes.push(i);
				}
				this.toggleOptions(indexes, true, isDisabled);
			}, this));

			this._syncOriginalOption();
		},

		disableOptions: function (lookupValues, isIndex) {
			this.toggleOptions(lookupValues, isIndex, false);
		},

		enableOptions: function (lookupValues, isIndex) {
			this.toggleOptions(lookupValues, isIndex, true);
		},

		toggleOptions: function (lookupValues, isIndex, bool) {
			var $selectOptionSet = $('option', this.el);
			if (!$.isArray(lookupValues)) {
				lookupValues = [lookupValues];
			}

			var toggleOption = $.proxy(function ($option, optionIndex) {
				var isDisabled = typeof bool !== 'undefined' ? bool : $option.prop('disabled');
				$option.prop('disabled', !isDisabled);
				this.$optionSet.eq(optionIndex).toggleClass('ik_select_option_disabled', !isDisabled);
			}, this);

			$.each(lookupValues, function (index, lookupValue) {
				if (!isIndex) {
					$selectOptionSet.each(function (optionIndex, option) {
						var $option = $(option);
						if ($option.val() === lookupValue) {
							toggleOption($option, optionIndex);
							return this;
						}
					});
				} else {
					toggleOption($selectOptionSet.eq(lookupValue), lookupValue);
				}
			});

			this._syncOriginalOption();
		},

		// detach plugin from the orignal select
		detach: function () {
			this.$el.off('.ikSelect').css({
				width: '',
				height: '',
				left: '',
				top: '',
				position: '',
				margin: '',
				padding: ''
			});

			this.$wrapper.before(this.$el);
			this.$wrapper.remove();
			this.$el.removeData('plugin_ikSelect');
		}
	});

	$.fn.ikSelect = function (options) {
		var args;
		//do nothing if opera mini
		if ($.browser.operamini) {
			return this;
		}

		args = Array.prototype.slice.call(arguments, 1);

		return this.each(function () {
			var plugin;
			if (!$.data(this, 'plugin_ikSelect')) {
				$.data(this, 'plugin_ikSelect', new IkSelect(this, options));
			} else if (typeof options === 'string') {
				plugin = $.data(this, 'plugin_ikSelect');
				if (typeof plugin[options] === 'function') {
					plugin[options].apply(plugin, args);
				}
			}
		});
	};

	$.ikSelect = {
		extendDefaults: function (options) {
			$.extend(defaults, options);
		}
	};

	$(document).bind('click.ikSelect', function () {
		if (instOpened) {
			instOpened.hideDropdown();
		}
	});
}));
