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

*Note:* to use `testling` locally you will need to have your preferred version
    of browserify available as a command. You can do this by installing it
    globally using `npm install -g browserify`

# install

With [npm](http://npmjs.org) just do:

```
npm install -g testling
```

# license

MIT

![attack of the testlings!](http://substack.net/images/browsers/war_of_the_browsers.png)
