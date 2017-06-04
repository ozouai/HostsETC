/**
 * Created by omar on 6/3/17.
 */
/// <reference path="../typings/index.d.ts" />
import * as fs from "fs";
import * as express from "express";
import * as HostFile from "./hostFile";
var passFile= null;
var pass = "";
process.stdout.resume();
for(var arg of process.argv) {
    if(arg.indexOf("-passFile") != -1) {
        passFile = arg.substr("-passFile:".length);
    }
}

console.error("Using PassFile: '"+passFile+"'");

if(passFile != null) {
    var pass = fs.readFileSync(passFile, "utf-8");
}

var app = express();
app.listen(process.env.PORT || "5002");


var mainHostFile = new HostFile.HostFile(fs.readFileSync("/etc/hosts", "utf-8"));


app.get("/", (req, res) => {
    res.json({
        hello:"world"
    })
});

app.get("/systemHosts", (req, res) => {
    fs.readFile("/etc/hosts", "utf-8", (err, data) => {
        res.contentType("text/text");
       res.send(data);
    });
});

app.get("/hosts", (req, res) => {
    res.contentType("text/text");
    res.send(mainHostFile.toString());
});

app.get("/hostsJSON", (req, res) => {
    res.json(mainHostFile);
});

app.get("/editLine/:line/:key/:value", (req, res) => {
    var r = mainHostFile.lines[parseInt(req.params.line)].modify(req.params.key, req.params.value);
    if(!r) {
        res.status(500);
        res.send("Bad Data");
    } else {
        res.send("Success!");
    }
})



process.on('disconnect', function() {
    console.log('parent exited')
    process.exit();
});

process.stdout.on('end', function() {
    process.exit();
});