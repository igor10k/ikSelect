LIB_ROOT = File.expand_path(File.dirname(__FILE__))
LIB_NAME = "jquery.ikSelect"

task :default => [:whitespace, :jshint, :clean, :dist]

desc "Clean the distribution directory."
task :clean do
  rm_rf File.join(LIB_ROOT, LIB_NAME + ".min.js")
end

def normalize_whitespace(filename)
  contents = File.readlines(filename)
  contents.each { |line| line.sub!(/\s+$/, "") }
  File.open(filename, "w") do |file|
    file.write contents.join("\n").sub(/(\n+)?\Z/m, "\n")
  end
end

desc "Strip trailing whitespace and ensure each file ends with a newline"
task :whitespace do
  Dir["*", "src/**/*", "test/**/*", "examples/**/*"].each do |filename|
    normalize_whitespace(filename) if File.file?(filename)
  end
end

def google_compiler(src, target)
  puts "Minifying #{src} with Google Closure Compiler..."
  `java -jar vendor/google-compiler/compiler.jar --js #{src} --summary_detail_level 3 --js_output_file #{target}`
end

def yui_compressor(src, target)
  puts "Minifying #{src} with YUI Compressor..."
  `java -jar vendor/yuicompressor/yuicompressor-2.4.2.jar #{src} -o #{target}`
end

def uglifyjs(src, target)
  begin
    require 'uglifier'
  rescue LoadError => e
    if verbose
      puts "\nYou'll need the 'uglifier' gem for minification. Just run:\n\n"
      puts "  $ gem install uglifier"
      puts "\nand you should be all set.\n\n"
      exit
    end
    return false
  end
  puts "Minifying #{src} with UglifyJS..."
  File.open(target, "w"){|f| f.puts Uglifier.new.compile(File.read(src))}
end

def process_minified(src, target)
  mpath = File.join(LIB_ROOT, LIB_NAME + ".min.js")
  msize = File.size(mpath)
  # `gzip -9 #{mpath}`

  osize = File.size(src)
  # dsize = File.size(mpath + '.gz')
  # rm_rf mpath + '.gz'

  puts "Original version: %.3fk" % (osize/1024.0)
  puts "Minified: %.3fk" % (msize/1024.0)
  # puts "Minified and gzipped: %.3fk, compression factor %.3f" % [dsize/1024.0, osize/dsize.to_f]
end

desc "Generates a minified version for distribution, using UglifyJS."
task :dist do
  src, target = File.join(LIB_SRC_DIR, LIB_NAME + ".js"), File.join(LIB_ROOT, LIB_NAME + ".min.js")
  uglifyjs src, target
  process_minified src, target
end

desc "Generates a minified version for distribution using the Google Closure compiler."
task :googledist do
  src, target = File.join(LIB_ROOT, LIB_NAME + ".js"), File.join(LIB_ROOT, LIB_NAME + ".min.js")
  google_compiler src, target
  process_minified src, target
end

desc "Generates a minified version for distribution using the YUI compressor."
task :yuidist do
  src, target = File.join(LIB_ROOT, LIB_NAME + ".js"), File.join(LIB_ROOT, LIB_NAME + ".min.js")
  yui_compressor src, target
  process_minified src, target
end

require "jshintrb/jshinttask"
Jshintrb::JshintTask.new :jshint do |t|
  t.pattern = LIB_NAME + '.js'
  t.options = {
      :bitwise => true,
      :curly => true,
      :eqeqeq => true,
      :forin => false,
      :immed => true,
      :latedef => true,
      :newcap => true,
      :noarg => true,
      :noempty => true,
      :nonew => true,
      :plusplus => true,
      :regexp => true,
      :undef => true,
      :strict => false,
      :trailing => true,
      :browser => true,
      :undef => true,
      :predef => []
  }
end
