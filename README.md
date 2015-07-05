# [ikSelect 1.1.0](http://igor10k.github.com/ikSelect/)

ikSelect helps you stylize selects. Check the plugin's [page](http://igor10k.github.com/ikSelect/) for more info.

## Features

* works in all popular browsers including IE6+
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
* **fast** and **easy** to use
* built with attention to details
* according to the poll, **100% of people love it** &nbsp;&nbsp; <sub><sup>of all the five friends I asked<sup></sub>

## Installation
* Include jQuery if it's still not included. The easiest way is to use some public CDN.

	```html
	<script src="//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js"></script>
	```

* Download latest ikSelect script from [here](https://github.com/Igor10k/ikSelect/zipball/master)</p>

* Include ikSelect script after jQuery

	```html
	<script src="ikSelect.min.js"></script>
	```

* Initialize the script somewhere. Better do it after the DOM is ready.

	```javascript
	$(function () {
		$('select').ikSelect();
	});
	```

* Add some CSS

	```css
	.ik_select {
		/*
		Wraps all the plugin's HTML code.
		Probably you should not add any styles here
		*/
	}
		.ik_select_link {
			/* Fake select you click on to open the dropdown */
		}
		.ik_select_link_focus {
			/* Focused state of the fake select */
		}
		.ik_select_link_disabled {
			/* Disabled state of the fake select */
		}
			.ik_select_link_text {
				/*
				Wrapper for the text inside the link.
				It's best to add some width limiting rules here like
				display:block;
				overflow:hidden;
				white-space:nowrap;
				text-overflow:ellipsis;
				*/
			}

		.ik_select_dropdown {
			/*
			Dropdown wrapper. Needed for script calculations.
			You should not add any visual styles here.
			You can shift the position of the dropdown
			by changing top and left values like
			top: -2px;
			left: -5px;
			*/
		}
			.ik_select_list {
				/*
				Wrapper for the options list.
				Now that's a good place to add visual styles.
				*/
			}
				.ik_select_optgroup {
					/* Optgroup */
				}
					.ik_select_optgroup_label {
						/* Optgroup label */
					}
					.ik_select_option {
						/* Option */
					}
						.ik_select_option_label {
							/* Option label */
						}
					.ik_select_hover {
						/* The hovered state of an option */
					}
					.ik_select_active {
						/* The active state of an option */
					}

			.ik_select_filter_wrap {
				/* Wrapper for the filter input */
			}
			.ik_select_filter {
				/* Filter input */
			}
			.ik_nothing_found {
				/* Block that's shown when there's nothing found. */
			}
	```

## Options

All the options can be set using HTML5 **data-** attributes or as an object passed to the plugin.
For the **data-** attibutes use lowercased options!
*(data-autowidth="true", data-customclass="someclass", etc)*

```javascript
syntax: '&lt;div class="ik_select_link"&gt;&lt;span class="ik_select_link_text"&gt;&lt;/span&gt;&lt;/div&gt;&lt;div class="ik_select_dropdown"&gt;&lt;div class="ik_select_list"&gt;&lt;/div&gt;&lt;/div&gt;'
	/*
	Custom syntax for the fake select.
	The only condition is that "ik_select_link_text" should be inside of "ik_select_link" and
	"ik_select_list" should be inside of "ik_select_dropdown".
	*/

autoWidth: true,
	/* Set width of the select according to the longest option. */

ddFullWidth: true,
	/* Set width of the dropdown according to the longest option. */

equalWidths: true,
	/* Add dropdown's scrollbar width to the fake select's width. */

dynamicWidth: false,
	/* Adjust fake select's width according to its contents. */

extractLink: false,
	/* Tells if fake select should be moved to body when clicked along with the dropdown */

customClass: '',
	/* Add custom class to the fake select's wrapper. */

linkCustomClass: '',
	/*
	Add custom class to the fake select.
	Uses customClass with '-link' appended if only the former presents.
	*/

ddCustomClass: '',
	/*
	Add custom class to the fake select's dropdown.
	Uses customClass with '-dd' appended if only the former presents.
	*/

ddMaxHeight: 200,
	/* Maximum allowed height for dropdown. */

isDisabled: false,
	/*
	Set the initial state of the select.
	Overrides the *disabled* attribute.
	*/

filter: false,
	/* Appends filter text input. */

nothingFoundText: 'Nothing found'
	/* The text to show when filter is on and nothing is found. */
```


## Callbacks and events

After each callback there's also an event emitted.
Just replace **on** with **ik** and use lowercase.
*(ikshow, ikkeydown, etc)*

```javascript
onInit: function (inst) {}
	/* Called just after plugin is initialized. */

onShow: function (inst) {}
	/* Called just after dropdown was showed. */

onHide: function (inst) {}
	/* Called just after dropdown was hidden. */

onKeyDown: function (inst) {}
	/* Called when a key on a keyboard is pressed. */

onKeyUp: function (inst) {}
	/* Called when a key on a keyboard is released. */

onHoverMove: function (inst) {}
	/* Called when some other option is hovered. */
```

## API

```javascript
$.ikSelect.extendDefaults(settings);
	/* Override defaults for new instances. */

$(selector).ikSelect('reset');
	/* Recreates fake select from scratch. */

$(selector).ikSelect('redraw');
	/*
	Recalculates dimensions for the dropdown.
	Use this if select's parent was hidden when ikSelect was applied to it
	right after *show()*, *fadeIn()* or whatever you are using there.
	*/

$(selector).ikSelect('addOptions', optionObject[, optionIndex, optgroupIndex]);
$(selector).ikSelect('addOptions', optionObjectsArray[, optionIndex, optgroupIndex]);
	/*
	Add one or many options.
	By default appends to the dropdown's root.
	Optionally, tell at what index the option should appear.
	Optionally, tell to optgroup at what index to add the option.
	optionIndex is relative to optgroupIndex when the latter presents.
	*/

$(selector).ikSelect('addOptgroups', optgroupObject[, optgroupIndex]);
$(selector).ikSelect('addOptgroups', optgroupObjectsArray[, optgroupIndex]);
	/*
	Add one or many optgroups.
	By default appends to the dropdown's root.
	Optionally, tell at what index the optgroup should appear.
	*/

$(selector).ikSelect('removeOptions', optionIndex[, optgroupIndex]);
$(selector).ikSelect('removeOptions', optionIndexesArray[, optgroupIndex]);
	/*
	Remove one or many options by index.
	Optionally, set *optgroupIndex* to look for indexes within particular optgroup.
	Set *optgroupIndex* as -1 to look only within root.
	*/

$(selector).ikSelect('removeOptgroups', optgroupIndex);
$(selector).ikSelect('removeOptgroups', optgroupIndexesArray);
	/* Remove one or many optgroups by index. */

$(selector).ikSelect('select', optionValue[, isIndex]);
	/*
	Change selected option using option's value by default
	or index if *isIndex* is *true*.
	*/

$(selector).ikSelect('showDropdown');
	/*
	Show fake select's dropdown.
	Caution: on mobile devices this method shows the fake dropdown, not the native one
	that is shown by default when tapping on the fake select itself.
	*/

$(selector).ikSelect('hideDropdown');
	/* Hide fake select's dropdown. */

$(selector).ikSelect('disable');
	/*
	Disable select.
	Also adds 'ik_select_link_disabled' class to the 'ik_select_link'.
	*/

$(selector).ikSelect('enable');
	/*
	Enable select.
	Also removes 'ik_select_link_disabled' class from the 'ik_select_link'.
	*/

$(selector).ikSelect('toggle'[, enableOrDisable]);
	/*
	Toggle select's state.
	Optionally, set *enableOrDisable* as *true* or *false* to specify needed state.
	*/

$(selector).ikSelect('disableOptions', optionIndexOrValue[, isIndex]);
$(selector).ikSelect('disableOptions', optionIndexesOrValuesArray[, isIndex]);
	/*
	Disable one or many options using option values by default
	or option indexes if *isIndex* is *true*
	*/

$(selector).ikSelect('enableOptions', optionIndexOrValue[, isIndex]);
$(selector).ikSelect('enableOptions', optionIndexesOrValuesArray[, isIndex]);
	/*
	Enable one or many options using option values by default
	or option indexes if *isIndex* is *true*
	*/

$(selector).ikSelect('toggleOptions', optionIndexOrValue[, isIndex, enableOrDisable]);
$(selector).ikSelect('toggleOptions', optionIndexesOrValuesArray[, isIndex, enableOrDisable]);
	/*
	Toggle one or many optgroups' state.
	Optionally, set *enableOrDisable* as true/false to specify needed state.
	*/

$(selector).ikSelect('disableOptgroups', optgroupIndex);
$(selector).ikSelect('disableOptgroups', optgroupIndexesArray);
	/* Disable one or many optgroups. */

$(selector).ikSelect('enableOptgroups', optgroupIndex);
$(selector).ikSelect('enableOptgroups', optgroupIndexesArray);
	/* Enable one or many optgroups. */

$(selector).ikSelect('toggleOptgroups', optgroupIndex[, enableOrDisable]);
$(selector).ikSelect('toggleOptgroups', optgroupIndexesArray[, enableOrDisable]);
	/*
	Toggle one or many optgroups' state.
	Optionally, set *enableOrDisable* as true/false to specify needed state.
	*/

$(selector).ikSelect('detach');
	/* Detach plugin from select and remove all traces. */
```

## Examples
Check the [Examples](http://igor10k.github.com/ikSelect/examples.html) page.

## License

```
The MIT License (MIT)

Copyright (c) 2013 Igor Kozlov

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

---

author: [http://igorkozlov.me](http://igorkozlov.me)
