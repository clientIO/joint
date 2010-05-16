#!/usr/bin/env ruby
require File.join(File.dirname(__FILE__), "blueprint", "blueprint")

# **Basic
# 
#   Calling this file by itself will pull files from blueprint/src and concatenate them into three files; ie.css, print.css, and screen.css.
# 
#     ruby compress.rb
# 
#   However, argument variables can be set to change how this works.
# 
#   Calling
# 
#     ruby compress.rb -h
# 
#   will reveal basic arguments you can pass to the compress.rb file.
# 
# **Custom Settings
#   
#   To use custom settings, the file need to be stored in settings.yml within this directory.  An example YAML file has been included.
#   
#   Another ability is to use YAML (spec is at http://www.yaml.org/spec/1.1/) for project settings in a predefined structure and 
#   store all pertinent information there.  The YAML file has multiple keys (usually a named project) with a set of data that defines 
#   that project.  A sample structure can be found in settings.example.yml.
#   
#   The basic structure is this:
#   
#     Root nodes are project names.  You use these when calling compress.rb as such:
#     
#       ruby compress.rb -p PROJECTNAME
#       
#     A sample YAML with only roots and output paths would look like this:
#     
#       project1:
#         path: /path/to/my/project/stylesheets
#       project2:
#         path: /path/to/different/stylesheets
#       project3:
#         path: /path/to/another/projects/styles
#       
#     You can then call
#     
#       ruby compress.rb -p project1
#       
#       or 
#     
#       ruby compress.rb -p project3
#     
#     This would compress and export Blueprints CSS to the respective directory, checking for my-(ie|print|screen).css and 
#     appending it if present
#     
#   A more advanced structure would look like this:
#   
#       project1:
#         path: /path/to/my/project/stylesheets
#         namespace: custom-namespace-1-
#         custom_css:
#           ie.css:
#             - custom-ie.css
#           print.css:
#             - docs.css
#             - my-print-styles.css
#           screen.css:
#             - subfolder-of-stylesheets/sub_css.css
#         custom_layout:
#            column_count: 12
#            column_width: 70
#            gutter_width: 10
#       project2:
#         path: /path/to/different/stylesheets
#         namespace: different-namespace-
#         custom_css:
#           screen.css:
#             - custom_screen.css
#         semantic_classes:
#           "#footer, #header": column span-24 last
#           "#content": column span-18 border
#           "#extra-content": last span-6 column
#           "div#navigation": last span-24 column
#           "div.section, div.entry, .feeds": span-6 column
#         plugins:
#           - fancy-type
#           - buttons
#           - validations
#       project3:
#         path: /path/to/another/projects/styles
# 
#     In a structure like this, a lot more assignment is occurring.  Custom namespaces are being set for two projects, while 
#     the third (project3) is just a simple path setting.
#     
#     Also, custom CSS is being used that is appended at the end of its respective file.  So, in project1, print.css will have docs.css 
#     and my-print-styles.css instead of the default my-print.css.  Note that these files are relative to the path that you defined above;
#     you can use subdirectories from the default path if you would like.
#     
#     Another thing to note here is the custom_layout; if not defined, your generated CSS will default to the 24 column, 950px wide grid that 
#     has been standard with Blueprint for quite some time.  However, you can specify a custom grid setup if you would like.  The three options 
#     are column_count (the number of columns you want your grid to have), column width (the width in pixels that you want your columns to be), and 
#     gutter_width (the width in pixels you want your gutters - space between columns - to be).  To use the Blueprint default, do not define this 
#     in your settings file.
#     
#     Semantic classes are still in the works within Blueprint, but a simple implementation has been created.
#     
#     Defining semantic_classes, with nodes underneath, will generate a class for each node which has rules of each class assigned to it.  For example,
#     in project2 above, for '#footer, #header', elements with id's of footer and header will be assigned all the rules from the 
#     classes 'span-24, column, and last', while divs with classes either entry or section, as well as any element with class of feed, is 
#     assigned all the rules from 'span-6 and column'.  Although it is a crude way do accomplish this, it keeps the generated CSS separate from the core BP CSS.
#     
#     Also supported is plugins.  The compressor looks within BLUEPRINT_DIR/blueprint/plugins to match against what's passed.  If the plugin name 
#     matches, it will append PLUGIN/(screen|print|ie).css to the corresponding CSS file.  It will append the plugin CSS to all three CSS files if
#     there is a CSS file present named as the plugin (e.g. the fancy-type plugin with a fancy-type.css file found within the plugin directory)
#     
#     In Ruby, the structure would look like this:
#     
#     {
#       'project1' => {
#         'path' => '/path/to/my/project/stylesheets',
#         'namespace' => 'custom-namespace-1-',
#         'custom_css' => {
#           'ie.css' => ['custom-ie.css'],
#           'print.css' => ['docs.css', 'my-print-styles.css'],
#           'screen.css' => ['subfolder-of-stylesheets/sub_css.css']
#         },
#         'custom_layout' => {
#           'column_count' => 12,
#           'column_width' => 70,
#           'gutter_width' => 10
#         }
#       },
#       'project2' => {
#         'path' => '/path/to/different/stylesheets',
#         'namespace' => 'different-namespace-',
#         'custom_css' => {
#           'screen.css' => ['custom_screen.css']
#         },
#         'semantic_classes' => {
#           '#footer, #header' => 'column span-24 last',
#           '#content' => 'column span-18 border',
#           '#extra-content' => 'last span-6 column',
#           'div#navigation' => 'last span-24 column',
#           'div.section, div.entry, .feeds' => 'span-6 column'
#         },
#         'plugins' => ['fancy-type', 'buttons', 'validations']
#       },
#       'project3' => {
#         'path' => '/path/to/another/projects/styles'
#       }
#     }

Blueprint::Compressor.new.generate!