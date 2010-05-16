prettyPrint.js
===

&copy; [James Padolsey](http://james.padolsey.com)

*prettyPrint.js* is an in-browser JavaScript variable dumper, similar in functionality to ColdFusion's cfdump tag. 

First, a preview:

Preview:
---

![prettyPrint.js preview](http://img132.imageshack.us/img132/5890/prettyprintpreview.png)

Features:
---

* Entirely independent. It requires NO StyleSheets or images.
* Handles infinitely nested objects.
* All native JavaScript types are supported plus DOM nodes/elements!
* Protects against circular/repeated references.
* Allows you to specify the depth to which the object will be printed.
* Better browser users benefit from gradient column-headers! Thanks to HTML5 and <code>CANVAS</code>!
* Allows low-level CSS customisation (if such a thing exists).

Usage:
---

Download prettyPrint.js and include it in your document:

    <script src="prettyPrint.js"></script>

Whenever you want to pretty-print an object of any type simple call prettyPrint:

    prettyPrint( myObject );
    
That, on its own, won't do anything though; prettyPrint returns a table which you can handle in any way you desire. For example, if you wanted to insert the table at the very top of the document:

    var tbl = prettyPrint( myObject );
    document.body.insertBefore( tbl, document.body.firstChild );
    
Or, appending it to the document:

    document.body.appendChild(tbl);
    
Configuration:
---

Custom settings can be passed (as an object) as the second parameter to the prettyPrint() function.

... Eh oh! You've reached the end. This README file is not yet finished. If you really need to know more then have a look at the source! :)
tip: Scroll to line ~592 of prettyprint.js for the juicy config secrets! 

