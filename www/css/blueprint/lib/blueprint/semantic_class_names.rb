module Blueprint
  # parses a hash of key/value pairs, key being output CSS selectors, value being a list of CSS selectors to draw from
  class SemanticClassNames
    attr_accessor :class_assignments
    attr_reader   :namespace, :source_file
  
    # ==== Options
    # * <tt>options</tt>
    #   * <tt>:namespace</tt> -- Namespace to be used when matching CSS selectors to draw from
    #   * <tt>:source_file</tt> -- Source file to use as reference of CSS selectors.  Defaults to Blueprint's generated screen.css
    #   * <tt>:class_assignments</tt> -- Hash of key/value pairs, key being output CSS selectors, value being a list of CSS selectors to draw from
    def initialize(options = {})
      @namespace = options[:namespace] || ""
      @source_file = options[:source_file] || File.join(Blueprint::BLUEPRINT_ROOT_PATH, 'screen.css')
      self.class_assignments = options[:class_assignments] || {}
    end
  
    # Returns a CSS string of semantic selectors and associated styles
    # ==== Options
    # * <tt>assignments</tt> -- Hash of key/value pairs, key being output CSS selectors, value being a list of CSS selectors to draw from; defaults to what was passed in constructor or empty hash
    def css_from_assignments(assignments = {})
      assignments ||= self.class_assignments
    
      # define a wrapper hash to hold all the new CSS assignments
      output_css = {}
    
      #loads full stylesheet into an array of hashes
      blueprint_assignments = CSSParser.new(File.path_to_string(self.source_file)).parse
    
      # iterates through each class assignment ('#footer' => '.span-24 div.span-24', '#header' => '.span-24 div.span-24')
      assignments.each do |semantic_class, blueprint_classes|
        # gathers all BP classes we're going to be mimicing
        blueprint_classes = blueprint_classes.split(/,|\s/).find_all {|c| !c.blank? }.flatten.map {|c| c.strip }
        classes = []
        # loop through each BP class, grabbing the full hash (containing tags, index, and CSS rules)
        blueprint_classes.each do |bp_class|
          match = bp_class.include?('.') ? bp_class.gsub(".", ".#{self.namespace}") : ".#{self.namespace}#{bp_class}"
          classes << blueprint_assignments.find_all {|line| line[:tags] =~ Regexp.new(/^([\w\.\-\:]+, ?)*#{match}(, ?[\w\.\-\:]+)*$/) }.uniq
        end
      
        # clean up the array
        classes = classes.flatten.uniq
      
        # set the semantic class to the rules gathered in classes, sorted by index
        # this way, the styles will be applied in the correct order from top of file to bottom
        output_css[semantic_class] = "#{classes.sort_by {|i| i[:idx]}.map {|i| i[:rules]}}"
      end
    
      # return the css in proper format
      css = ""
      output_css.each do |tags, rules|
        css += "#{tags} {#{rules}}\n"
      end
      css
    end
  end
end