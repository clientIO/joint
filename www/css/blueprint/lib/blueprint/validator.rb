module Blueprint
  # Validates generated CSS against the W3 using Java
  class Validator
    attr_reader :error_count
    
    def initialize
      @error_count = 0
    end

    # Validates all three CSS files
    def validate
      java_path = `which java`.rstrip
      raise "You do not have a Java installed, but it is required." if java_path.blank?
    
      output_header
    
      Blueprint::CSS_FILES.keys.each do |file_name|
        css_output_path = File.join(Blueprint::BLUEPRINT_ROOT_PATH, file_name)
        puts "\n\n  Testing #{css_output_path}"
        puts "  Output ============================================================\n\n"
        @error_count += 1 if !system("#{java_path} -jar '#{Blueprint::VALIDATOR_FILE}' -e '#{css_output_path}'")
      end
    
      output_footer
    end
    
    private
    
    def output_header
      puts "\n\n"
      puts "  ************************************************************"
      puts "  **"
      puts "  **   Blueprint CSS Validator"
      puts "  **   Validates output CSS files"
      puts "  **"
      puts "  ************************************************************"
    end

    def output_footer
      puts "\n\n"
      puts "  ************************************************************"
      puts "  **"
      puts "  **   Done!"
      puts "  **   Your CSS files are#{" not" if error_count > 0} valid.#{"  You had #{error_count} error(s) within your files" if error_count > 0}"
      puts "  **"
      puts "  ************************************************************"
    end
  end
end