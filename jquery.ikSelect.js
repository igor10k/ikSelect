// ikSelect 0.6.2
// Copyright (c) 2012 Igor Kozlov
// i10k.ru

;(function($, window, document, undefined){
	defaults = {
		syntax: '<div class="ik_select_link"><span class="ik_select_link_text"></span></div><div class="ik_select_block"><div class="ik_select_list"></div></div>',
		autoWidth: true,
		ddFullWidth: true,
		customClass: "",
		maxHeight: 200
	};
	
	var selectOpened = $([]); // currently opened select
	var shownOnPurpose = false; // true if show_dropdown was called using API
	var scrollbarWidth = -1;

	function ikSelect(element, options){
		this.element = element;

		this.options = $.extend({}, defaults, options);
		
		this._defaults = defaults;
		this._name = 'ikSelect';
		
		if(typeof this.element === 'undefined'){
			return this;
		}
		
		this.fakeSelect = $('<div class="ik_select">' + this.options['syntax'] + '</div>'); // fake select object made with passed syntax
		this.select = $(this.element); // original select
		this.link = $(".ik_select_link", this.fakeSelect); // fake select
		this.linkText = $(".ik_select_link_text", this.fakeSelect); // fake select's text
		this.block = $(".ik_select_block", this.fakeSelect); // fake select's dropdown
		this.list = $(".ik_select_list", this.fakeSelect); // fake select's list inside of dropdown
		this.listInner = $('<div class="ik_select_list_inner"/>'); // support block for scroll
		
		this.active = $([]);
		this.hover = $([]);
		
		this.init();
	};

	$.extend(ikSelect.prototype, {
		init: function(){
			var ikselect = this;

			var autoWidth = this.options['autoWidth']; // set select width according to the longest option
			var ddFullWidth = this.options['ddFullWidth']; // set dropdown width according to the longest option

			var fakeSelect = this.fakeSelect;
			var select = this.select;
			var link = this.link;
			var linkText = this.linkText;
			var block = this.block;
			var list = this.list;
			var listInner = this.listInner;

			list.append(listInner);

			fakeSelect.addClass(this.options['customClass']);

			//creating fake option list
			ikselect.reset();

			if(select.attr("disabled")){
				ikselect.disable_select();
			};

			// click event for fake select
			link.bind("click.ikSelect", function(){
				if(fakeSelect.data("ik_select_disabled")){
					return this;
				};
				if(selectOpened.length){
					selectOpened.data("plugin_ikSelect").hide_block();
				};
				ikselect.show_block();
				select.focus();
			});

			// when focus is on original select add "focus" class to the fake one
			select.bind("focus.ikSelect", function(){
				if(fakeSelect.data("ik_select_disabled")){
					return this;
				};
				link.addClass("ik_select_focus");
				if(fakeSelect.offset().top + fakeSelect.height() > $(window).scrollTop() + $(window).height()){
					$(window).scrollTop(fakeSelect.offset().top - $(window).height()/2);
				};
			});

			// when focus lost remove "focus" class from the fake one
			select.bind("blur.ikSelect", function(){
				if(fakeSelect.data("ik_select_disabled")){
					return this;
				};
				link.removeClass("ik_select_focus");
			});

			// a way to outplay the changing of select on scroll anywhere in IE6
			select.bind("change.ikSelect", function(event){
				event.preventDefault();
				ikselect._select_fake_option();
			});

			// keyboard controls for the fake select and fake dropdown
			select.bind("keydown.ikSelect keyup.ikSelect", function(event){
				var keycode = event.which;
				var active = ikselect.active;
				var hover = ikselect.hover;

				switch(keycode){
					case 40: //down
						if(event.type == "keydown"){
							event.preventDefault();
							var next;
							if(hover.next("li").length){
								next = hover.next("li");
							} else if(hover.parents(".ik_select_optgroup").next().length){
								next = hover.parents(".ik_select_optgroup").next().find("li:first");
							};

							if(next && next.length){
								ikselect._move_to(next);
							};
						};
						if(event.type == "keyup"){
							if(! block.is(":visible") || $.browser.mozilla) select.val($(".ik_select_option", ikselect.hover).attr("title"));
						};
						break;
					case 38: //up
						if(event.type == "keydown"){
							event.preventDefault();
							var prev;
							if(hover.prev("li").length){
								prev = hover.prev("li");
							} else if(hover.parents(".ik_select_optgroup").prev().length){
								prev = hover.parents(".ik_select_optgroup").prev().find("li:last");
							};

							if(prev && prev.length){
								ikselect._move_to(prev);
							};
						};
						if(event.type == "keyup"){
							if(! block.is(":visible") || $.browser.mozilla) select.val($(".ik_select_option", ikselect.hover).attr("title"));
						};
						break;
					case 33: //page up
					case 36: //home
						if(event.type == "keydown"){
							event.preventDefault();

							ikselect._move_to($("li:first", list));
						};
						break;
					case 34: //page down
					case 35: //end
						if(event.type == "keydown"){
							event.preventDefault();
							ikselect._move_to($("li:last", list));
						};
						break;
					case 32: //space
						if(event.type == "keydown"){
							event.preventDefault();
							if(! block.is(":visible")){
								ikselect.show_block();
							} else{
								ikselect._select_real_option();
							};
						};
						break;
					case 13: //enter
						if(event.type == "keydown" && block.is(":visible")){
							event.preventDefault();
							ikselect._select_real_option();
						};
						break;
					case 27: //esc
						if(event.type == "keydown"){
							event.preventDefault();
							ikselect.hide_block();
						};
						break;
					case 9: //tab
						if(event.type == "keydown"){
							event.preventDefault();
							if(! block.is(":visible")){
								var fields = $("button,input,textarea,select");
								var ind = fields.index(select);
								fields.eq(ind+1).focus();
							};
						};
						break;
					default:
						if(event.type == "keyup"){
							ikselect._select_fake_option();
						};
						break;
				};
			});

			select.width(1);

			// appending fake select right after the original one
			select.after(fakeSelect);

			// width calculations for the fake select when "autoWidth" is "true"
			if(autoWidth || ddFullWidth){
				block.show().width(9999);
				listInner.css("float", "left");
				list.css("position", "absolute");
				var maxWidthOuter = list.outerWidth(true);
				var maxWidthInner = list.width();
				list.css("position", "static");
				block.hide().css("width", "100%");
				listInner.css("float", "none");

				if(scrollbarWidth == -1){
					var calculationContent = $('<div style="width:50px;height:50px;overflow:hidden;position:absolute;top:-200px;left:-200px;"><div style="height:100px;"></div>');
					$("body").append(calculationContent);
					var w1 = $('div', calculationContent).innerWidth();
					calculationContent.css('overflow-y', 'scroll');
					var w2 = $('div', calculationContent).innerWidth();
					$(calculationContent).remove();
					scrollbarWidth = w1 - w2;
				};

				var parentWidth = select.parent().width();
				if(ddFullWidth){
					block.width(maxWidthOuter);
					listInner.width(maxWidthInner);
					$("ul", listInner).width(maxWidthInner);
				};
				if(maxWidthOuter > parentWidth){
					maxWidthOuter = parentWidth;
				};
				if(autoWidth){
					fakeSelect.width(maxWidthOuter);
				};
			};

			ikselect._fix_height();

			// hide the original select
			select.css({
				position: "absolute",
				left: -9999,
				top: 0
			}).prependTo(fakeSelect);

			// save original dropdown's css properties
			block.data("ik_select_block_left", block.css("left"));
			block.data("ik_select_block_top", block.css("top"));
		},
	
		// creates or recreates dropdown and sets selected options's text into fake select
		reset: function(){
			var ikselect = this;
			var select = this.select;
			var linkText = this.linkText;
			var listInner = this.listInner;

			// init fake select's text
			linkText.html(select.html());

			listInner.empty();

			// creating an ul->li list identical to original dropdown
			var newOptions = '';

			if($("optgroup", select).length){
				$("optgroup", select).each(function(){
					newOptions += '<div class="ik_select_optgroup">';
					newOptions += '<div class="ik_select_optgroup_label">'+ $(this).attr("label") +'</div>';
					newOptions += '<ul>';
					$("option", this).each(function(){
						newOptions += '<li><span class="ik_select_option" title="'+ $(this).val() +'">'+ $(this).html() +'</span></li>';
					});
					newOptions += '</ul>';
					newOptions += '</div>';
				});
			} else{
				newOptions += '<ul>';
				$("option", select).each(function(){
					newOptions += '<li><span class="ik_select_option" title="'+ $(this).val() +'">'+ $(this).html() +'</span></li>';
				});
				newOptions += '</ul>';
			};
			listInner.append(newOptions);
			ikselect._select_fake_option();

			ikselect._attach_list_events($("li", listInner));
		},
		
		// binds click and mouseover events to dropdown's options
		_attach_list_events: function(jqObj){
			var ikselect = this;
			var select = this.select;
			var linkText = this.linkText;
			var list = this.list;

			// click events for the fake select's options
			jqObj.bind("click.ikSelect", function(){
				linkText.html($(".ik_select_option", this).html());
				select.val($(".ik_select_option", this).attr("title"));
				ikselect.active.removeClass("ik_select_active");
				$(this).addClass("ik_select_active");
				ikselect.active = $(this);
				ikselect.hide_block();
				select.focus();
			});

			// hover event for the fake options
			jqObj.bind("mouseover.ikSelect", function(){
				ikselect.hover.removeClass("ik_select_hover");
				ikselect.hover = $(this);
				$(this).addClass("ik_select_hover");
			});

			jqObj.addClass("ik_select_has_events");
		},

		// change the defaults for all new instances
		set_defaults: function(settings){
			$.extend(this._defaults, settings || {});
			return this;
		},
		
		// hides dropdown
		hide_block: function(){
			var fakeSelect = this.fakeSelect;
			var block = this.block;
			var select = this.select;

			block.hide().appendTo(fakeSelect).css({
				"left": block.data("ik_select_block_left"),
				"top": block.data("ik_select_block_top")
			});

			selectOpened = $([]);

			select.focus();
		},

		// shows dropdown
		show_block: function(){
			var isMobile = (/iphone|ipad|ipod|android|blackberry|mini|windows\sce|palm/i.test(navigator.userAgent.toLowerCase()));
			if(isMobile){
				this.select.focus();
				return true;
			}
			var ikselect = this;
			var fakeSelect = this.fakeSelect;
			var select = this.select;
			var block = this.block;
			var list = this.list;
			var listInner = this.listInner;
			var hover = this.hover;
			var active = this.active;

			block.show();
			var ind = $("option", select).index($("option:selected", select));
			hover.removeClass("ik_select_hover");
			active.removeClass("ik_select_active");
			var next = $("li:eq("+ ind +")", list);
			next.addClass("ik_select_hover ik_select_active");
			ikselect.hover = next;
			ikselect.active = next;

			// if the dropdown's right border is beyond window's edge then move the dropdown to the left so that it fits
			block.removeClass("ik_select_block_right");
			block.css("left", block.data("ik_select_block_left"));
			if(this.options['ddFullWidth'] && fakeSelect.offset().left + block.outerWidth(true) > $(window).width()){
				block.addClass("ik_select_block_right");
				block.css("left", (block.offset().left + block.outerWidth(true) - $(window).width()) * (-1));
			};

			// if the dropdown's bottom border is beyond window's edge then move the dropdown to the left so that it fits
			block.removeClass("ik_select_block_up");
			block.css("top", block.data("ik_select_block_top"));
			if(block.offset().top + block.outerHeight(true) > $(window).scrollTop() + $(window).height()){
				block.addClass("ik_select_block_up");
				block.css("top", ((block.offset().top + block.outerHeight(true) - parseInt(block.data("ik_select_block_top"))) - ($(window).scrollTop() + $(window).height())) * (-1));
			};

			var left = block.offset().left;
			var top = block.offset().top;
			block.width(block.width());
			block.appendTo("body").css({
				"left": left,
				"top": top
			});

			var scrollTop = $(".ik_select_active", list).position().top - list.height()/2;
			list.data("ik_select_scrollTop", scrollTop);
			listInner.scrollTop(scrollTop);

			selectOpened = select;
		},
		
		// add options to the list
		add_options: function(args){
			var ikselect = this;
			var select = this.select;
			var list = this.list;
			var listInner = this.listInner;

			var fakeSelectHtml = '', selectHtml = '';

			$.each(args, function(index, value){
				if(typeof value === 'string'){
					fakeSelectHtml += '<li><span class="ik_select_option" title="'+ index +'">'+ value +'</span></li>';
					selectHtml += '<option value="'+ index +'">'+ value +'</option>';
				} else if(typeof value === 'object'){
					var ul = $("ul:eq("+ index +")", list); // 'index' - optgroup index
					var optgroup = $("optgroup:eq("+ index +")", select);
					var newOptions = value; // 'value' - new option objects

					$.each(newOptions, function(index, value){
						fakeSelectHtml += '<li><span class="ik_select_option" title="'+ index +'">'+ value +'</span></li>';
						selectHtml += '<option value="'+ index +'">'+ value +'</option>';
					});

					ul.append(fakeSelectHtml);
					optgroup.append(selectHtml);
					fakeSelectHtml = '';
					selectHtml = '';
				};
			});

			if(selectHtml != ''){
				$(":first", listInner).append(fakeSelectHtml);
				select.append(selectHtml);
			}

			ikselect._fix_height();

			ikselect._attach_list_events($("li:not(.ik_select_has_events)", listInner));
		},

		// remove options from the list
		remove_options: function(args){
			var ikselect = this;
			var select = this.select;
			var list = this.list;
			var removeList = $([]);

			$.each(args, function(index, value){
				$("option", select).each(function(index){
					if($(this).val() == value){
						removeList = removeList.add($(this)).add($("li:eq("+ index +")", list));
					};
				});
			});

			removeList.remove();
			ikselect._select_fake_option();

			ikselect._fix_height();
		},

		// sync selected option in the fake select with the original one
		_select_real_option: function(){
			var list = this.list;
			var hover = this.hover;
			var active = this.active;

			active.removeClass("ik_select_active");
			hover.addClass("ik_select_active").click();
		},

		// sync selected option in the original select with the fake one
		_select_fake_option: function(){
			var select = this.select;
			var list = this.list;
			var linkText = this.linkText;

			var selected = $(":selected", select);
			var ind = $("option", select).index(selected);
			linkText.html(selected.html());
			$("li", list).removeClass("ik_select_hover").eq(ind).addClass("ik_select_hover");
		},

		// disables select
		disable_select: function(){
			var fakeSelect = this.fakeSelect;
			var select = this.select;

			select.attr("disabled", "disabled");
			fakeSelect.addClass("ik_select_disabled");
			fakeSelect.data("ik_select_disabled", true);
		},

		// enables select
		enable_select: function(){
			var fakeSelect = this.fakeSelect;
			var select = this.select;

			select.removeAttr("disabled");
			fakeSelect.removeClass("ik_select_disabled");
			fakeSelect.data("ik_select_disabled", false);
		},

		// toggles select
		toggle_select: function(){
			var ikselect = this;
			var fakeSelect = this.fakeSelect;

			if(fakeSelect.data("ik_select_disabled")){
				ikselect.enable_select();
			} else{
				ikselect.disable_select();
			};
		},

		// make option selected by value
		make_selection: function(args){
			var ikselect = this;
			var select = this.select;

			select.val(args);
			ikselect._select_fake_option();
		},

		// controls class changes for options (hover/active states)
		_move_to: function(jqObj){
			var ikselect = this;
			var block = this.block;
			var linkText = this.linkText;

			ikselect.hover.removeClass("ik_select_hover");
			jqObj.addClass("ik_select_hover");
			ikselect.hover = jqObj;
			if($.browser.mozilla){
				ikselect.active.removeClass("ik_select_active");
				jqObj.addClass("ik_select_active");
				ikselect.active = jqObj;
			};
			if(! block.is(":visible") || $.browser.mozilla) linkText.html($(".ik_select_option", jqObj).html());
		},

		// sets fixed height to dropdown if it's bigger than maxHeight
		_fix_height: function(){
			var block = this.block;
			var listInner = this.listInner;
			var maxHeight = this.options['maxHeight'];
			var ddFullWidth = this.options['ddFullWidth'];

			block.show();
			if(listInner.height() > maxHeight){
				listInner.css({
					overflow: "auto",
					height: maxHeight,
					position: "relative"
				});
				$.data(listInner, "ik_select_hasScrollbar", true);
				if(ddFullWidth){
					block.width(block.width() + scrollbarWidth);
					listInner.width(listInner.width() + scrollbarWidth);
				};
			} else{
				if($.data(listInner, "ik_select_hasScrollbar")){
					listInner.css({
						overflow: "",
						height: "auto"
					});
					listInner.width(listInner.width() - scrollbarWidth);
					block.width(block.width() - scrollbarWidth);
				};
			};
			block.hide();
		}
	});

	$.fn['ikSelect'] = function(options){
		//do nothing if opera mini
		isOperamini = Object.prototype.toString.call(window.operamini) === "[object OperaMini]";
		if(isOperamini) return this;
		
		var args = Array.prototype.slice.call(arguments);

		return this.each(function(){
			if (!$.data(this, 'plugin_ikSelect')){
				$.data(this, 'plugin_ikSelect',
				new ikSelect(this, options));
			} else if(typeof options === 'string'){
				var ikselect = $.data(this, 'plugin_ikSelect');
				switch(options){
					case 'reset':			ikselect.reset(); break;
					case 'hide_dropdown':	ikselect.hide_block(); break;
					case 'show_dropdown':	ikselect.show_block(); shownOnPurpose = true; break;
					case 'add_options':		ikselect.add_options(args[1]); break;
					case 'remove_options':	ikselect.remove_options(args[1]); break;
					case 'enable':			ikselect.enable_select(); break;
					case 'disable':			ikselect.disable_select(); break;
					case 'toggle':			ikselect.toggle_select(); break;
					case 'select':			ikselect.make_selection(args[1]); break;
					case 'set_defaults':	ikselect.set_defaults(args[1]); break;
				};
			};
		});
	};
	
	// singleton instance
	$.ikSelect = new ikSelect();
	
	// hide fake select list when clicking outside of it
	$(document).bind("click.ikSelect", function(event){
		if(! shownOnPurpose && selectOpened.length && ! $(event.target).parents(".ik_select").length){
			selectOpened.ikSelect("hide_dropdown");
			selectOpened = $([]);
		};
		if(shownOnPurpose){
			shownOnPurpose = false;
		};
	});
})(jQuery, window, document);