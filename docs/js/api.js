'use strict';

(function() {

	document.addEventListener('DOMContentLoaded', function(evt) {

		// DOM ready.

		removeClassFromEl(document.getElementsByTagName('html')[0], 'no-js');

		(function navSearchInit() {

			var input = document.querySelector('.docs-nav-search');
			var items = document.querySelectorAll('.docs-nav-item');

			var doSearch = debounce(search, 400);

			input.addEventListener('keyup', doSearch);
			input.addEventListener('change', doSearch);

			function search() {

				hideAllItems();
				showItemsThatMatch(input.value);
			}

			function hideAllItems() {

				for (var i = 0; i < items.length; i++) {
					addClassToEl(items[i], 'hidden');
				}
			}

			function showItemsThatMatch(value) {

				var matchingItems = getItemsThatMatch(value);

				for (var i = 0; i < matchingItems.length; i++) {
					removeClassFromEl(matchingItems[i], 'hidden');
				}
			}

			function getItemsThatMatch(value) {

				var matchingItems = [];
				var item, content;

				for (var i = 0; i < items.length; i++) {
					item = items[i];
					content = typeof item.textContent !== 'undefined' ? item.textContent : item.innerHTML;
					if (content.toLowerCase().indexOf(value.toLowerCase()) !== -1) {
						matchingItems.push(item);
					}
				}

				return matchingItems;
			}

		})();
	});

	function debounce(fn, wait) {

		var timeout;

		return function() {
			clearTimeout(timeout);
			timeout = setTimeout(fn, wait);
		};
	}

	function addClassToEl(el, className) {

		var classes = el.className.split(' ');
		var index = classes.indexOf(className);

		if (index === -1) {
			classes.push(className);
			el.className = classes.join(' ');
		}
	}

	function removeClassFromEl(el, className) {

		var classes = el.className.split(' ');
		var index = classes.indexOf(className);

		if (index !== -1) {
			classes.splice(index, 1);
			el.className = classes.join(' ');
		}
	}

})();
