h1. Blueprint CSS Tabs Plugin Readme

This plugin adds a simple and flexible set of horizontal tabs to Blueprint. 

h2. Usage: 

# Upload the screen.css file to a new directory on your server (preferably tabsplugin/)
# Include the plugin file in the @<head/>@ of your webpage. 
<link rel="stylesheet" href="tabsplugin/screen.css" type="text/css" media="screen,projection">
# Add the class @"tabs"@ to your list. An example: 
<pre>
<ul class='tabs'>
	<li><a href='#text1'>Tab 1</a></li>
	<li><a href='#text2'>Tab 2</a></li>
	<li><a href='#text3'>Tab 3</a></li>
</ul>
</pre>

h2. More options: 

You can add a label to your list by adding the class @"label"@ to the first item. This item should not have a link in it. 
<pre>
<ul class='tabs'>
	<li class='label'>This is a "label":</li>
	<li><a href='#text1'>Tab 1</a></li>
	<li><a href='#text2'>Tab 2</a></li>
	<li><a href='#text3'>Tab 3</a></li>
</ul>
</pre>

You can mark the currently selected item with the class @"selected"@. 
<pre>
<ul class='tabs'>
	<li><a href='#text1' class='selected'>Tab 1</a></li>
	<li><a href='#text2'>Tab 2</a></li>
	<li><a href='#text3'>Tab 3</a></li>
</ul>
</pre>

h2. Demo: 

View a demo at "blueprintcss.org":http://blueprintcss.org/demos/tabs.html