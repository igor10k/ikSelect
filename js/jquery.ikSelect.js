// ikSelect 0.9.4
// Copyright (c) 2012 Igor Kozlov
// i10k.ru

;(function ($, window, document, undefined) {
	var $window = $(window), defaults = {
		syntax: "<div class=\"ik_select_link\"><span class=\"ik_select_link_text\"></span></div><div class=\"ik_select_block\"><div class=\"ik_select_list\"></div></div>",
		autoWidth: true,
		ddFullWidth: true,
		equalWidths: true,
		customClass: "",
		ddCustomClass: "",
		ddMaxHeight: 200,
		filter: false,
		nothingFoundText: "Nothing found",
		onShow: function () {},
		onHide: function () {},
		onKeyUp: function () {},
		onKeyDown: function () {},
		onHoverMove: function () {}
        },

		selectOpened = $([]), // currently opened select
		shownOnPurpose = false, // true if show_dropdown was called using API
		scrollbarWidth = -1;

	$.browser = $.browser || {};
	$.browser.webkit = $.browser.webkit || (/webkit/i.test(navigator.userAgent.toLowerCase()));
	$.browser.mobile = (/iphone|ipad|ipod|android/i.test(navigator.userAgent.toLowerCase()));
	$.browser.operamini = Object.prototype.toString.call(window.operamini) === "[object OperaMini]";

	function IkSelect(element, options) {
		var ikselect = this, dataOptions = {};

		ikselect.element = element;
		ikselect._defaults = defaults;

		if (typeof(element) === 'undefined') {
			return ikselect;
		}
		ikselect.select = $(element); // original select

		for (var key in defaults) {
			dataOptions[key] = ikselect.select.data(key.toLowerCase());
		}

		ikselect.options = $.extend({}, defaults, options, dataOptions);

		ikselect.fakeSelect = $("<div class=\"ik_select\">" + ikselect.options.syntax + "</div>"); // fake select object made with passed syntax
		ikselect.link = $(".ik_select_link", ikselect.fakeSelect); // fake select
		ikselect.linkText = $(".ik_select_link_text", ikselect.fakeSelect); // fake select's text
		ikselect.block = $(".ik_select_block", ikselect.fakeSelect); // fake select's dropdown
		ikselect.list = $(".ik_select_list", ikselect.fakeSelect); // fake select's list inside of dropdown
		ikselect.listInner = $("<div class=\"ik_select_list_inner\"/>"); // support block for scroll

		ikselect.filter = $([]); // filter text input
		ikselect.listItemsOriginal = $([]); // contains original list items when filtering
		ikselect.nothingFoundText = $("<div class=\"ik_nothing_found\"/>").html(ikselect.options.nothingFoundText);

		if (ikselect.options.filter && ! $.browser.mobile) {
			ikselect.filterWrap = $(".ik_select_filter_wrap", ikselect.fakeSelect);

			if (! ikselect.filterWrap.length) {
				ikselect.filterWrap = $("<div class=\"ik_select_filter_wrap\"/>");
			}

			ikselect.filter = $("<input type=\"text\" class=\"ik_select_filter\">");

			ikselect.filterWrap.append(ikselect.filter);
		}

		ikselect.active = $([]);
		ikselect.hover = $([]);
		ikselect.hoverIndex = -1;

		ikselect.listItems = $([]);
		ikselect.listOptgroupItems = $([]);

		ikselect.init();
	}

	$.extend(IkSelect.prototype, {
		init: function () {
			var ikselect = this,

				fakeSelect = ikselect.fakeSelect,
				select = ikselect.select,
				link = ikselect.link,
				block = ikselect.block,
				list = ikselect.list,
				listInner = ikselect.listInner,

				filter = ikselect.filter,
				filterVal,
				filterValOld = "",
				searchIndexes,

				isDisabled = link.hasClass("ik_select_link_disabled"),

				fakeSelectoffsetTop = fakeSelect.offset().top,
				fakeSelectHeight = fakeSelect.height(),
				$windowHeight = $window.height(),
				$windowScroll = $window.scrollTop();

			list.append(listInner);

			fakeSelect.addClass(ikselect.options.customClass);
			block.addClass(ikselect.options.ddCustomClass);

			//creating fake option list
			ikselect.reset_all();

			if (select.attr("disabled")) {
				ikselect.disable_select();
			}

			// click event for fake select
			link.bind("click.ikSelect", function () {
				if (isDisabled) {
					return this;
				}
				if (selectOpened.length && ikselect.element === selectOpened[0]) {
					selectOpened.data("plugin_ikSelect").hide_block();
					return this;
				}
				ikselect.show_block();
				if (ikselect.options.filter) {
					filter.focus();
				} else {
					select.focus();
				}
			});

			// when focus is on original select add "focus" class to the fake one
			select.bind("focus.ikSelect", function () {
				if (isDisabled) {
					return this;
				}
				link.addClass("ik_select_link_focus");

				// scoll the window so that focused select is visible
				if ((fakeSelectoffsetTop + fakeSelectHeight > $windowScroll + $windowHeight) || (fakeSelectoffsetTop + fakeSelectHeight < $windowScroll)) {
					$window.scrollTop(fakeSelectoffsetTop - $windowHeight / 2);
				}
			});

			// when focus lost remove "focus" class from the fake one
			select.bind("blur.ikSelect", function () {
				if (isDisabled) {
					return this;
				}
				link.removeClass("ik_select_link_focus");
			});

			// sync fake select on mobile devices and a way to outplay the changing of select on scroll anywhere in IE6
			select.bind("change.ikSelect", function () {
				ikselect._select_fake_option();
			});

			// filtering using filter
			filter.bind("keyup.ikSelect", function () {
				listInner.show();
				filterVal = filter.val();

				if (typeof searchIndexes === "undefined") {
					ikselect.listItemsOriginal = ikselect.listItems;
					searchIndexes = $.makeArray($(".ik_select_option", ikselect.listItems).map(function (index, value) {
						return $(value).text().toLowerCase();
					}));
				}

				if (filterVal !== filterValOld) {
					if (filterVal === "") {
						ikselect.listItems = ikselect.listItemsOriginal.show();
						ikselect.listOptgroupItems.show();
						ikselect.nothingFoundText.remove();
					} else {
						ikselect.listItems = $([]);
						ikselect.listOptgroupItems.show();
						ikselect.listItemsOriginal.each(function (index) {
							if (searchIndexes[index].indexOf(filterVal) >= 0) {
								ikselect.listItems = ikselect.listItems.add(this);
								$(this).show();
							} else {
								$(this).hide();
							}
						});

						if (ikselect.listItems.length) {
							ikselect.nothingFoundText.remove();
							ikselect.listOptgroupItems.each(function () {
								var optgroup = $(this);
								if (! $("> ul > li:visible", optgroup).length) {
									optgroup.hide();
								}
							});

							if (! ikselect.listItems.filter(ikselect.hover).length && ikselect.listItems.length) {
								ikselect._move_to(ikselect.listItems.eq(0));
							}

							ikselect.hoverIndex = ikselect.listItems.index(ikselect.hover);
						} else {
							listInner.hide();
							list.append(ikselect.nothingFoundText);
						}
					}

					filterValOld = filterVal;
				}
			});

			// keyboard controls for the fake select and fake dropdown
			select.add(filter).bind("keydown.ikSelect keyup.ikSelect", function (event) {
				var handle = $(this),
					listItems = ikselect.listItems,
					keycode = (event.which) ? event.which : event.keyCode,
					type = event.type, next, prev;

				if (ikselect.hoverIndex < 0) {
					ikselect.hoverIndex = listItems.index(ikselect.hover);
				}

				switch (keycode) {
				case 40: //down
					if (type === "keydown") {
						event.preventDefault();

						if (ikselect.hoverIndex < listItems.length - 1) {
							next = listItems.eq(++ikselect.hoverIndex);

							while (next && next.hasClass("ik_select_option_disabled")) {
								next = listItems.filter(":eq(" + (++ikselect.hoverIndex) + ")");
							}
						}

						if (next) {
							ikselect._move_to(next);
						}
					}
					break;
				case 38: //up
					if (type === "keydown") {
						event.preventDefault();

						if (ikselect.hoverIndex > 0) {
							prev = listItems.eq(--ikselect.hoverIndex);

							while (prev && prev.hasClass("ik_select_option_disabled")) {
								prev = listItems.filter(":eq(" + (--ikselect.hoverIndex) + ")");
							}
						}

						if (prev) {
							ikselect._move_to(prev);
						}
					}
					break;
				case 33: //page up
				case 36: //home
					if (handle.is(filter)) {
						return;
					}
					if (type === "keydown") {
						event.preventDefault();
						ikselect._move_to(listItems.filter(".not(ik_select_option_disabled):first"));
					}
					break;
				case 34: //page down
				case 35: //end
					if (handle.is(filter)) {
						return;
					}
					if (type === "keydown") {
						event.preventDefault();
						ikselect._move_to(listItems.filter(".not(ik_select_option_disabled):last"));
					}
					break;
				case 32: //space
					if (type === "keydown" && $(this).is(select)) {
						event.preventDefault();
						if (! block.is(":visible")) {
							link.click();
						} else {
							ikselect._select_real_option();
						}
					}
					break;
				case 13: //enter
					if (type === "keydown" && block.is(":visible")) {
						event.preventDefault();
						ikselect._select_real_option();
					}
					break;
				case 27: //esc
					if (type === "keydown") {
						event.preventDefault();
						ikselect.hide_block();
					}
					break;
				case 9: //tab
					if (type === "keydown") {
						if ($.browser.webkit && block.is(":visible")) {
							event.preventDefault();
						} else {
							ikselect.hide_block();
						}
					}
					break;
				default:
					if (type === "keyup" && $(this).is(select)) {
						ikselect._select_fake_option();
					}
					break;
				}

				if (type === "keydown") {
					ikselect.options.onKeyDown(ikselect, keycode);
					select.trigger("ikkeydown", [ikselect, keycode]);
				}
				if (type === "keyup") {
					ikselect.options.onKeyUp(ikselect, keycode);
					select.trigger("ikkeyup", [ikselect, keycode]);
				}
			});

			// appending fake select right after the original one
			select.after(fakeSelect);

			// appending filter if needed
			if (ikselect.options.filter && ! $.browser.mobile) {
				list.prepend(ikselect.filterWrap);
			}

			// set correct dimensions
			ikselect.redraw();

			select.appendTo(fakeSelect);
		},

		redraw: function () {
			var ikselect = this,
				select = ikselect.select,
				fakeSelect = ikselect.fakeSelect,
				link = ikselect.link,
				block = ikselect.block,
				list = ikselect.list,
				listInner = ikselect.listInner,
				filter = ikselect.filter,

				autoWidth = ikselect.options.autoWidth, // set select width according to the longest option
				ddFullWidth = ikselect.options.ddFullWidth, // set dropdown width according to the longest option
				maxWidthOuter, maxWidthInner,

				calculationContent, w1, w2,

				parentWidth, liFirst, liPaddings, linkPaddings;

			if (ikselect.options.filter) {
				filter.hide();
			}

			// width calculations for the fake select when "autoWidth" is "true"
			if (autoWidth || ddFullWidth) {
				listInner.width("auto");
				$("ul:first", listInner).width("auto");
				fakeSelect.width("auto");

				block.show().width(9999);
				listInner.css("float", "left");
				list.css("position", "absolute");
				maxWidthOuter = list.outerWidth(true);
				maxWidthInner = list.width();
				list.css("position", "static");
				block.css("width", "100%");
				listInner.css("float", "none");

				if (scrollbarWidth === -1) {
					calculationContent = $("<div style=\"width:50px; height:50px; overflow:hidden; position:absolute; top:-200px; left:-200px;\"><div style=\"height:100px;\"></div>");
					$("body").append(calculationContent);
					w1 = $("div", calculationContent).innerWidth();
					calculationContent.css("overflow", "auto");
					w2 = $("div", calculationContent).innerWidth();
					calculationContent.remove();
					scrollbarWidth = w1 - w2;
				}

				parentWidth = fakeSelect.parent().width();
				if (ddFullWidth) {
					block.width(maxWidthOuter);
					listInner.width(maxWidthInner);
					$("ul:first", listInner).width(maxWidthInner);
				}
				if (maxWidthOuter > parentWidth) {
					maxWidthOuter = parentWidth;
				}
				if (autoWidth) {
					liFirst = ikselect.listItems.first();
					liPaddings = parseInt(liFirst.css("paddingLeft"), 10) + parseInt(liFirst.css("paddingRight"), 10);
					linkPaddings = link.outerWidth(true) - link.width();
					fakeSelect.width(linkPaddings > liPaddings ? maxWidthOuter - liPaddings + linkPaddings : maxWidthOuter).addClass("ik_select_autowidth");
				}
			}

			if (ikselect.options.filter) {
				filter.show().outerWidth(ikselect.filterWrap.width());
			}

			block.hide();

			ikselect._fix_height();

			// hide the original select
			select.css({
				position: "absolute",
				margin: 0,
				padding: 0,
				left: -9999,
				top: 0
			});

			// show the original select in mobile browsers
			if ($.browser.mobile) {
				select.css({
					opacity: 0,
					left: 0,
					height: fakeSelect.height(),
					width: fakeSelect.width()
				});
			}
		},

		// creates or recreates dropdown and sets selected options's text into fake select
		reset_all: function () {
			var ikselect = this,
				select = ikselect.select,
				linkText = ikselect.linkText,
				listInner = ikselect.listInner,
				newOptions, optgroup, option;

			// init fake select's text
			linkText.html(select.val());

			listInner.empty();

			// creating an ul->li list identical to original dropdown
			newOptions = "<ul>";
			select.children().each(function () {
				if (this.tagName === "OPTGROUP") {
					optgroup = $(this);
					newOptions += "<li class=\"ik_select_optgroup" + (optgroup.is(":disabled") ? " ik_select_optgroup_disabled" : "") + "\">";

					newOptions += "<div class=\"ik_select_optgroup_label\">" + optgroup.attr("label") + "</div>";

					newOptions += "<ul>";
					$("option", optgroup).each(function () {
						option = $(this);
						newOptions += "<li" + (option.is(":disabled") ? " class=\"ik_select_option_disabled\"" : "") + "><span class=\"ik_select_option" + (option[0].getAttribute("value") ? "" : " ik_select_option_novalue") + "\" data-title=\"" + option.val() + "\">" + option.html() + "</span></li>";
					});
					newOptions += "</ul>";

					newOptions += "</li>";
				} else {
					option = $(this);
					newOptions += "<li" + (option.is(":disabled") ? " class=\"ik_select_option_disabled\"" : "") + "><span class=\"ik_select_option" + (option[0].getAttribute("value") ? "" : " ik_select_option_novalue") + "\" data-title=\"" + option.val() + "\">" + option.html() + "</span></li>";
				}
			});
			newOptions += "</ul>";
			listInner.append(newOptions);
			ikselect._select_fake_option();

			ikselect.listOptgroupItems = $(".ik_select_optgroup", listInner);
			ikselect.listItems = $("li:not(.ik_select_optgroup)", listInner);

			ikselect._attach_list_events(ikselect.listItems);
		},

		// binds click and mouseover events to dropdown's options
		_attach_list_events: function (jqObj) {
			var ikselect = this,
				select = ikselect.select,
				link = ikselect.link,
				linkText = ikselect.linkText,

				listItemsEnabled = jqObj.not(".ik_select_option_disabled"),
				option;

			// click events for the fake select's options
			listItemsEnabled.bind("click.ikSelect", function () {
				option = $(".ik_select_option", this);
				linkText.html(option.html());
				select.val(option.data("title"));
				ikselect.active.removeClass("ik_select_active");
				ikselect.active = $(this).addClass("ik_select_active");
				ikselect.hide_block();
				if (option.hasClass("ik_select_option_novalue")) {
					link.addClass("ik_select_link_novalue");
				} else {
					link.removeClass("ik_select_link_novalue");
				}
				select.change();
				select.focus();
			});

			// hover event for the fake options
			listItemsEnabled.bind("mouseover.ikSelect", function () {
				ikselect.hoverIndex = -1;
				ikselect.hover.removeClass("ik_select_hover");
				ikselect.hover = $(this).addClass("ik_select_hover");
			});

			listItemsEnabled.addClass("ik_select_has_events");
		},

		// unbinds click and mouseover events from dropdown's options
		_detach_list_events: function (jqObj) {
			jqObj.unbind(".ikSelect").removeClass("ik_select_has_events");
		},

		// change the defaults for all new instances
		set_defaults: function (settings) {
			$.extend(this._defaults, settings || {});
			return this;
		},

		// hides dropdown
		hide_block: function () {
			var ikselect = this,
				fakeSelect = ikselect.fakeSelect,
				block = ikselect.block,
				select = ikselect.select;

			if (ikselect.options.filter && ! $.browser.mobile) {
				ikselect.filter.val("").keyup();
			}

			if (ikselect.listItemsOriginal.length) {
				ikselect.listOptgroupItems.show();
				ikselect.listItems = ikselect.listItemsOriginal.show();
			}

			block.hide().appendTo(fakeSelect).css({
				"left": "",
				"top": ""
			});
			select.removeClass(".ik_select_opened").focus();

			selectOpened = $([]);

			ikselect.options.onHide(ikselect);
			select.trigger("ikhide", [ikselect]);
		},

		// shows dropdown
		show_block: function () {
			var ikselect = this,
				select = ikselect.select,
				fakeSelect = ikselect.fakeSelect,
				block = ikselect.block,
				list = ikselect.list,
				listInner = ikselect.listInner,
				hover = ikselect.hover,
				active = ikselect.active,
				listItems = ikselect.listItems,
				ind, next,

				blockOffset,
				blockOuterWidth, blockOuterHeight,
				$windowWidth = $window.width(),
				$windowHeight = $window.height(),
				$windowScroll = $window.scrollTop(),
				left, top,
				scrollTop;

			if (selectOpened.is(ikselect.select) || ! ikselect.listItems.length) {
				return ikselect;
			} else if (selectOpened.length) {
				selectOpened.data("plugin_ikSelect").hide_block();
			}

			block.show();
			select.addClass("ik_select_opened");
			ind = $("option", select).index($("option:selected", select));
			hover.removeClass("ik_select_hover");
			active.removeClass("ik_select_active");
			next = listItems.eq(ind).addClass("ik_select_hover ik_select_active");
			ikselect.hover = next;
			ikselect.active = next;
			ikselect.hoverIndex = ikselect.listItems.index(next);

			blockOffset = block.offset();
			blockOuterWidth = block.outerWidth(true);
			blockOuterHeight = block.outerHeight(true);

			// if the dropdown's right border is beyond window's edge then move the dropdown to the left so that it fits
			block.css("left", "");
			if (ikselect.options.ddFullWidth && fakeSelect.offset().left + blockOuterWidth > $windowWidth) {
				block.css("left", (blockOffset.left + blockOuterWidth - $windowWidth) * (-1));
			}

			// if the dropdown's bottom border is beyond window's edge then move the dropdown to the left so that it fits
			block.css("top", "");
			if (blockOffset.top + blockOuterHeight > $windowScroll + $windowHeight) {
				block.css("top", ((blockOffset.top + blockOuterHeight - parseInt(block.css("top"), 10)) - ($windowScroll + $windowHeight)) * (-1));
			}

			left = blockOffset.left;
			if (left < 0) {
				left = 0;
			}
			top = blockOffset.top;
			block.width(block.width());
			block.appendTo("body").css({
				"left": left,
				"top": top
			});

			scrollTop = $(".ik_select_active", list).position().top - list.height() / 2;
			list.data("ik_select_scrollTop", scrollTop);
			listInner.scrollTop(scrollTop);

			selectOpened = select;

			ikselect.options.onShow(ikselect);
			select.trigger("ikshow", [ikselect]);
		},

		// add options to the list
		add_options: function (args) {
			var ikselect = this,
				select = ikselect.select,
				listInner = ikselect.listInner,

				fakeSelectHtml = "", selectHtml = "",
				ul, optgroup, newOptions;

			$.each(args, function (index, value) {
				if (typeof value === "string") {
					fakeSelectHtml += "<li><span class=\"ik_select_option\" data-title=\"" + index + "\">" + value + "</span></li>";
					selectHtml += "<option value=\"" + index + "\">" + value + "</option>";
				} else if (typeof value === "object") {
					ul = $("> ul > li.ik_select_optgroup:eq(" + index + ") > ul", listInner); // 'index' - optgroup index

					optgroup = $("optgroup:eq(" + index + ")", select);
					newOptions = value; // 'value' - new option objects

					$.each(newOptions, function (index, value) {
						fakeSelectHtml += "<li><span class=\"ik_select_option\" data-title=\"" + index + "\">" + value + "</span></li>";
						selectHtml += "<option value=\"" + index + "\">" + value + "</option>";
					});

					ul.append(fakeSelectHtml);
					optgroup.append(selectHtml);
					fakeSelectHtml = "";
					selectHtml = "";
				}
			});

			if (selectHtml !== "") {
				$(":first", listInner).append(fakeSelectHtml);
				select.append(selectHtml);
			}

			ikselect._fix_height();

			ikselect.listItems = $("li:not(.ik_select_optgroup)", listInner);

			ikselect._attach_list_events(ikselect.listItems);
		},

		// remove options from the list
		remove_options: function (args) {
			var ikselect = this,
				select = ikselect.select,
				listItems = ikselect.listItems,
				removeList = $([]);

			$.each(args, function (index, value) {
				$("option", select).each(function (index) {
					if ($(this).val() === value) {
						removeList = removeList.add($(this)).add(listItems.eq(index));
					}
				});
			});

			ikselect.listItems = listItems.not(removeList);
			removeList.remove();
			ikselect._select_fake_option();

			ikselect._fix_height();
		},

		// sync selected option in the fake select with the original one
		_select_real_option: function () {
			var hover = this.hover,
				active = this.active;

			active.removeClass("ik_select_active");
			hover.addClass("ik_select_active").click();
		},

		// sync selected option in the original select with the fake one
		_select_fake_option: function () {
			var ikselect = this,
				select = ikselect.select,
				fakeSelect = ikselect.fakeSelect,
				link = ikselect.link,
				linkText = ikselect.linkText,
				listItems = ikselect.listItems,

				selected = $(":selected", select),
				ind = $("option", select).index(selected);
			linkText.html(selected.html());

			if (selected.length && selected[0].getAttribute("value")) {
				link.removeClass("ik_select_link_novalue");
			} else {
				link.addClass("ik_select_link_novalue");
			}

			ikselect.hover = listItems.removeClass("ik_select_hover ik_select_active").eq(ind).addClass("ik_select_hover ik_select_active");
			ikselect.active = ikselect.hover;

			if ($.browser.mobile) {
				select.css({
					height: fakeSelect.height(),
					width: fakeSelect.width()
				});
			}
		},

		// disables select
		disable_select: function () {
			var select = this.select,
				link = this.link;

			select.attr("disabled", "disabled");
			link.addClass("ik_select_link_disabled");
		},

		// enables select
		enable_select: function () {
			var select = this.select,
				link = this.link;

			select.removeAttr("disabled");
			link.removeClass("ik_select_link_disabled");
		},

		// toggles select
		toggle_select: function () {
			var ikselect = this,
				link = this.link;

			if (link.hasClass("ik_select_link_disabled")) {
				ikselect.enable_select();
			} else {
				ikselect.disable_select();
			}
		},

		// make option selected by value
		make_selection: function (args) {
			var ikselect = this,
				select = ikselect.select;

			select.val(args);
			ikselect._select_fake_option();
		},

		// disables optgroups
		disable_optgroups: function (args) {
			var ikselect = this,
				select = ikselect.select,
				list = ikselect.list;

			$.each(args, function (index, value) {
				var optgroup = $("optgroup:eq(" + value + ")", select);
				optgroup.attr("disabled", "disabled");
				$(".ik_select_optgroup:eq(" + value + ")", list).addClass("ik_select_optgroup_disabled");

				ikselect.disable_options($("option", optgroup));
			});

			ikselect._select_fake_option();
		},

		// enables optgroups
		enable_optgroups: function (args) {
			var ikselect = this,
				select = ikselect.select,
				list = ikselect.list,
				optgroup;

			$.each(args, function (index, value) {
				optgroup = $("optgroup:eq(" + value + ")", select).removeAttr("disabled");
				$(".ik_select_optgroup:eq(" + value + ")", list).removeClass("ik_select_optgroup_disabled");

				ikselect.enable_options($("option", optgroup));
			});

			ikselect._select_fake_option();
		},

		// disables options
		disable_options: function (args) {
			var ikselect = this,
				select = ikselect.select,
				listItems = ikselect.listItems,

				optionSet = $("option", select),
				option_index, fakeOption;

			$.each(args, function (index, value) {
				if (typeof value === "object") {
					$(this).attr("disabled", "disabled");
					option_index = optionSet.index(this);
					fakeOption = listItems.eq(option_index).addClass("ik_select_option_disabled");
					ikselect._detach_list_events(fakeOption);
				} else {
					optionSet.each(function (index) {
						if ($(this).val() === value) {
							$(this).attr("disabled", "disabled");
							fakeOption = listItems.eq(index).addClass("ik_select_option_disabled");
							ikselect._detach_list_events(fakeOption);
							return this;
						}
					});
				}
			});

			ikselect._select_fake_option();
		},

		// disables options
		enable_options: function (args) {
			var ikselect = this,
				select = ikselect.select,
				listItems = ikselect.listItems,

				optionSet = $("option", select),
				option_index, fakeOption;

			$.each(args, function (index, value) {
				if (typeof value === "object") {
					$(this).removeAttr("disabled");
					option_index = optionSet.index(this);
					fakeOption = listItems.eq(option_index).removeClass("ik_select_option_disabled");
					ikselect._attach_list_events(fakeOption);
				} else {
					optionSet.each(function (index) {
						if ($(this).val() === value) {
							$(this).removeAttr("disabled");
							fakeOption = listItems.eq(index).removeClass("ik_select_option_disabled");
							ikselect._attach_list_events(fakeOption);
							return this;
						}
					});
				}
			});

			ikselect._select_fake_option();
		},

		// detaching plugin from the orignal select
		detach_plugin: function () {
			var ikselect = this,
				select = ikselect.select,
				fakeSelect = ikselect.fakeSelect;

			select.unbind(".ikSelect").css({
				"width": "",
				"height": "",
				"left": "",
				"top": "",
				"position": "",
				"margin": "",
				"padding": ""
			});

			fakeSelect.before(select);
			fakeSelect.remove();
		},

		// controls class changes for options (hover/active states)
		_move_to: function (jqObj) {
			var ikselect = this,
				select = ikselect.select,
				linkText = ikselect.linkText,
				block = ikselect.block,
				list = ikselect.list,
				listInner = ikselect.listInner,

				jqObjTopLine, jqObjBottomLine;

			if (! block.is(":visible") && $.browser.webkit) {
				ikselect.show_block();
				return this;
			}

			ikselect.hover.removeClass("ik_select_hover");
			jqObj.addClass("ik_select_hover");
			ikselect.hover = jqObj;
			if (! $.browser.webkit) {
				ikselect.active.removeClass("ik_select_active");
				jqObj.addClass("ik_select_active");
				ikselect.active = jqObj;
			}
			if (! block.is(":visible") || $.browser.mozilla) {
				if (! $.browser.mozilla) {
					select.val($(".ik_select_option", jqObj).data("title"));
					select.change();
				}
				linkText.html($(".ik_select_option", jqObj).html());
			}

			jqObjTopLine = jqObj.offset().top - list.offset().top - parseInt(list.css("paddingTop"), 10);
			jqObjBottomLine = jqObjTopLine + jqObj.outerHeight();
			if (jqObjBottomLine > list.height()) {
				listInner.scrollTop(listInner.scrollTop() + jqObjBottomLine - list.height());
			} else if (jqObjTopLine < 0) {
				listInner.scrollTop(listInner.scrollTop() + jqObjTopLine);
			}

			ikselect.options.onHoverMove(jqObj, ikselect);
			select.trigger("ikhovermove", [jqObj, ikselect]);
		},

		// sets fixed height to dropdown if it's bigger than ddMaxHeight
		_fix_height: function () {
			var ikselect = this,
				block = ikselect.block,
				listInner = ikselect.listInner,
				ddMaxHeight = ikselect.options.ddMaxHeight,
				ddFullWidth = ikselect.options.ddFullWidth;

			block.show();
			listInner.css("height", "auto");
			if (listInner.height() > ddMaxHeight) {
				listInner.css({
					overflow: "auto",
					height: ddMaxHeight,
					position: "relative"
				});

				if (! $.data(listInner, "ik_select_hasScrollbar")) {
					if (ddFullWidth) {
						block.width(block.width() + scrollbarWidth);
						listInner.width(listInner.width() + scrollbarWidth);
					}
				}

				$.data(listInner, "ik_select_hasScrollbar", true);
			} else {
				if ($.data(listInner, "ik_select_hasScrollbar")) {
					listInner.css({
						overflow: "",
						height: "auto"
					});
					listInner.width(listInner.width() - scrollbarWidth);
					block.width(block.width() - scrollbarWidth);
				}
			}
			block.hide();
		}
	});

	$.fn.ikSelect = function (options) {
		//do nothing if opera mini
		if ($.browser.operamini) {
			return this;
		}

		var args = Array.prototype.slice.call(arguments), ikselect;

		return this.each(function () {
			if (!$.data(this, "plugin_ikSelect")) {
				$.data(this, "plugin_ikSelect", new IkSelect(this, options));
			} else if (typeof options === "string") {
				ikselect = $.data(this, "plugin_ikSelect");
				switch (options) {
				case "reset":
					ikselect.reset_all();
					break;
				case "hide_dropdown":
					ikselect.hide_block();
					break;
				case "show_dropdown":
					shownOnPurpose = true;
					ikselect.select.focus();
					ikselect.show_block();
					break;
				case "add_options":
					ikselect.add_options(args[1]);
					break;
				case "remove_options":
					ikselect.remove_options(args[1]);
					break;
				case "enable":
					ikselect.enable_select();
					break;
				case "disable":
					ikselect.disable_select();
					break;
				case "toggle":
					ikselect.toggle_select();
					break;
				case "select":
					ikselect.make_selection(args[1]);
					break;
				case "set_defaults":
					ikselect.set_defaults(args[1]);
					break;
				case "redraw":
					ikselect.redraw();
					break;
				case "disable_options":
					ikselect.disable_options(args[1]);
					break;
				case "enable_options":
					ikselect.enable_options(args[1]);
					break;
				case "disable_optgroups":
					ikselect.disable_optgroups(args[1]);
					break;
				case "enable_optgroups":
					ikselect.enable_optgroups(args[1]);
					break;
				case "detach":
					ikselect.detach_plugin();
					break;
				}
			}
		});
	};

	// singleton instance
	$.ikSelect = new IkSelect();

	// hide fake select list when clicking outside of it
	$(document).bind("click.ikSelect", function (event) {
		if (! shownOnPurpose && selectOpened.length && ! $(event.target).closest(".ik_select").length && ! $(event.target).closest(".ik_select_block").length) {
			selectOpened.ikSelect("hide_dropdown");
			selectOpened = $([]);
		}
		if (shownOnPurpose) {
			shownOnPurpose = false;
		}
	});
})(jQuery, window, document);
