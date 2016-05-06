'use strict';

(function() {

    var iframes;

    document.addEventListener('DOMContentLoaded', function(evt) {

        // DOM ready.

        removeClassFromEl(document.getElementsByTagName('html')[0], 'no-js');

        initializeNavSearch();

        iframes = document.querySelectorAll('iframe');
        loadVisibleIFrames();
        window.addEventListener('scroll', debounce(loadVisibleIFrames, 400));
    });

    function loadVisibleIFrames() {

        var visibleIFrames = getVisibleIFrames();
        var iframe, dataSrc;

        while ((iframe = visibleIFrames.shift())) {
            if (!iframeIsLoaded(iframe)) {
                loadIFrame(iframe);
            }
        }
    }

    function loadIFrame(iframe) {

        // Don't load again, if already loading.
        if (elHasClass(iframe, 'loading')) return;

        iframe.onload = function() {

            iframe.contentWindow.document.body.style.overflow = 'hidden';

            // Set the height of the iframe element equal to the height of its contents.
            this.style.height = this.contentWindow.document.body.offsetHeight + 'px';

            removeClassFromEl(iframe, 'loading');
            addClassToEl(iframe, 'loaded');
        };

        addClassToEl(iframe, 'loading');
        iframe.src = iframe.getAttribute('data-src');
    }

    function iframeIsLoaded(iframe) {

        return iframe.src != 'about:blank';
    }

    function getVisibleIFrames() {

        var visibleIFrames = [];
        var i, position;

        for (i = 0; i < iframes.length; i++) {
            if (isElementInViewport(iframes[i])) {
                visibleIFrames.push(iframes[i]);
            }
        }

        return visibleIFrames;
    }

    function initializeNavSearch() {

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
    }

    function debounce(fn, wait) {

        var timeout;

        return function() {
            clearTimeout(timeout);
            timeout = setTimeout(fn, wait);
        };
    }

    function elHasClass(el, className) {

        return el.className.split(' ').indexOf(className) !== -1;
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

    function isElementInViewport(el) {

        var rect = el.getBoundingClientRect();

        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

})();
