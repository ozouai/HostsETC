/**
 * Created by omar on 6/3/17.
 */
import * as hosts from "./hosts-server/hostFile";
import * as fs from "fs";
var test = "#127.0.0.1 test.com\n127.0.0.1 active.test.com";
var file = fs.readFileSync("/etc/hosts", "utf-8");
var h = new hosts.HostFile(file);


for(var l of h.lines) {
    if(l instanceof hosts.AddressLine) {
        l.active = true;
    }
}
//console.log(h.lines);



console.log(JSON.stringify(h));