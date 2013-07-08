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


# Configures the heroku project
task :heroku => [ :herokucli ] do
    # Fetch heroku account information
    name = getInput("Enter the Heroku project name:")
    puts
end


# Configures the cloudant configuration
task :cloudant => [ :herokucli ] do
    username = getInput("Please enter your Cloudant user name:")
    apiKey = getInput("Please enter your Cloudant API key:")
    password = getInput("Please enter the password for that Cloudant API key:")
    database = getInput("Please enter your Cloudant database name:")
    sh("heroku config:set " +
        "CLOUDANT_USER=#{username} " +
        "CLOUDANT_KEY=#{apiKey} " +
        "CLOUDANT_PASSWORD=#{password} " +
        "COUCHDB_DATABASE=#{database}")
    puts
end


# Sets up the "secrect" key for this instance
task :secret => [ :herokucli ] do
    key = SecureRandom.uuid
    sh("heroku config:set SECRET_KEY=#{key}")
    puts
end


# Initializes the heroku environment
task :setup => [ :heroku, :secret, :cloudant ] do
    sh("heroku plugins:install https://github.com/heroku/heroku-deploy")
    sh("heroku ps:scale web=1")
end


# Compile the Sass
task :sass do
    puts "Compiling Sass..."

    includes = ["css"] + Gem::Specification.inject([]) do |memo, gem|
        dir = gem.gem_dir + "/app/assets/stylesheets"
        memo.push(dir) if File.exists?(dir)
        memo
    end

    puts "Sass include dirs:"
    pp(includes)

    Dir.glob('css/*')
        .select{ |file| [".sass", ".scss"].to_set.include?(File.extname(file)) }
        .reject{ |file| File.basename(file).start_with?("_") }
        .map do |file|
            withoutExt = file.chomp( File.extname(file) )
            compileTo = "target/resources/#{withoutExt}.css"
            FileUtils.mkpath( File.dirname(compileTo) )

            puts "Compiling #{file} to #{compileTo}"

            engine = Sass::Engine.for_file(
                file,
                :syntax => :scss, :full_exception => true,
                :load_paths => includes
            )

            File.open(compileTo, 'w') { |file| file.write(engine.render) }
        end
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

    copyResource( "js" )
    copyResource( "assets" )
    copyResource( "templates" )
end


# Builds the java WAR file
task :package => [ :sass, :resources ] do
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

# Compiles and runs the WAR
task :start => [ :default, :jettyrunner ] do
    sh("java -jar #{$jetty_runner} #{war}")
end


# Deploys this site out to heroku
task :deploy => [ :herokucli, :default ] do
    sh("heroku deploy:war --war #{war}")
end

