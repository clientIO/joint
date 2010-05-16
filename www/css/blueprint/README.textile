h1. Blueprint CSS Framework Readme

Welcome to Blueprint! This is a CSS framework designed to cut down on your CSS development time. It gives you a solid foundation to build your own CSS on. Here are some of the features BP provides out-of-the-box:

* An easily customizable grid
* Sensible default typography
* A typographic baseline
* Perfected browser CSS reset
* A stylesheet for printing
* Powerful scripts for customization
* Absolutely no bloat!

h2. Project Info

* *Web*: "http://blueprintcss.org":http://blueprintcss.org
* *Source*: "http://github.com/joshuaclayton/blueprint-css":http://github.com/joshuaclayton/blueprint-css
* *Wiki*: "http://github.com/joshuaclayton/blueprint-css/wikis/home":http://github.com/joshuaclayton/blueprint-css/wikis/home
* *Bug/Feature Tracking*: "http://blueprintcss.lighthouseapp.com":http://blueprintcss.lighthouseapp.com

h2. Setup Instructions

Here's how you set up Blueprint on your site.

# Upload the "blueprint" folder in this folder to your server, and place it in whatever folder you'd like. A good choice would be your CSS folder.
# Add the following three lines to every @<head/>@ of your site. Make sure the three @href@ paths are correct (here, BP is in my CSS folder): <pre><code>
<link rel="stylesheet" href="css/blueprint/screen.css" type="text/css" media="screen, projection">
<link rel="stylesheet" href="css/blueprint/print.css" type="text/css" media="print">
<!--[if lt IE 8]>
  <link rel="stylesheet" href="css/blueprint/ie.css" type="text/css" media="screen, projection">
<![endif]--></code></pre>
Remember to include trailing slashes (" />") in these lines if you're using XHTML.
# For development, add the .showgrid class to any container or column to see the underlying grid. Check out the @plugins@ directory for more advanced functionality.


h2. Tutorials

* "Tutorial on BlueFlavor":http://blueflavor.com/blog/design/blueprintcss_101.php
* "How to customize BP with the compressor script":http://jdclayton.com/blueprints_compress_a_walkthrough.html
* "How to use a grid in a layout":http://subtraction.com/2007/03/18/oh-yeeaahh
* "How to use a baseline in your typography":http://alistapart.com/articles/settingtypeontheweb

h2. Files in Blueprint

The framework has a few files you should check out. Every file in the @src@ directory contains lots of (hopefully) clarifying comments.

Compressed files (these go in the HTML):

* @blueprint/screen.css@
* @blueprint/print.css@
* @blueprint/ie.css@

Source files:
* @blueprint/src/reset.css@<br/>
This file resets CSS values that browsers tend to set for you.
* @blueprint/src/grid.css@<br/>
This file sets up the grid (it's true). It has a lot of classes you apply to @<div/>@ elements to set up any sort of column-based grid.
* @blueprint/src/typography.css@<br/>
This file sets some default typography. It also has a few methods for some really fancy stuff to do with your text.
* @blueprint/src/forms.css@<br/>
Includes some minimal styling of forms.
* @blueprint/src/print.css@<br/>
This file sets some default print rules, so that printed versions of your site looks better than they usually would. It should be included on every page.
* @blueprint/src/ie.css@<br/>
Includes every hack for our beloved IE6 and 7.

Scripts:
* @lib/compress.rb@<br/>
A Ruby script for compressing and customizing your CSS. Set a custom namespace, column count, widths, output paths, multiple projects, and semantic class names. See commenting in @compress.rb@ or run @$ruby compress.rb -h@ for more information.
* @lib/validate.rb@<br/>
Validates the Blueprint core files with the W3C CSS validator.

Other:
* @blueprint/plugins/@<br/>
Contains additional functionality in the form of simple plugins for Blueprint. See individual readme files in the directory of each plugin for further instructions.
* @tests/@<br/>
Contains html files which tests most aspects of Blueprint. Open @tests/index.html@ for further instructions.

h2. Extra Information

* For credits and origins, see AUTHORS.
* For license instructions, see LICENSE.
* For the latest updates, see CHANGELOG.
