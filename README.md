# ikSelect 0.7

This plugin helps to stylize selects across all browsers with little effort. A [demo](http://igor10k.github.com/ikSelect/) is available.

## Features

* full customization!
* use of custom syntax
* works perfect as an inline-block
* behavior is as close as possible to the original selects in every browser
* no z-index bugs in IE
* automatic calculations
	* dropdown position, so it's always visible when opened
	* width for the select or it's dropdown (can be disabled)
	* active options appears in the center of the dropdown when it's opened
* keyboard support
	* search by letters/numbers/etc
	* navigation using arrows, space, enter, pgup/pgdown, home/end, esc
	* tab and shift+tab
* add/remove options using API or make changes to the original select and then just reset the fake one
* support for disabling
* optgroups support
* compatible with mobile devices
* fast
* easy to use
* built with attention to details
* no animals were harmed in the making

## Options

	syntax: '<div class="ik_select_link"><span class="ik_select_link_text"></span></div><div class="ik_select_block"><div class="ik_select_list"></div></div>'
Passing custom syntax to create fake select.
The only condition is that "ik_select_link_text" should be inside "ik_select_link" and "ik_select_list" should be inside "ik_select_block".
Other than that any syntax can be passed to plugin.

--- 

	autowidth: true(/false)
Set width of the select according to the longest option.

---

	ddFullWidth: true(/false)
Set width of the dropdown according to the longest option.

---

	customClass: ""
Add custom class to the fake select's wrapper.

---

	ddMaxHeight: 200
Maximum allowed height for dropdown.

## API

	$.ikSelect("set_defaults", <settings>)
Override defaults for new instances.

---

	$(selector).ikSelect("add_options", <optionsObject>)
Add options by providing option values and strings.
Specify optgroup index if needed.

---

	$(selector).ikSelect("remove_options", <optionsArray>)
Remove options using array of values.

---

	$(selector).ikSelect("select", <optionValue>)
Change selected option by value.

---

	$(selector).ikSelect("show_dropdown")
Show dropdown assosiated with the passed select.

*On Android this method shows the fake dropdown, not the native one!*

---

	$(selector).ikSelect("enable")
Enable select.

---

	$(selector).ikSelect("disable")
  
Disable select.

---

	$(selector).ikSelect("toggle")
Disables enabled and enables disabled select.

---

*author: [i10k.ru](http://i10k.ru)*

---

Webmoney: Z334495514328, E409956596538, R182643156363

Yandex.Money: 410011319936560

Thanks for your support.