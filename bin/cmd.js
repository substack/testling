#!/usr/bin/env node
var http = require('http');
var launcher = require('browser-launcher');
var concat = require('concat-stream');
var finished = require('tap-finished');
var argv = require('optimist').argv;

var fs = require('fs');
var prelude = fs.readFileSync(__dirname + '/../bundle/prelude.js', 'utf8');

var src, launch;
var pending = 3;

process.stdin.pipe(concat(function (err, src_) {
    src = src_;
    if (--pending === 0) ready();
}));

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
    else if (req.url === '/') {
        res.setHeader('content-type', 'text/html');
        res.end('<html><body><script src="/bundle.js"></script></body></html>');
    }
    else if (req.url === '/bundle.js') {
        res.setHeader('content-type', 'application/javascript; charset=utf-8;');
        res.end(prelude + '\n' + src);
    }
});

server.listen(0, function () {
    if (--pending === 0) ready();
});

launcher(function (err, launch_) {
    if (err) return console.error(err);
    launch = launch_;
    if (--pending === 0) ready();
});

function ready () {
    var opts = {
        headless: true,
        browser: launch.browsers.local[0].name
    };
    var href = 'http://localhost:' + server.address().port + '/';
    launch(href, opts, function (err, ps) {
        if (err) return console.error(err);
        if (--pending === 0) ready();
    });
}
