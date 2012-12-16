$(function () {
	// custom syntax
	$(".select_custom_syntax").ikSelect({
		syntax: '<div class="ik_select_link"><span class="arr_t">&#x25B2;</span><span class="arr_b">&#x25BC;</span><span class="ik_select_link_text"></span></div><div class="ik_select_block"><div class="ik_select_list"></div></div>'
	});
	$(".show_dropdown").click(function () {
		$(".select_custom_syntax").ikSelect("show_dropdown");
	});

	//setting defaults for ie
	if ($.browser.msie && $.browser.version.charAt(0) < 8) {
		$.ikSelect.set_defaults({
			syntax: '<div class="ik_select_link"><span class="arr_t">&#x25B2;</span><span class="arr_b">&#x25BC;</span><span class="ik_select_link_text"></span></div><div class="ik_select_block"><div class="ik_select_list"></div></div>'
		});
	}

	// autowidth
	$(".select_autowidth").ikSelect();

	$(".change_selection").click(function () {
		$(".select_autowidth").ikSelect("select", "value4");
	});

	$(".add_options_to_fake").click(function () {
		$(".select_autowidth1").ikSelect("add_options", {
			0: {
				"value5": "option5"
			},
			1: {
				"value6": "option6"
			}
		});
	});

	$(".remove_value4_value5").click(function () {
		$(".select_autowidth1").ikSelect("remove_options", ["value4", "value5"]);
	});

	// fixed width for fake select, autowidth for dropdown
	$(".select_dd_autowidth").ikSelect({
		autoWidth: false
	});

	$(".add_options_to_fake2").click(function () {
		$(".select_dd_autowidth").ikSelect("add_options", {
			"value5": "option5"
		});
	});

	// no autowidth
	$(".select_noautowidth").ikSelect({
		autoWidth: false,
		ddFullWidth: false
	});

	// custom class
	$(".select_custom_class").ikSelect({
		customClass: "select_black",
		ddCustomClass: "select_black_block"
	});

	$(".add_1000_options").click(function () {
		var options_obj = {};
		var	optionValue;
		for (var i = 5; i < 1005; i++) {
			optionValue = "value" + i;
			options_obj[optionValue] = "option" + i;
		}

		var d0 = new Date();
		$(".select_custom_class").ikSelect("add_options", options_obj);
		var d1 = new Date();
		$(this).append(", " + (d1 - d0) + "ms");
	});

	// add option with JS to original select and then reset the fake one
	$(".select_add_option").ikSelect();

	var option_index = 5;
	$(".add_option_to_real").click(function () {
		$(".select_add_option").append('<option value="value' + option_index + '">option ' + option_index + '</option>');
		option_index++;
		$(this).html('add option "option ' + option_index + '" to the real select and reset the fake one');
		$(".select_add_option").ikSelect("reset");
	});

	// autowidth when select's width is bigger than available space
	$(".select_autowidth2").ikSelect();

	// autowidth when select's width is bigger than available space with ddFullWidth:false
	$(".select_autowidth_noddfullwidth").ikSelect({
		ddFullWidth: false
	});

	// generating a fake select from the select with 1000 options
	$(".select_1000").each(function () {
		var html = "";
		for (var i = 0; i < 1000; i++) {
			if (i === 4) {
				html += '<option selected="selected" value="value' + i + '">option ' + i + '</option>';
			} else {
				html += '<option value="value' + i + '">option ' + i + '</option>';
			}
		}
		$(this).append(html);
	});

	$(".generate_fake").click(function () {
		var d0 = new Date();
		$(".select_1000").ikSelect();
		var d1 = new Date();
		$(this).append(", " + (d1 - d0) + "ms");
	});

	// using with hidden parents
	$(".select_hidden").ikSelect();

	$(".show_select").click(function () {
		$(".select_hidden_wrap").fadeIn();
		$(".select_hidden").ikSelect("redraw");
	});

	// disabling different things
	$(".select_disable").ikSelect();

	$(".disable_select").click(function () {
		$(".select_disable").ikSelect("disable");
	});

	$(".enable_select").click(function () {
		$(".select_disable").ikSelect("enable");
	});

	$(".toggle_select").click(function () {
		$(".select_disable").ikSelect("toggle");
	});

	$(".disable_optgroup").click(function () {
		$(".select_disable").ikSelect("disable_optgroups", [0]);
	});

	$(".enable_optgroup").click(function () {
		$(".select_disable").ikSelect("enable_optgroups", [0]);
	});

	$(".disable_option").click(function () {
		$(".select_disable").ikSelect("disable_options", ["value3"]);
	});

	$(".enable_option").click(function () {
		$(".select_disable").ikSelect("enable_options", ["value3"]);
	});

	$(".detach").click(function () {
		$(".select_disable").ikSelect("detach");
	});

	// select with filter
	$(".select_filter").ikSelect({
		filter: true
	});

	// ui elements
	$(".code").each(function () {
		var code = $(this);
		var h4 = $("h4", code);
		var pre = $("pre", code);

		h4.click(function () {
			if (! code.hasClass("opened")) {
				code.addClass("opened");
				h4.html("hide source");
				pre.slideDown();
			} else {
				pre.slideUp(function () {
					code.removeClass("opened");
					h4.html("view source");
				});
			}
		});
	});
});