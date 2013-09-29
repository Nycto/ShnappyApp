Gem::Specification.new do |gem|

    # Generate a map of the keys defined in build.sbt
    build = File.open("build.sbt")
        .select { |line| line.include?(":=") }
        .inject({}) do |memo, line|
            parts = line.split(":=")
            memo[ parts[0].strip ] = parts[1].strip.gsub(/^"|"$/, "")
            memo
        end

    gem.name        = build["name"]
    gem.version     = build["version"]
    gem.platform    = Gem::Platform::RUBY
    gem.summary     = "A website built with Shnappy"
    gem.authors     = "Some People"

    gem.add_development_dependency('rake')
    gem.add_development_dependency('listen', '>= 1.2.2')
    gem.add_development_dependency('sass', '>= 3.2.0')
    gem.add_development_dependency('bourbon', '>= 3.1.0')
    gem.add_development_dependency('neat', '>= 1.3.0')
    gem.add_development_dependency('uglifier', '>= 2.2.1')
    gem.add_development_dependency('jshintrb', '>= 0.2.4')
    gem.add_development_dependency('typescript-node', '>= 0.0.5')
end

