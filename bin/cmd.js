#!/usr/bin/env node
var http = require('http');
var spawn = require('child_process').spawn;
var launcher = require('browser-launcher');
var concat = require('concat-stream');
var finished = require('tap-finished');
var parseCommand = require('shell-quote').parse;
var ent = require('ent');
var fs = require('fs');

var argv = require('optimist').argv;
if (argv.h || argv.help) {
    return fs.createReadStream(__dirname + '/usage.txt').pipe(process.stdout);
}

var unglob = require('../lib/unglob.js');

var path = require('path');
var prelude = fs.readFileSync(__dirname + '/../bundle/prelude.js', 'utf8');

var bundle, launch, html;
var scripts = [];
var pending = 3;
var dir = path.resolve(argv._[0] === '-' ? false : argv._[0] || process.cwd());
var ecstatic = require('ecstatic')(dir);
var resolve = require('resolve').sync;

if ((process.stdin.isTTY || argv._.length) && argv._[0] !== '-') {
    try {
        var pkg = require(path.join(dir, 'package.json'));
    }
    catch (err) {
        if (err.code === 'MODULE_NOT_FOUND') {
            console.error(
                'No package.json in ' + dir + ' found.\n'
                + 'Consult the quick start guide for how to create one:\n'
                + 'https://ci.testling.com/guide/quick_start'
            );
        }
        else {
            console.error(err.message);
        }
        return;
    }
    
    if (!pkg.testling) {
        console.error(
            'The "testling" field isn\'t present '
            + 'in ' + path.join(dir, 'package.json') + '.\n'
            + 'This field is required by testling. Please consult:\n'
            + 'https://ci.testling.com/guide/quick_start'
        );
        return;
    }
    var bundleId = Math.floor(Math.pow(16,8)*Math.random()).toString(16);
    
    if (pkg.testling.preprocess) {
        // todo
    }
    else if (!pkg.testling.html) {
        unglob(dir, pkg.testling, function (err, expanded) {
            if (err) return console.error(err);
            process.env.PATH = path.resolve(dir, 'node_modules/.bin')
                + ':' + process.env.PATH
            ;
            scripts = expanded.script;
            if (scripts.length > 0) {
                html = html.replace('__SCRIPTS__', function() {
                    return scripts.map(function (s) {
                        return '<script src="' + ent.encode(s) + '"></script>'
                    }).join('\n');
                });
            }

            var args = expanded.file.concat('--debug');
            var ps = spawn('browserify', args, { cwd: dir });
            ps.stdout.pipe(concat(function (src) {
                bundle = src;
            }));
            ps.stderr.pipe(process.stderr);
            ps.on('exit', function (code) {
                if (code !== 0) {
                    console.error('FAILURE: non-zero exit code');
                }
                else ready();
            });
        });
    }
    
    if (pkg.testling.html) {
        fs.readFile(path.join(dir, pkg.testling.html), function (err, src) {
            if (err) console.error('while loading testling.html: ' + err);
            else {
                html = '<script src="/__testling_prelude.js"></script>' + src;
                ready();
            }
        });
    }
    else {
        var before = '', after = '';
        if (/^mocha(-|$)/.test(pkg.testling.harness)) {
            var mochaFile = path.relative(dir,
                resolve('mocha/mocha.js', { basedir: dir })
            );
            var m = /^mocha-(\w+)/.exec(pkg.testling.harness);
            var ui = m && m[1] || 'bdd';
            before =
                '<script src="' + mochaFile + '"></script>'
                + '<script>mocha.setup(' + JSON.stringify({
                    ui: ui, reporter: 'tap'
                }) + ')</script>'
            ;
            after = '<script>mocha.run()</script>';
        }
        
        html = '<html><body>'
            + '<script src="/__testling_prelude.js"></script>'
            + before
            + '__SCRIPTS__'
            + '<script src="/__testling_bundle.js"></script>'
            + after
            + '</body></html>'
        ;
    }
}
else {
    html = '<html><body>'
        + '<script src="/__testling_prelude.js"></script>'
        + '<script src="/__testling_bundle.js"></script>'
        + '</body></html>'
    ;
    process.stdin.pipe(concat(function (src) {
        bundle = src;
        ready();
    }));
}

var xws = require('xhr-write-stream')();

var server = http.createServer(function (req, res) {
    if (req.url === '/sock') {
        req.pipe(xws(function (stream) {
            stream.pipe(process.stdout, { end: false });
            stream.pipe(finished(function (results) {
                if (results.ok) {
                    process.exit(0);
                }
                else process.exit(1);
            }));
        }));
        req.on('end', res.end.bind(res));
    }
    else if (html && req.url === '/') {
        res.setHeader('content-type', 'text/html');
        res.end(html);
    }
    else if (req.url === '/__testling_prelude.js') {
        res.setHeader('content-type', 'application/javascript');
        res.end(prelude);
    }
    else if (req.url === '/__testling_bundle.js') {
        res.setHeader('content-type', 'application/javascript');
        res.end(bundle);
    }
    else {
        ecstatic(req, res);
    }
});

server.listen(0, ready);

if (argv.u || argv.cmd) {
    ready();
}
else {
    launcher(function (err, launch_) {
        if (err) return console.error(err);
        launch = launch_;
        ready();
    });
}

function ready () {
    if (--pending !== 0) return;
    
    var opts = {
        headless: true,
        browser: launch && launch.browsers.local[0].name
    };
    var href = 'http://localhost:' + server.address().port + '/';
    if (argv.u) {
        console.log(href);
    }
    else if (argv.bcmd) {
        var cmd = parseCommand(argv.bcmd);
        var ps = spawn(cmd[0], cmd.slice(1).concat(href));
        ps.stderr.pipe(process.stderr);
        ps.stdout.pipe(process.stderr);
        ps.on('exit', function (code) {
            if (code !== 0) {
                console.error(
                    'Command ' + JSON.stringify(argv.bcmd)
                    + ' terminated with non-zero exit code'
                );
            }
        });
    }
    else {
        launch(href, opts, function (err, ps) {
            if (err) return console.error(err);
        });
    }
}
