require 'erb'
module Blueprint
  # Generates a custom grid file, using ERB to evaluate custom settings
  class CustomLayout
    # path to ERB file used for CSS template
    CSS_ERB_FILE = File.join(Blueprint::LIB_PATH, 'grid.css.erb')
  
    attr_writer :column_count, :column_width, :gutter_width, :input_padding, :input_border

    # Column count of generated CSS.  Returns itself or Blueprint's default
    def column_count
      (@column_count || Blueprint::COLUMN_COUNT).to_i
    end
    
    # Column width (in pixels) of generated CSS.  Returns itself or Blueprint's default
    def column_width
      (@column_width || Blueprint::COLUMN_WIDTH).to_i
    end

    # Gutter width (in pixels) of generated CSS.  Returns itself or Blueprint's default
    def gutter_width
      (@gutter_width || Blueprint::GUTTER_WIDTH).to_i
    end
    
    def input_padding
      (@input_padding || Blueprint::INPUT_PADDING).to_i
    end
    
    def input_border
      (@input_border || Blueprint::INPUT_BORDER).to_i
    end

    # Returns page width (in pixels)
    def page_width
      column_count * (column_width + gutter_width) - gutter_width
    end
  
    # ==== Options
    # * <tt>options</tt>
    #   * <tt>:column_count</tt> -- Sets the column count of generated CSS
    #   * <tt>:column_width</tt> -- Sets the column width (in pixels) of generated CSS
    #   * <tt>:gutter_width</tt> -- Sets the gutter width (in pixels) of generated CSS
    #   * <tt>:input_padding</tt> -- Sets the input padding width (in pixels) of generated CSS
    #   * <tt>:input_border</tt> -- Sets the border width (in pixels) of generated CSS
    def initialize(options = {})
      @column_count   = options[:column_count]
      @column_width   = options[:column_width]
      @gutter_width   = options[:gutter_width]
      @input_padding  = options[:input_padding]
      @input_border   = options[:input_border]
    end
  
    # Boolean value if current settings are Blueprint's defaults
    def default?
      self.column_width == Blueprint::COLUMN_WIDTH && 
      self.column_count == Blueprint::COLUMN_COUNT && 
      self.gutter_width == Blueprint::GUTTER_WIDTH && 
      self.input_padding == Blueprint::INPUT_PADDING && 
      self.input_border == Blueprint::INPUT_BORDER
    end
    
    # Loads grid.css.erb file, binds it to current instance, and returns output
    def generate_grid_css
      # loads up erb template to evaluate custom widths
      css = ERB::new(File.path_to_string(CustomLayout::CSS_ERB_FILE))
    
      # bind it to this instance
      css.result(binding)
    end
  end
end