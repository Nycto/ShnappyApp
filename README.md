ShnappyApp [![Build Status](https://secure.travis-ci.org/Nycto/ShnappyApp.png?branch=master)](http://travis-ci.org/Nycto/ShnappyApp)
==========

A dead simple CMS.

* Free hosting using Heroku and Cloudant free tiers
* Host multiple sites on one instance
* Multi-user admin panel

Getting Started
---------------

Make sure you have the following tools installed:

* [Ruby](https://www.ruby-lang.org/en/)
* [Rake](http://rake.rubyforge.org/)
* [Bundler](http://bundler.io/)
* [Scala](http://www.scala-lang.org/)
* [SBT](http://www.scala-sbt.org/)

Once you've got all that, follow these steps:

1. Create a new [Heroku App](https://dashboard.heroku.com/apps) (It's free!)
2. Create a new [Cloudant Database](https://cloudant.com/dashboard) (Also free!)
3. Fork this repo
4. Clone a local copy of your fork
5. Run `bundle install`
6. Run `bundle exec rake deploy`
7. Run `bundle exec rake bootstrap`

At this point, you should have a site! You can start creating content by
going to the admin panel (Just replace `example` with whatever your Heroku app
is named):

    https://example.herokuapp.com/admin

Customizing
-----------

All of the HTML, CSS and JavaScript can be changed however you want. It is
totally in your control. To start editing the site, open a console and run:

```
sbt
container:start
```

This will start up a local HTTP server running your site.

Then, in another console (I recommend [tmux](http://tmux.sourceforge.net/)),
run this:

```
bundle exec rake watch
```

This will cause `rake` to automatically recompile your Sass and JavaScript when
it changes.

Start making changes and load `http://127.0.0.1:8080` to see them live.

Once your done, commit everything, push the changes upstream, then re-run
`bundle exec rake deploy`.


License
-------

This software is released under the MIT License, which is pretty spiffy. You
should have received a copy of the MIT License along with this program. If not,
see <http://www.opensource.org/licenses/mit-license.php>.

