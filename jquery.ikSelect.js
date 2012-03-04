// ikSelect 0.5
// Copyright (c) 2012 Igor Kozlov
// i10k.ru

;(function($, window, document, undefined){
	defaults = {
		syntax: '<div class="ik_select_link"><span class="ik_select_link_text"></span></div><div class="ik_select_block"><div class="ik_select_list"></div></div>',
		autowidth: true,
		ddfullwidth: true,
		customClass: ""
	};
	
	var select_opened = $([]); // currently opened select
	var shown_on_purpose = false; // true if show_dropdown was called using API

	function ikSelect(element, options){
		this.element = element;

		this.options = $.extend({}, defaults, options);
		
		this.fake_select = $('<div class="ik_select">' + this.options['syntax'] + '</div>'); // fake select object made with passed syntax
		this.select = $(this.element); // original select
		this.link = $(".ik_select_link", this.fake_select); // fake select
		this.link_text = $(".ik_select_link_text", this.fake_select); // fake select's text
		this.block = $(".ik_select_block", this.fake_select); // fake select's dropdown
		this.list = $(".ik_select_list", this.fake_select); // fake select's list inside of dropdown
		this.list_inner = $('<div class="ik_select_list_inner"/>'); // support block for scroll

		this._defaults = defaults;
		this._name = 'ikSelect';
		
		this.init();
	};

	ikSelect.prototype.init = function(){
		var ikselect = this;
		
		var autowidth = this.options['autowidth']; // set select width according to the longest option
		var ddfullwidth = this.options['ddfullwidth']; // set dropdown width according to the longest option
		
		var fake_select = this.fake_select;
		var select = this.select;
		var link = this.link;
		var link_text = this.link_text;
		var block = this.block;
		var list = this.list;
		var list_inner = this.list_inner;
		
		list.append(list_inner);

		fake_select.addClass(this.options['customClass']);
		
		//creating fake option list
		ikselect.reset();
		
		if(select.attr("disabled")){
			ikselect.disable_select();
		};
		
		// click event for fake select
		link.bind("click.ikSelect", function(){
			if(fake_select.data("ik_select_disabled")){
				return this;
			};
			if(select_opened.length){
				select_opened.hide_block();
			};
			ikselect.show_block();
			select.focus();
		});

		// when focus is on original select add "focus" class to the fake one
		select.bind("focus.ikSelect", function(){
			if(fake_select.data("ik_select_disabled")){
				return this;
			};
			link.addClass("ik_select_focus");
			if(fake_select.offset().top + fake_select.height() > $(window).scrollTop() + $(window).height()){
				$(window).scrollTop(fake_select.offset().top - $(window).height()/2);
			};
		});

		// when focus lost remove "focus" class from the fake one
		select.bind("blur.ikSelect", function(){
			if(fake_select.data("ik_select_disabled")){
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
			var active = $(".ik_select_active", list);
			var hover = $(".ik_select_hover", list);

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

						if(next.length){
							next.addClass("ik_select_hover");
							hover.removeClass("ik_select_hover");
							if($.browser.mozilla){
								next.addClass("ik_select_active");
								hover.removeClass("ik_select_active");
							};
							if(! block.is(":visible") || $.browser.mozilla) link_text.html($(".ik_select_option", next).html());
						};
					};
					if(event.type == "keyup"){
						if(! block.is(":visible") || $.browser.mozilla) select.val($(".ik_select_option", hover).html());
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

						if(prev.length){
							prev.addClass("ik_select_hover");
							hover.removeClass("ik_select_hover");
							if($.browser.mozilla){
								prev.addClass("ik_select_active");
								hover.removeClass("ik_select_active");
							};
							if(! block.is(":visible") || $.browser.mozilla) link_text.html($(".ik_select_option", prev).html());
						};
					};
					if(event.type == "keyup"){
						if(! block.is(":visible") || $.browser.mozilla) select.val($(".ik_select_option", hover).html());
					};
					break;
				case 33: //page up
				case 36: //home
					if(event.type == "keydown"){
						event.preventDefault();
						hover.removeClass("ik_select_hover");
						$("li:first", list).addClass("ik_select_hover");
					};
					break;
				case 34: //page down
				case 35: //end
					if(event.type == "keydown"){
						event.preventDefault();
						hover.removeClass("ik_select_hover");
						$("li:last", list).addClass("ik_select_hover");
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
						//ikselect._select_real_option();
						//ikselect.hide_block();
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
		select.after(fake_select);

		// width calculations for the fake select when "autowidth" is "true"
		if(autowidth || ddfullwidth){
			block.show().width(1000);
			list_inner.css("float", "left");
			var max_width = list.css("position", "absolute").width();
			list.css("position", "static");
			block.hide().css("width", "100%");
			list_inner.css("float", "none");
			var parent_width = select.parent().width();
			if(ddfullwidth){
				block.width(max_width);
			};
			if(max_width > parent_width){
				max_width = parent_width;
			};
			if(autowidth){
				fake_select.width(max_width);
			};
		};

		// hide the original select
		var select_wrap = $('<div class="ik_select_original"/>');
		select.wrap(select_wrap).css({
			position: "absolute",
			left: -9999,
			top: 0
		});
		
		// save original dropdown's css properties
		block.data("ik_select_block_left", block.css("left"));
		block.data("ik_select_block_top", block.css("top"));
	};
	
	ikSelect.prototype.reset = function(){
		var ikselect = this;
		var select = this.select;
		var link_text = this.link_text;
		var list_inner = this.list_inner;
		
		// init fake select's text
		link_text.html(select.html());

		list_inner.empty();
		
		// creating an ul->li list identical to original dropdown
		var new_options = '';
		var selected_ind;
		if($("optgroup", select).length){
			$("optgroup", select).each(function(){
				new_options += '<div class="ik_select_optgroup">';
				new_options += '<div class="ik_select_optgroup_label">'+ $(this).attr("label") +'</div>';
				new_options += '<ul>';
				$("option", this).each(function(){
					new_options += '<li><span class="ik_select_option" title="'+ $(this).val() +'">'+ $(this).html() +'</span></li>';
				});
				new_options += '</ul>';
				new_options += '</div>';
			});
		} else{
			new_options += '<ul>';
			$("option", select).each(function(){
				new_options += '<li><span class="ik_select_option" title="'+ $(this).val() +'">'+ $(this).html() +'</span></li>';
			});
			new_options += '</ul>';
		};
		list_inner.append(new_options);
		ikselect._select_fake_option();
		
		ikselect._attach_list_events($("li", list_inner));
	};
	
	ikSelect.prototype._attach_list_events = function(jqObj){
		var ikselect = this;
		var select = this.select;
		var link_text = this.link_text;
		var list = this.list;
		
		// click events for the fake select's options
		jqObj.bind("click.ikSelect", function(){
			link_text.html($(".ik_select_option", this).html());
			select.val($(".ik_select_option", this).attr("title"));
			$("li", list).removeClass("ik_select_active");
			$(this).addClass("ik_select_active");
			ikselect.hide_block();
			select.focus();
		});

		// hover event for the fake options
		jqObj.bind("mouseover.ikSelect", function(){
			$("li", list).removeClass("ik_select_hover");
			$(this).addClass("ik_select_hover");
		});
		
		jqObj.addClass("ik_select_has_events");
	};
	
	// hides dropdown
	ikSelect.prototype.hide_block = function(){
		var fake_select = this.fake_select;
		var block = this.block;
		var select = this.select;
		
		block.hide().appendTo(fake_select).css({
			"left": block.data("ik_select_block_left"),
			"top": block.data("ik_select_block_top")
		});
		
		select_opened = $([]);
		
		select.focus();
	};
	
	// shows dropdown
	ikSelect.prototype.show_block = function(){
		var deviceAgent = navigator.userAgent.toLowerCase();
		var isiOS = deviceAgent.match(/(iphone|ipod|ipad)/);
		if(isiOS){
			return true;
		}
		var ikselect = this;
		var fake_select = this.fake_select;
		var select = this.select;
		var block = this.block;
		var list = this.list;
		var list_inner = this.list_inner;
		
		block.show();
		var ind = $("option", select).index($("option:selected", select));
		$("li", list).removeClass("ik_select_hover ik_select_active");
		$("li:eq("+ ind +")", list).addClass("ik_select_hover ik_select_active");

		// if the dropdown's right border is beyond window's edge then move the dropdown to the left so that it fits
		block.removeClass("ik_select_block_right");
		block.css("left", block.data("ik_select_block_left"));
		if(this.options['ddfullwidth'] && fake_select.offset().left + block.outerWidth(true) > $(window).width()){
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
		list_inner.scrollTop(scrollTop);
		
		select_opened = select;
	};
	
	// add options to the list
	ikSelect.prototype.add_options = function(args){
		var ikselect = this;
		var select = this.select;
		var list = this.list;
		var list_inner = this.list_inner;
		
		var fakeSelectHtml = '', selectHtml = '';

		$.each(args, function(index, value){
			if(typeof value === 'string'){
				fakeSelectHtml += '<li><span class="ik_select_option" title="'+ index +'">'+ value +'</span></li>';
				selectHtml += '<option value="'+ index +'">'+ value +'</option>';
			} else if(typeof value === 'object'){
				var ul = $("ul:eq("+ index +")", list); // 'index' - optgroup index
				var optgroup = $("optgroup:eq("+ index +")", select);
				var new_options = value; // 'value' - new option objects
				
				$.each(new_options, function(index, value){
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
			$(":first", list_inner).append(fakeSelectHtml);
			select.append(selectHtml);
		}
		
		ikselect._attach_list_events($("li:not(.ik_select_has_events)", list_inner));
	};
	
	// remove options from the list
	ikSelect.prototype.remove_options = function(args){
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
	};

	// sync selected option in the fake select with the original one
	ikSelect.prototype._select_real_option = function(){
		var list = this.list;
		
		var ind = $("li", list).index($(".ik_select_hover", list));
		$("li.ik_select_active", list).removeClass("ik_select_active");
		$("li:eq("+ ind +")", list).addClass("ik_select_active").click();
	};

	// sync selected option in the original select with the fake one
	ikSelect.prototype._select_fake_option = function(){
		var select = this.select;
		var list = this.list;
		var link_text = this.link_text;
		
		var selected = $(":selected", select);
		var ind = $("option", select).index(selected);
		link_text.html(selected.html());
		$("li", list).removeClass("ik_select_hover").eq(ind).addClass("ik_select_hover");
	};
	
	// disables select
	ikSelect.prototype.disable_select = function(){
		var fake_select = this.fake_select;
		var select = this.select;
		
		select.attr("disabled", "disabled");
		fake_select.addClass("ik_select_disabled");
		fake_select.data("ik_select_disabled", true);
	};
	
	// enables select
	ikSelect.prototype.enable_select = function(){
		var fake_select = this.fake_select;
		var select = this.select;
		
		select.removeAttr("disabled");
		fake_select.removeClass("ik_select_disabled");
		fake_select.data("ik_select_disabled", false);
	};
	
	// toggles select
	ikSelect.prototype.toggle_select = function(){
		var ikselect = this;
		var fake_select = this.fake_select;
		
		if(fake_select.data("ik_select_disabled")){
			ikselect.enable_select();
		} else{
			ikselect.disable_select();
		};
	};

	ikSelect.prototype.make_selection = function(args){
		var ikselect = this;
		var select = this.select;
		
		select.val(args);
		ikselect._select_fake_option();
	};

	$.fn['ikSelect'] = function(options){
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
					case 'show_dropdown':	ikselect.show_block(); shown_on_purpose = true; break;
					case 'add_options':		ikselect.add_options(args[1]); break;
					case 'remove_options':	ikselect.remove_options(args[1]); break;
					case 'enable':			ikselect.enable_select(); break;
					case 'disable':			ikselect.disable_select(); break;
					case 'toggle':			ikselect.toggle_select(); break;
					case 'select':			ikselect.make_selection(args[1]); break;
				};
			};
		});
	};
	
	// hide fake select list when clicking outside of it
	$(document).bind("click.ikSelect", function(event){
		if(! shown_on_purpose && select_opened.length && ! $(event.target).parents(".ik_select").length){
			select_opened.ikSelect("hide_dropdown");
			select_opened = $([]);
		};
		if(shown_on_purpose){
			shown_on_purpose = false;
		};
	});
})(jQuery, window, document);