#
# Build definition
#

require 'rubygems'
require 'set'
require 'sass'
require 'pp'
require 'securerandom'
require 'pathname'
require 'net/http'
require 'fileutils'
require 'listen'
require 'uglifier'
require 'jshintrb'
require 'typescript-node'
require 'uri'

# Gets set to false when compiling for a deployment
$debug = true

# Asks for user input and returns the result
def getInput ( question )
    puts question
    response = STDIN.gets.strip
    puts
    response
end

# Asks the user a yes or no question
def getYesOrNo ( question )
    response = getInput("#{question} (y/n)")

    if response.downcase == "y"
        true
    elsif response.downcase == "n"
        false
    else
        puts "Invalid response\n"
        getYesOrNo( question )
    end
end

# Finds the war file in the target directory
def war
    wars = Dir.glob('target/scala-*/*.war')
    if wars.length == 0
        throw "Could not locate packaged war file"
    elsif wars.length > 1
        throw "Found more than 1 war file. Consider doing a `rake clean`"
    end
    wars[0]
end


# Requires that the heroku command line interface is installed
task :herokucli do
    unless system("which heroku > /dev/null")
        puts "Heroku command line interface not found!"
        fail "Command not found: heroku"
    end
end


$app_name = nil
# Ensures that the heroku app name exists
task :herokuapp do

    $app_name = File.read(".heroku").strip if File.exists?(".heroku")

    if $app_name.nil? || $app_name.empty?
        $app_name = getInput("Enter the Heroku project name:")
        File.open(".heroku", 'w') { |file| file.write($app_name) }
    end
end


# Configures the heroku project
task :heroku => [ :herokucli, :herokuapp ] do
    sh("heroku config:set --app #{$app_name} " +
        "HEROKU_PROD=true " +
        "ADMIN_HOST=#{$app_name}.herokuapp.com")
    puts
end


# Configures the cloudant configuration
task :cloudant => [ :herokucli, :herokuapp ] do
    username = getInput("Please enter your Cloudant user name:")
    apiKey = getInput("Please enter your Cloudant API key:")
    password = getInput("Please enter the Cloudant API key password:")
    database = getInput("Please enter your Cloudant database name:")
    sh("heroku config:set --app #{$app_name} " +
        "CLOUDANT_USER=#{username} " +
        "CLOUDANT_KEY=#{apiKey} " +
        "CLOUDANT_PASSWORD=#{password} " +
        "COUCHDB_DATABASE=#{database}")
    puts
end


# Sets up the "secrect" key for this instance
task :secret => [ :herokucli, :herokuapp ] do
    key = SecureRandom.uuid
    sh("heroku config:set --app #{$app_name} SECRET_KEY=#{key}")
    puts
end


# Initializes the heroku environment
task :setup => [ :heroku, :secret, :cloudant ] do
    sh("heroku plugins:install https://github.com/heroku/heroku-deploy")
    sh("heroku ps:scale --app #{$app_name} web=1")
end


# Compile the Sass files and return a list of compiled output files
def process_sass
    includes = ["css"] + Gem::Specification.inject([]) do |memo, gem|
        dir = gem.gem_dir + "/app/assets/stylesheets"
        memo.push(dir) if File.exists?(dir)
        memo
    end

    puts "Sass include dirs:"
    pp(includes)

    Dir.glob('css/**/*')
        .select{ |file| [".sass", ".scss"].to_set.include?(File.extname(file)) }
        .reject{ |file| File.basename(file).start_with?("_") }
        .map do |file|
            withoutExt = file.chomp( File.extname(file) )
            compile_to = "target/temp_resources/#{withoutExt}.css"
            FileUtils.mkpath( File.dirname(compile_to) )

            puts "Compiling #{file} to #{compile_to}"

            engine = Sass::Engine.for_file(
                file,
                :style => $debug ? :nested : :compressed,
                :line_numbers => $debug,
                :syntax => :scss,
                :full_exception => true,
                :load_paths => includes
            )

            File.open(compile_to, 'w') { |file| file.write(engine.render) }
        end
end

# Copies files in the given directory to the resources directory
def copy_resources ( dir )
    Dir.glob( File.join("target/temp_resources/", dir, "**/*") )
        .select{ |path| File.file?(path) }
        .each do |file|
            destination = File.join(
                "target/resources",
                file.reverse.chomp("target/temp_resources/".reverse).reverse )
            puts "Creating #{destination}"
            FileUtils.mkpath( File.dirname(destination) )
            FileUtils.cp(file, destination)
        end
end

# Compile the Sass
task :sass do
    puts "Compiling Sass..."
    process_sass
    copy_resources("css")
end

task :css => [ :sass ]


# Returns a list of js files to ignore when running jshint
def jshint_ignore
    tests = Dir.glob('**/.jshintignore').map do |jshint_file|

        dir = File.dirname(jshint_file) + "/"

        lines = File.read(jshint_file).split("\n").map do |line|
            "/" + line.strip
        end

        lambda do |file|
            file.start_with?(dir) && lines.any? { |line| file.end_with? line }
        end
    end

    lambda do |file|
        tests.any? { |test| test.call(file) }
    end
end


# A helper method that finds javascript files, jshints them and figures out
# where to put them, then hands off compilation to a helper method
def process_js ( &compile )
    reporter = Jshintrb::Reporter::Default.new

    # Executes JSHint on a file and returns its content
    def jsHint ( file )
        puts "JSHinting #{file}"
        errors = Jshintrb.lint( File.read(file) )
        if errors.length > 0
            puts
            errors.map do |err|
                puts ("  line %d, column %d: %s\n" +
                    "    %s\n" +
                    "    %s^\n") % [
                        err['line'], err['character'], err['reason'],
                        err['evidence'],
                        "~" * (err['character'] - 1)
                    ]
            end
            fail "JSHint failed"
        end

        File.read(file)
    end

    # Compiles a typescript file
    def compileTS ( file )
        puts "Compiling #{file}"
        result = TypeScript::Node.compile_file( file )
        fail result.stderr if result.exit_status != 0
        result.js
    end

    is_ignored = jshint_ignore

    puts "Compiling JavaScript..."
    Dir.glob('js/**/*').map do |file|
        next unless File.file?( file )

        filename = file.chomp(File.extname(file))
        compile_to = "target/temp_resources/#{filename}.js"
        FileUtils.mkpath( File.dirname(compile_to) )

        if ( File.extname(file) == ".ts" )
            next if File.basename(file).start_with?("_")
            content = compileTS( file )
        elsif ( is_ignored.call(file) )
            puts "Ignoring JSHint for #{file}"
            content = File.read(file)
        else
            content = jsHint( file )
        end

        puts "  Compiling to #{compile_to}"

        File.open(compile_to, 'w') do |out|
            out.write( compile.call( content ) )
        end
    end
end


# Compile the JavaScript
task :javascript do
    process_js { |js| Uglifier.new.compile( js ) }
    copy_resources( "js" )
end

task :js => [ :javascript ]


# Listen for changes to Javascript and CSS, then rebuild
task :watch do
    puts "Setting up watch..."

    def recompile( css, js )
        if css
            begin
                process_sass
            rescue Sass::SyntaxError => err
                puts
                puts "Sass Syntax Error"
                puts "  File: " + err.sass_filename
                puts "  Line: " + err.sass_line.to_s
                puts " Mixin: " + err.sass_mixin if err.sass_mixin
            end
        end

        puts

        if js
            begin
                process_js { |js| js }
            rescue RuntimeError => err
                puts
                puts err
            end
        end

        puts
        puts "Finished at: " + Time.new.to_s
    end

    targets = ['css', 'js'].map do |file|
        File.symlink?( file ) ? File.readlink( file ) : file
    end

    recompile( true, true )

    Listen.to(targets) do |modified, added, removed|
        joined = modified + added + removed

        puts
        puts "Recompiling..."
        pp joined

        recompile(
            joined.any? { |file| File.extname(file) == ".scss" },
            joined.any? { |file| [".js", ".ts"].include? File.extname(file) }
        )
    end.start
    sleep
end


# Cleans out all build artifacts
task :clean do
    sh("sbt clean")
end


# Copies resources to the compiled resource directory
task :resources do
    FileUtils.mkpath( "target/resources" )

    def copyResource ( dir )
        puts "Copying #{dir} to target/resources/#{dir}"
        FileUtils.cp_r(dir, "target/resources") if File.exists?(dir)
    end

    copyResource( "assets" )
    copyResource( "templates" )
end


# Builds the java WAR file
task :package => [ :sass, :javascript, :resources ] do
    sh("sbt package-war")
    puts "Packaged: #{war}"
end


# Default build behavior
task :default => [ :package ]


$jetty_runner = "target/jetty-runner.jar"

# Downloads the jetty runner if it hasnt been downloaded already
task :jettyrunner do
    unless File.exists?($jetty_runner)
        puts "Downloading Jetty runner..."
        Net::HTTP.start( "repo2.maven.org" ) do |http|
            resp = http.get("/maven2/org/mortbay/jetty/jetty-runner/8.1.9.v20130131/jetty-runner-8.1.9.v20130131.jar")
            open($jetty_runner, "wb") { |file| file.write(resp.body) }
        end
        puts "Downloaded to #{$jetty_runner}"
    else
        puts "Using #{$jetty_runner}"
    end
end


# Disables debug mode
task :disable_debug do
    $debug = false
end

# Compiles and runs the WAR
task :start => [ :disable_debug, :default, :jettyrunner ] do
    sh("java -jar #{$jetty_runner} #{war}")
end


# Deploys this site out to heroku
task :deploy => [ :disable_debug, :herokucli, :herokuapp, :default ] do
    sh("heroku deploy:war --app #{$app_name} --war #{war}")
end


# Bootstraps data into a new site
task :bootstrap, [:url] => [ :herokucli, :herokuapp ] do |t, args|

    name = getInput("What is your name?")
    email = getInput("What is your email address?")
    title = getInput("What is the name of your website?")

    # Allows you to test locally by doing this:
    # rake "bootstrap[http://127.0.0.1:8080]"
    baseURL = args[:url] || "https://#{$app_name}.herokuapp.com";
    url = URI(baseURL)

    puts "Sending bootstrap request to:"
    puts url
    puts

    key = SecureRandom.hex(128)

    if args.empty?
        sh("heroku config:set --app #{$app_name} BOOTSTRAP_KEY=#{key}")
        puts
    end

    resp = Net::HTTP.start(
        url.host, url.port, :use_ssl => url.scheme == "https"
    ) do |http|
        req = Net::HTTP::Post.new( "/admin/api/bootstrap" )
        req.set_form_data(
            :bootstrapKey => key, :name => name,
            :email => email, :title => title
        )
        http.request(req)
    end

    fail "Bootstrap failed: #{resp.body}" unless resp.is_a?(Net::HTTPSuccess)

    puts "Success!"
end

