# ikSelect 0.9.3

This plugin helps to stylize selects across all browsers with little effort. A [demo](http://igor10k.github.com/ikSelect/) is available.

## Features

* **custom syntax**  support
* works perfect as an **inline-block**
* **no z-index bugs**  in IE
* **optgroups**  support
* great **API**
* **add/remove** `<option>`s and `<optgroup>`s
* **disable/enable anything**  (select, optgoup, option)
* optional **filter**  text field
* can be used with **hidden parents**
* compatible with **mobile devices**
* behavior is as **authentic**  as possible
* **callbacks**  and **event triggers**
* **automatic calculations**
	* dropdown position, so it's always visible when opened
	* needed width for the select or it's dropdown (can be disabled)
	* active option appears in the center of the opened dropdown

* **keyboard support**
	* search by letters/numbers/etc
	* navigation
	* tab and shift+tab

* **fast**  and **easy**  to use
* built with attention to details
* according to the poll, **100% of people love it** *

	<small>*of all the five friends I asked</small>

## Options

	syntax: '<div class="ik_select_link"><span class="ik_select_link_text"></span></div><div class="ik_select_block"><div class="ik_select_list"></div></div>'
Passing custom syntax to create fake select.
The only condition is that "ik_select_link_text" should be inside "ik_select_link" and "ik_select_list" should be inside "ik_select_block".
Other than that any syntax can be used.

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

	ddCustomClass: ""
Add custom class to the fake select's dropdown.

---

	ddMaxHeight: 200
Maximum allowed height for dropdown.

---

	filter: false(/true)
Appends filter text input.

## Callbacks and events
	onShow: function (inst) {}
*- also available as a __ikshow__ event*

Called when dropdown shows up.

---

	onHide: function (inst) {}
*- also available as a __ikhide__ event*

Called when dropdown hides.

---

	onKeyDown: function (inst) {}
*- also available as a __ikkeydown__ event*

Called when any key on a keyboard is pressed.

---

	onKeyUp: function (inst) {}
*- also available as a __ikkeyup__ event*

Called when any key on a keyboard is released.

---

	onHoverMove: function (hoverEl, inst) {}
*- also available as a __ikhovermove__ event*

Called when any hover state of an option changes.

## API

	$(selector).ikSelect("set_defaults", <settings>)
Override defaults for new instances.

---

	$(selector).ikSelect("reset")
Recreates content in the dropdown.

---

	$(selector).ikSelect("redraw")
Recalculates dimensions for the dropdown.
*Use this if the dropdown was hidden right after the animation begins.*

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

*On mobile devices this method shows the fake dropdown, not the native one!*

---

	$(selector).ikSelect("hide_dropdown")
Hide dropdown assosiated with the passed select.

---

	$(selector).ikSelect("disable")

Disable select.

---

	$(selector).ikSelect("enable")
Enable select.


---

	$(selector).ikSelect("toggle")
Disables enabled and enables disabled select.

---

	$(selector).ikSelect()"disable_options", <optionsArray>)
Disable specific options.

---

	$(selector).ikSelect("enable_options", <optionsArray>)
Enable specific options.

---

	$(selector).ikSelect("disable_optgroups", <optgroupIndex>)
Disable specific optgroups.

---

	$(selector).ikSelect("enable_optgroups", <optgroupIndex>)
Enable specific optgroups.

---

	$(selector).ikSelect("detach")
Detach plugin from select and remove all traces.

---

*author: [i10k.ru](http://i10k.ru)*

---

Webmoney: Z334495514328, E409956596538, R182643156363

Thanks for your support.