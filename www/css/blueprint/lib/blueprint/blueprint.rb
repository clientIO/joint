require 'fileutils'
module Blueprint
  # path to the root Blueprint directory
  ROOT_PATH =             File.join(File.expand_path(File.dirname(__FILE__)), "../../")
  # path to where the Blueprint CSS files are stored
  BLUEPRINT_ROOT_PATH =   File.join(Blueprint::ROOT_PATH, 'blueprint')
  # path to where the Blueprint CSS raw CSS files are stored
  SOURCE_PATH =           File.join(Blueprint::BLUEPRINT_ROOT_PATH, 'src')
  # path to where the Blueprint CSS generated test files are stored
  TEST_PATH =             File.join(Blueprint::ROOT_PATH, 'tests')
  # path to the root of the Blueprint scripts
  LIB_PATH =              File.join(Blueprint::ROOT_PATH, 'lib', 'blueprint')
  # path to where Blueprint plugins are stored
  PLUGINS_PATH =          File.join(Blueprint::BLUEPRINT_ROOT_PATH, 'plugins')
  # settings YAML file where custom user settings are saved
  SETTINGS_FILE =         File.join(Blueprint::ROOT_PATH, 'lib', 'settings.yml')
  # path to validator jar file to validate generated CSS files
  VALIDATOR_FILE =        File.join(Blueprint::LIB_PATH, 'validate', 'css-validator.jar')
  # hash of compressed and source CSS files
  CSS_FILES = {
    'screen.css'   => ['reset.css', 'typography.css', 'forms.css', 'grid.css'],
    'print.css'    => ['print.css'],
    'ie.css'       => ['ie.css']
  }

  # default number of columns for Blueprint layout
  COLUMN_COUNT =          24
  # default column width (in pixels) for Blueprint layout
  COLUMN_WIDTH =          30
  # default gutter width (in pixels) for Blueprint layout
  GUTTER_WIDTH =          10
  
  INPUT_PADDING =         5
  INPUT_BORDER =          1
end

Dir["#{File.join(Blueprint::LIB_PATH)}/*"].each do |file|
  require "#{file}" if file =~ /\.rb$/ && file !~ /blueprint.rb/
end