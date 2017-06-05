#!/usr/bin/env node

"use strict";

var flags = [];
var enclose = require("enclose").exec;
flags.push("./index.js", "./hostFile.js", "./restrictedDomains.txt");
enclose(flags);