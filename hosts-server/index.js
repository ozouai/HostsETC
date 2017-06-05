"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Created by omar on 6/3/17.
 */
/// <reference path="../typings/index.d.ts" />
var fs = require("fs");
var express = require("express");
var HostFile = require("./hostFile");
var bodyParser = require("body-parser");
var passFile = null;
var pass = "";
process.stdout.resume();
for (var _i = 0, _a = process.argv; _i < _a.length; _i++) {
    var arg = _a[_i];
    if (arg.indexOf("-passFile") != -1) {
        passFile = arg.substr("-passFile:".length);
    }
}
console.error("Using PassFile: '" + passFile + "'");
if (passFile != null) {
    var pass = fs.readFileSync(passFile, "utf-8");
}
var app = express();
app.use(bodyParser.urlencoded());
app.listen(process.env.PORT || "5002", 'localhost', function () {
    console.error("Listening");
});
var mainHostFile = new HostFile.HostFile(fs.readFileSync("/etc/hosts", "utf-8"));
app.get("/", function (req, res) {
    res.json({
        hello: "world"
    });
});
app.get("/systemHosts", function (req, res) {
    fs.readFile("/etc/hosts", "utf-8", function (err, data) {
        res.contentType("text/text");
        res.send(data);
    });
});
app.get("/hosts", function (req, res) {
    res.contentType("text/text");
    res.send(mainHostFile.toString());
});
app.get("/hostsJSON", function (req, res) {
    res.json(mainHostFile);
});
app.get("/editLine/:line/:key/:value", function (req, res) {
    var r = mainHostFile.lines[parseInt(req.params.line)].modify(req.params.key, req.params.value);
    if (!r) {
        res.status(500);
        res.send("Bad Data");
    }
    else {
        res.send("Success!");
    }
});
app.get("/restrictedHosts", function (req, res) {
    res.json(HostFile.getRestrictedDomains());
});
app.post("/createEntry", function (req, res) {
    var line = new HostFile.AddressLine();
    if (!line.modify("ipaddr", req.body.ipaddr)) {
        res.status(500);
        return res.send("Invalid");
    }
    if (!line.modify("addr", req.body.addr)) {
        res.status(500);
        return res.send("Invalid");
    }
    if (!line.modify("comment", req.body.comment)) {
        res.status(500);
        return res.send("Invalid");
    }
    line.modify("active", true);
    var i = mainHostFile.addLine(line);
    res.json({ line: i });
});
app.get("/commit", function (req, res) {
    fs.writeFile("/etc/hosts", mainHostFile.toString(), function (err) {
        if (err) {
            res.status(500);
            res.send("Error Saving");
        }
        res.send("Success!");
    });
});
process.on('disconnect', function () {
    console.log('parent exited');
    process.exit();
});
process.stdout.on('end', function () {
    process.exit();
});
