require 'yaml'
require 'optparse'
module Blueprint
  class Compressor
    TEST_FILES = ['index.html', 
                  'parts/elements.html', 
                  'parts/forms.html', 
                  'parts/grid.html', 
                  'parts/sample.html']
    
    attr_accessor :namespace, :custom_css, :custom_layout, :semantic_classes, :project_name, :plugins
    attr_reader   :custom_path, :loaded_from_settings, :destination_path, :script_name
    
    # overridden setter method for destination_path
    # also sets custom_path flag on Blueprint::Compressor instance
    def destination_path=(path)
      @destination_path = path
      @custom_path = @destination_path != Blueprint::BLUEPRINT_ROOT_PATH
    end
  
    # constructor
    def initialize
      # set up defaults
      @script_name = File.basename($0) 
      @loaded_from_settings = false
      @settings_file = Blueprint::SETTINGS_FILE
      self.namespace = ""
      self.destination_path = Blueprint::BLUEPRINT_ROOT_PATH
      self.custom_layout = CustomLayout.new
      self.project_name = nil
      self.custom_css = {}
      self.semantic_classes = {}
      self.plugins = []
    
      self.options.parse!(ARGV)
      initialize_project_from_yaml(self.project_name)
    end
  
    # generates output CSS based on any args passed in
    # overwrites any existing CSS, as well as grid.png and tests
    def generate!
      output_header       # information to the user (in the console) describing custom settings
      generate_css_files  # loops through Blueprint::CSS_FILES to generate output CSS
      generate_tests      # updates HTML with custom namespaces in order to test the generated library.  TODO: have tests kick out to custom location
      output_footer       # informs the user that the CSS generation process is complete
    end
    
    def options #:nodoc:#
      OptionParser.new do |o|
        o.set_summary_indent('  ')
        o.banner =    "Usage: #{@script_name} [options]"
        o.define_head "Blueprint Compressor"
        o.separator ""
        o.separator "options"
        o.on( "-fSETTINGS_FILE", "--settings_file=SETTINGS_FILE", String,
              "Specify a non-default settings file path.") { |file| @settings_file = file }
        o.on( "-oOUTPUT_PATH", "--output_path=OUTPUT_PATH", String,
              "Define a different path to output generated CSS files to.") { |path| self.destination_path = path }
        o.on( "-nBP_NAMESPACE", "--namespace=BP_NAMESPACE", String,
              "Define a namespace prepended to all Blueprint classes (e.g. .your-ns-span-24)") { |ns| self.namespace = ns }
        o.on( "-pPROJECT_NAME", "--project=PROJECT_NAME", String,
              "If using the settings.yml file, PROJECT_NAME is the project name you want to export") {|project| @project_name = project }
        o.on( "--column_width=COLUMN_WIDTH", Integer,
              "Set a new column width (in pixels) for the output grid") {|cw| self.custom_layout.column_width = cw }
        o.on( "--gutter_width=GUTTER_WIDTH", Integer,
              "Set a new gutter width (in pixels) for the output grid") {|gw| self.custom_layout.gutter_width = gw }
        o.on( "--column_count=COLUMN_COUNT", Integer,
              "Set a new column count for the output grid") {|cc| self.custom_layout.column_count = cc }
        #o.on("-v", "--verbose", "Turn on verbose output.") { |$verbose| }
        o.on("-h", "--help", "Show this help message.") { puts o; exit }
      end
    end

    private 
  
    # attempts to load output settings from settings.yml
    def initialize_project_from_yaml(project_name = nil)
      # ensures project_name is set and settings.yml is present
      return unless (project_name && File.exist?(@settings_file))
    
      # loads yaml into hash
      projects = YAML::load(File.path_to_string(@settings_file))
    
      if (project = projects[project_name]) # checks to see if project info is present
        self.namespace =        project['namespace']        || ""
        self.destination_path = (self.destination_path == Blueprint::BLUEPRINT_ROOT_PATH ? project['path'] : self.destination_path) || Blueprint::BLUEPRINT_ROOT_PATH
        self.custom_css =       project['custom_css']       || {}
        self.semantic_classes = project['semantic_classes'] || {}
        self.plugins =          project['plugins']          || []
      
        if (layout = project['custom_layout'])
          self.custom_layout = CustomLayout.new(:column_count => layout['column_count'], :column_width => layout['column_width'], :gutter_width => layout['gutter_width'], :input_padding => layout['input_padding'], :input_border => layout['input_border'])
        end
        @loaded_from_settings = true
      end
    end
  
    def generate_css_files
      Blueprint::CSS_FILES.each do |output_file_name, css_source_file_names|
        css_output_path = File.join(destination_path, output_file_name)
        puts "\n    Assembling to #{custom_path ? css_output_path : "default blueprint path"}"

        # CSS file generation
        css_output = css_file_header # header included on all three Blueprint-generated files
        css_output += "\n\n"
      
        # Iterate through src/ .css files and compile to individual core compressed file
        css_source_file_names.each do |css_source_file|
          puts "      + src/#{css_source_file}"
          css_output += "/* #{css_source_file} */\n" if css_source_file_names.any?
        
          source_options = if self.custom_layout && css_source_file == 'grid.css'
            self.custom_layout.generate_grid_css
          else
            File.path_to_string File.join(Blueprint::SOURCE_PATH, css_source_file)
          end
        
          css_output += Blueprint::CSSParser.new(source_options, :namespace => namespace).to_s
          css_output += "\n"
        end
      
        #append CSS from plugins
        css_output = append_plugin_css(css_output, output_file_name)
      
        # append CSS from custom files
        css_output = append_custom_css(css_output, output_file_name)
      
        #save CSS to correct path, stripping out any extra whitespace at the end of the file
        File.string_to_file(css_output.rstrip, css_output_path)
      end

      # append semantic class names if set
      append_semantic_classes
    
      #attempt to generate a grid.png file
      if (grid_builder = GridBuilder.new(:column_width => self.custom_layout.column_width, :gutter_width => self.custom_layout.gutter_width, :output_path => File.join(self.destination_path, 'src')))
        grid_builder.generate!
      end
    end
  
    def append_custom_css(css, current_file_name)
      # check to see if a custom (non-default) location was used for output files
      # if custom path is used, handle custom CSS, if any
      return css unless self.custom_path and self.custom_css[current_file_name]

      self.custom_css[current_file_name].each do |custom_css|
        overwrite_base = custom_css || "my-#{current_file_name}"
        overwrite_path = File.join(destination_path, overwrite_base)
        overwrite_css = File.exists?(overwrite_path) ? File.path_to_string(overwrite_path) : ""
    
        # if there's CSS present, add it to the CSS output
        unless overwrite_css.blank?
          puts "      + custom styles (#{custom_css})\n"
          css += "/* #{overwrite_base} */\n"
          css += CSSParser.new(overwrite_css).to_s + "\n"
        end
      end
    
      css
    end

    def append_plugin_css(css, current_file_name)
      return css unless self.plugins.any?
    
      plugin_css = ""
    
      self.plugins.each do |plugin|
        plugin_file_specific  = File.join(Blueprint::PLUGINS_PATH, plugin, current_file_name)
        plugin_file_generic   = File.join(Blueprint::PLUGINS_PATH, plugin, "#{plugin}.css")
      
        file = if File.exists?(plugin_file_specific)
          plugin_file_specific
        elsif File.exists?(plugin_file_generic) && current_file_name =~ /^screen|print/
          plugin_file_generic
        end
      
        if file
          puts "      + #{plugin} plugin\n"
          plugin_css += "/* #{plugin} */\n"
          plugin_css += CSSParser.new(File.path_to_string(file)).to_s + "\n"

          Dir.glob(File.join(File.dirname(file), "**", "**")).each do |cp|
            short_path = cp.gsub(/#{File.dirname(file)}./ , '')
            # make directory if it doesn't exist
            directory = File.dirname(short_path)
            FileUtils.mkdir_p(File.join(destination_path, directory)) unless directory == "."
            FileUtils.cp cp, File.join(destination_path, short_path) unless File.directory?(File.join(File.dirname(file), short_path)) || cp == file
          end
        end
      end
    
      css += plugin_css
    end
    
    def append_semantic_classes
      screen_output_path = File.join(self.destination_path, "screen.css")
      semantic_styles = SemanticClassNames.new(:namespace => self.namespace, :source_file => screen_output_path).css_from_assignments(self.semantic_classes)
      return if semantic_styles.blank?

      css = File.path_to_string(screen_output_path)
      css += "\n\n/* semantic class names */\n"
      css += semantic_styles
      File.string_to_file(css.rstrip, screen_output_path)
    end
  
    def generate_tests
      puts "\n    Updating namespace to \"#{namespace}\" in test files:"
      test_files = Compressor::TEST_FILES.map {|f| File.join(Blueprint::TEST_PATH, *f.split(/\//))}
    
      test_files.each do |file|
        puts "      + #{file}"
        Namespace.new(file, namespace)
      end
    end

    def output_header
      puts "\n"
      puts "  #{"*" * 100}"
      puts "  **"
      puts "  **   Blueprint CSS Compressor"
      puts "  **"
      puts "  **   Builds compressed files from the source directory."
      puts "  **"
      puts "  **   Loaded from settings.yml" if loaded_from_settings
      puts "  **   Namespace: '#{namespace}'" unless namespace.blank?
      puts "  **   Output to: #{destination_path}"
      puts "  **   Grid Settings:"
      puts "  **     - Column Count: #{self.custom_layout.column_count}"
      puts "  **     - Column Width: #{self.custom_layout.column_width}px"
      puts "  **     - Gutter Width: #{self.custom_layout.gutter_width}px"
      puts "  **     - Total Width : #{self.custom_layout.page_width}px"
      puts "  **"
      puts "  #{"*" * 100}"
    end

    def output_footer
      puts "\n\n"
      puts "  #{"*" * 100}"
      puts "  **"
      puts "  **   Done!"
      puts "  **   Your compressed files and test files are now up-to-date."
      puts "  **"
      puts "  #{"*" * 100}\n\n"
    end
  
    def css_file_header
%(/* -----------------------------------------------------------------------


 Blueprint CSS Framework 0.9
 http://blueprintcss.org

   * Copyright (c) 2007-Present. See LICENSE for more info.
   * See README for instructions on how to use Blueprint.
   * For credits and origins, see AUTHORS.
   * This is a compressed file. See the sources in the 'src' directory.

----------------------------------------------------------------------- */)
    end
  
    def putsv(str)
      puts str if $verbose
    end
  end
end
