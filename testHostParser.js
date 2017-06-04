"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Created by omar on 6/3/17.
 */
var hosts = require("./hosts-server/hostFile");
var fs = require("fs");
var test = "#127.0.0.1 test.com\n127.0.0.1 active.test.com";
var file = fs.readFileSync("/etc/hosts", "utf-8");
var h = new hosts.HostFile(file);
for (var _i = 0, _a = h.lines; _i < _a.length; _i++) {
    var l = _a[_i];
    if (l instanceof hosts.AddressLine) {
        l.active = true;
    }
}
//console.log(h.lines);
console.log(JSON.stringify(h));
