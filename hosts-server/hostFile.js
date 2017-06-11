"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Created by omar on 6/3/17.
 */
var fs = require("fs");
/**
 * Regular expression to determine if a line is an address entry
 * @type {RegExp}
 */
var reg = /([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+|[a-z0-9:%]+:[a-z0-9:%]+)[ 	]+([a-zA-Z0-9.\-*]+)(.+)?/;
/**
 * Platform specific locked records entry
 * @type {[{addr: string; ipaddr: string},{addr: string; ipaddr: string},{addr: string; ipaddr: string},{addr: string; ipaddr: string}]}
 */
var lockedRecords = [];
if (process.platform == "darwin")
    lockedRecords = [
        {
            addr: "localhost",
            ipaddr: "127.0.0.1"
        },
        {
            addr: "localhost",
            ipaddr: "::1"
        },
        {
            addr: "localhost",
            ipaddr: "fe80::1%lo0"
        },
        {
            addr: "broadcasthost",
            ipaddr: "255.255.255.255"
        }
    ];
/**
 * An array of hostsnames that records cannot point to. If null then lookup is disabled.
 * @type {string[]}
 */
var restrictedDomains = null;
// Apply custom parameters
for (var _i = 0, _a = process.argv; _i < _a.length; _i++) {
    var arg = _a[_i];
    // Check to see if the option (-restricted) is provided. If so then load the embedded text file with restricted domains.
    if (arg == "-restricted") {
        restrictedDomains = fs.readFileSync(__dirname + "/assets/restrictedDomains.txt", "utf-8").split("\n");
        break;
    }
}
/**
 * Returns an array of restricted domains
 * @returns {string[]}
 */
function getRestrictedDomains() {
    if (restrictedDomains)
        return [].concat(restrictedDomains.slice(0));
    else
        return [];
}
exports.getRestrictedDomains = getRestrictedDomains;
/**
 * The manager class for a hosts file.
 */
var HostFile = (function () {
    function HostFile(fileData) {
        /**
         * The lines in the hosts file
         * @type {Array}
         */
        this.lines = [];
        /**
         * Lines that have been deleted and are available for re-use
         * @type {Array}
         */
        this.freedLines = [];
        var t = fileData.replace(/\n\n|\r\n/g, "\n");
        var ls = t.split("\n");
        for (var _i = 0, ls_1 = ls; _i < ls_1.length; _i++) {
            var line = ls_1[_i];
            line = line + " ";
            if (reg.test(line)) {
                var res = reg.exec(line);
                var l = new AddressLine(this);
                l.active = line.charAt(0) != "#";
                l.ipaddr = res[1];
                l.addr = res[2];
                l.comment = res[3];
                this.lines.push(l);
                l.clean();
            }
            else {
                var l = new CommentLine(this);
                l.data = line;
                this.lines.push(l);
                l.clean();
            }
        }
    }
    /**
     * Adds a new line to the host files
     * @param line
     * @returns {number} The new line index number
     */
    HostFile.prototype.addLine = function (line) {
        var i = this.lines.push(line);
        line.parentFile = this;
        return i - 1;
    };
    HostFile.prototype.toString = function () {
        var o = [];
        for (var _i = 0, _a = this.lines; _i < _a.length; _i++) {
            var l = _a[_i];
            o.push(l.toString());
        }
        return o.join("\n");
    };
    HostFile.prototype.toJSON = function () {
        var o = [];
        for (var _i = 0, _a = this.lines; _i < _a.length; _i++) {
            var l = _a[_i];
            o.push(l.toJSON());
        }
        return o;
    };
    return HostFile;
}());
exports.HostFile = HostFile;
var UndoManager = (function () {
    function UndoManager() {
        this.steps = [];
        this.step = 0;
    }
    UndoManager.prototype.addStep = function (newStep) {
        if (this.steps.length > this.step) {
            this.steps = this.steps.slice(0, this.step);
        }
        this.steps.push(newStep);
        this.step++;
    };
    UndoManager.prototype.undo = function () {
        if (this.step > 0) {
            this.step--;
            this.steps[this.step].Undo();
        }
    };
    UndoManager.prototype.redo = function () {
        if (this.step < this.steps.length) {
            this.steps[this.step].Redo();
            this.step++;
        }
    };
    return UndoManager;
}());
var Line = (function () {
    function Line(pf) {
        if (pf)
            this.parentFile = pf;
    }
    return Line;
}());
/**
 * The main class for an entry in the host file
 */
var AddressLine = (function (_super) {
    __extends(AddressLine, _super);
    function AddressLine() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        /**
         * Is the record active in the hostsfile
         * @type {boolean}
         */
        _this.active = false;
        /**
         * The IP Address the record points to
         * @type {string}
         */
        _this.ipaddr = "127.0.0.1";
        /**
         * The hostname of the record
         * @type {string}
         */
        _this.addr = "";
        /**
         * A description of the record
         * @type {string}
         */
        _this.comment = "";
        /**
         * If the record should be deleted on exit
         * @type {boolean}
         */
        _this.ephemeral = false;
        /**
         * Is the record un-editable
         * @type {boolean}
         */
        _this.locked = false;
        /**
         * Is the record deleted
         * @type {boolean}
         */
        _this.deleted = false;
        /**
         * An array of tags
         * @type {Array}
         */
        _this.tags = [];
        return _this;
    }
    AddressLine.prototype.toString = function () {
        var hash = JSON.stringify({
            tags: this.tags,
            comment: this.comment
        });
        hash = (new Buffer(hash)).toString("base64");
        return ((this.active ? "" : "#") + this.ipaddr + " " + this.addr + " #__hashed:" + hash);
    };
    AddressLine.prototype.toJSON = function () {
        return {
            type: "address",
            active: this.active,
            ipaddr: this.ipaddr,
            addr: this.addr,
            comment: this.comment,
            compiled: this.toString(),
            locked: this.locked,
            tags: this.tags
        };
    };
    /**
     * Performs sanity checks on the data, such as filtering out unnecessary '#'s from the comment and checks to see if the record should be locked
     */
    AddressLine.prototype.clean = function () {
        // Clean extraneous characters
        while (this.comment.charAt(0) == "#" || this.comment.charAt(0) == " ") {
            this.comment = this.comment.substr(1);
        }
        // Check to see if the record is protected
        var foundLock = false;
        for (var _i = 0, lockedRecords_1 = lockedRecords; _i < lockedRecords_1.length; _i++) {
            var check = lockedRecords_1[_i];
            if (this.ipaddr == check.ipaddr && this.addr == check.addr) {
                foundLock = true;
                break;
            }
        }
        if (foundLock) {
            this.locked = true;
        }
        // Since this app stores extra data hashed, we check to see if we stored hashed data in the comment and attempts to open it
        if (this.comment.indexOf("__hashed") != -1) {
            var hash = this.comment.substr("__hashed:".length);
            hash = JSON.parse((new Buffer(hash, "base64")).toString());
            if (hash.comment) {
                this.comment = hash.comment;
            }
            else {
                this.comment = "";
            }
            if (hash.tags) {
                this.tags = hash.tags;
            }
            else {
                this.tags = [];
            }
        }
    };
    /**
     * Makes changes to a paramter of the entry. Provides validation to ensure only valid data is saved.
     * @param key The parameter to change
     * @param value The new value of the parameter
     * @returns {boolean} Whether the change was successful or not
     */
    AddressLine.prototype.modify = function (key, value) {
        if (this.locked)
            return false;
        if (typeof value == "string") {
            value = value.trim();
        }
        if (key == "active") {
            if (typeof value == "string") {
                if (value != "true" && value != "false")
                    return false;
                value = value == "true";
            }
            if (typeof value != "boolean")
                return false;
            this.active = value;
            return true;
        }
        if (key == "ipaddr") {
            if (typeof value != "string")
                return false;
            // TODO add regex for valid ip string
            this.ipaddr = value;
            return true;
        }
        if (key == "addr") {
            if (typeof value != "string")
                return false;
            if (restrictedDomains) {
                if (restrictedDomains.indexOf(value) != -1) {
                    return false; // Check to see if the change is restricted
                }
            }
            // TODO add regex for this
            this.addr = value;
            return true;
        }
        if (key == "comment") {
            this.comment = value;
            return true;
        }
        if (key == "deleted") {
            if (typeof value != "boolean")
                return false;
            this.deleted = value;
            return true;
        }
        if (key == "addTag") {
            if (typeof value != "string")
                return false;
            if (this.tags.indexOf(value) == -1)
                this.tags.push(value);
            return true;
        }
        if (key == "removeTag") {
            if (typeof value != "string")
                return false;
            if (this.tags.indexOf(value) != -1)
                this.tags.splice(this.tags.indexOf(value));
            return true;
        }
        return false;
    };
    return AddressLine;
}(Line));
exports.AddressLine = AddressLine;
var CommentLine = (function (_super) {
    __extends(CommentLine, _super);
    function CommentLine() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.data = "";
        return _this;
    }
    CommentLine.prototype.toString = function () {
        return "#" + this.data;
    };
    CommentLine.prototype.clean = function () {
        while (this.data.charAt(0) == "#") {
            this.data = this.data.substr(1);
        }
    };
    CommentLine.prototype.toJSON = function () {
        return {
            type: "comment",
            data: this.data,
            compiled: this.toString()
        };
    };
    CommentLine.prototype.modify = function (key, value) {
        if (key == "data") {
            this.data = value;
            return true;
        }
        return false;
    };
    return CommentLine;
}(Line));
exports.CommentLine = CommentLine;
