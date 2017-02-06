'use strict';

(function() {

    var iframes;

    document.addEventListener('DOMContentLoaded', function(evt) {

        // DOM ready.

        removeClassFromEl(document.getElementsByTagName('html')[0], 'no-js');

        initializeNavSearch();
        initializeNavCollapsible();

        iframes = document.querySelectorAll('.docs-content iframe[data-src]');
        loadVisibleIFrames();

        document.querySelector('.docs-content').addEventListener('scroll', debounce(loadVisibleIFrames, 400));
        window.addEventListener('scroll', debounce(loadVisibleIFrames, 400));

        openSections();
    });

    function loadVisibleIFrames() {

        var visibleIFrames = getVisibleIFrames();
        var iframe;

        while ((iframe = visibleIFrames.shift())) {
            if (!iframeIsLoaded(iframe)) {
                loadIFrame(iframe);
            }
        }
    }

    function openSections() {

        var prototypeSection = document.querySelector('[href="#prototype"]');
        var gSection = document.querySelector('[href="#g"]');

        if (prototypeSection) {
            addClassToEl(prototypeSection.parentNode, 'open');
        }

        if (gSection) {
            addClassToEl(gSection.parentNode, 'open');
        }
    }

    function loadIFrame(iframe) {

        var loadingElem, loadingElemChild, loadingTextElemChild, top, left;
        var loadingSize = 50;
        var loadingHeightMiddle = loadingSize / 2; // animation circle height
        var loadingWidthMiddle = (loadingSize + 110) / 2; // animation + text 'demo loading'

        // Don't load again, if already loading.
        if (elHasClass(iframe, 'loading')) return;

        iframe.onload = function() {

            iframe.contentWindow.document.body.style.overflow = 'hidden';

            // Set the height of the iframe element equal to the height of its contents.
            this.style.height = this.contentWindow.document.body.offsetHeight + 'px';

            removeClassFromEl(iframe, 'loading');
            loadingElem = document.getElementsByClassName('loadIFrame');
            for(var i = loadingElem.length - 1; i >= 0; i--) {
                if(loadingElem[i] && loadingElem[i].parentElement) {
                    loadingElem[i].parentElement.removeChild(loadingElem[i]);
                }
            }
        };

        addClassToEl(iframe, 'loading');
        loadingElem = document.createElement('div');
        loadingElem.className = 'loadIFrame';
        loadingElemChild = document.createElement('div');
        loadingTextElemChild = document.createElement('p');
        top = parseInt(iframe.style.height) / 2 - loadingHeightMiddle;
        if (iframe.style.width) {
            left = parseInt(iframe.style.width);
        } else {
            left = parseInt(iframe.offsetWidth);
        }
        left = left / 2 - loadingWidthMiddle;
        loadingElemChild.style.top =  top + 'px';
        loadingElemChild.style.left = left + 'px';
        loadingTextElemChild.style.top =  top + 'px';
        loadingTextElemChild.style.left = left + loadingSize + 10 + 'px';
        loadingTextElemChild.innerHTML = 'loading demo...';
        loadingElem.appendChild(loadingElemChild);
        loadingElem.appendChild(loadingTextElemChild);
        iframe.parentNode.insertBefore(loadingElem, iframe);
        iframe.src = iframe.getAttribute('data-src');
    }

    function iframeIsLoaded(iframe) {

        return iframe.src != 'about:blank';
    }

    function getVisibleIFrames() {

        var visibleIFrames = [];
        var i;

        for (i = 0; i < iframes.length; i++) {
            if (isElementInViewport(iframes[i])) {
                visibleIFrames.push(iframes[i]);
            }
        }

        return visibleIFrames;
    }

    function getFstLevelElementsLinks() {

        return document.querySelectorAll('.docs-nav>.docs-nav-items>.docs-nav-item>.docs-nav-item-link');
    }

    function getFstLevelElements() {

        return document.querySelectorAll('.docs-nav>.docs-nav-items>.docs-nav-item');
    }

    function initializeNavCollapsible() {

        var input = getFstLevelElementsLinks();

        for (var i = 0; i < input.length; i++) {
            input[i].addEventListener('click', toggleOpen);
        }

        function toggleOpen() {

            var className = this.parentNode.className;

            if (className.indexOf('open') !== -1) {
                removeClassFromEl(this.parentNode, 'open');
            } else{
                addClassToEl(this.parentNode, 'open');
            }
        }
    }

    function initializeNavSearch() {

        var input = document.querySelector('.docs-nav-search');
        var items = document.querySelectorAll('.docs-nav-item');
        var clear = document.querySelector('.docs-nav-search-clear');
        var doSearch = debounce(search, 400);

        input.addEventListener('keyup', doSearch);
        input.addEventListener('change', doSearch);
        clear.addEventListener('click', clearSearch);

        function clearSearch() {
            input.value = '';
            closeAll();
            showAllItems();
        }

        function search() {

            if (input.value === '') {
                return ;
            }
            hideAllItems();
            closeAll();
            showItemsThatMatch(input.value);
        }

        function hideAllItems() {

            for (var i = 0; i < items.length; i++) {
                addClassToEl(items[i], 'hidden');
            }
        }

        function showAllItems() {

            for (var i = 0; i < items.length; i++) {
                removeClassFromEl(items[i], 'hidden');
            }
        }

        function closeAll() {

            var elements = getFstLevelElements();
            for (var i = 0; i < elements.length; i++) {
                removeClassFromEl(elements[i], 'open');
            }
        }

        function showItemsThatMatch(value) {

            var matchingItems = getItemsThatMatch(value);
            var parents = getFstLevelElements();

            for (var i = 0; i < matchingItems.length; i++) {
                removeClassFromEl(matchingItems[i], 'hidden');
            }

            for (i = 0; i < parents.length; i++) {
                addClassToEl(parents[i], 'open');
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
        var innerHeight = (window.innerHeight || document.documentElement.clientHeight) + rect.height;

        return (
            rect.top >= -rect.height &&
            rect.bottom <= innerHeight
        );
    }

})();
