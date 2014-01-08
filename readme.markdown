# testling

Run [testling-ci](http://ci.testling.com) tests locally.

# example

write a test:

``` js
var test = require('tape');

test('beep boop', function (t) {
    t.plan(2);
    t.equal(1+1, 2);
    t.ok(true);
});
```

run your test in a local headless browser:

```
$ browserify example/test.js | testling

TAP version 13
# beep boop
ok 1 should be equal
ok 2 (unnamed assert)

1..2
# tests 2
# pass  2

# ok
```

with an exit code of 0 for successes and non-zero for failures like a good unix
citizen

Once you have a `package.json` with a configured `"testling"` field, you can just
type:

```
$ testling
```

to run all your tests locally just like they will be run on
[testling-ci](https://ci.testling.com). This includes mocha harnesses, scripts,
and files parameters.

# usage

```
usage: testling {DIRECTORY|-} {OPTIONS}

If there (is no DIRECTORY and stdin is a tty) or the DIRECTORY is "-",
javascript will be read from stdin and executed.

Otherwise, DIRECTORY (or the $CWD) will be checked for a package.json with a
testling field.

OPTIONS are:

     --html  Instead of launching a server, show the generated html.

  --no-show  Don't render the console.log() output to the document body.

         -u  Instead of launching a browser, print the url to visit so you can
             open the browser yourself.

         -x  Launch a browser with an explicit command. By default, chrome or
             firefox is launched by searching your $PATH.

     --host  Set up the testling url on a specific hostname. Default: localhost

     --port  Set up the testling url on a specific port
```

# testling field

[Read more about how the package.json "testling" field works.](doc/testling_field.markdown)

# code coverage

To compute code coverage, just use the
[coverify](https://npmjs.org/package/coverify)
transform with `-t coverify` when you run browserify.

[coverify](https://npmjs.org/package/coverify) writes coverage data with
console.log(), so you can pipe the output of testling through to the `coverify`
command to parse the results and give human-readable output:

```
$ browserify -t coverify test.js | testling | coverify

TAP version 13
# beep boop
ok 1 should be equal

1..1
# tests 1
# pass  1

# ok

# /home/substack/projects/coverify/example/test.js: line 7, column 16-28

  if (err) deadCode();
           ^^^^^^^^^^^

# /home/substack/projects/coverify/example/foo.js: line 3, column 35-48

  if (i++ === 10 || (false && neverFires())) {
                              ^^^^^^^^^^^^

```

The exit code of coverify is non-zero when there are unreachable expressions.

# dependencies

Make sure you have [PhantomJS](https://github.com/ariya/phantomjs) installed; this is the headless browser that testling will run your tests in if you are not using the `-u` option.

# custom preprocess command

Its possible to configure testling to run a custom bundle command instead of
the default(browserify --debug).  A simple use case is to prepend shims for
testing a library in older browsers.

For example, lets say you have created a library that uses ES5 features but
needs to be tested in IE7. To test this library correctly the shims need to be
prepended in the browserified bundle, which can be achieved doing something
like this:

```sh
npm install --save-dev es5-shim json3
```

Then configure the "preprocess" option:

```json
{
  "testling": {
    "preprocess": {
      "command": "bash",
      "args": [
        "-c",
        "browserify test/*.js | cat node_modules/json3/lib/json3.js node_modules/es5-shim/es5-sh{im,am}.js -"
      ]
    },
  }
}
```

The above runs browserify and prepend shims to the bundle served by testling.

# install

First, install `browserify` globally so that the `testling` command can find it
when there is no `browserify` in `./node_modules/.bin`:

```
npm install -g browserify
```

then do:

```
npm install -g testling
```

# license

MIT

![attack of the testlings!](http://substack.net/images/browsers/war_of_the_browsers.png)
