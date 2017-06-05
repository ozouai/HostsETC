"use strict";
/**
 * Created by omar on 6/3/17.
 */
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
var reg = /([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+|[a-z0-9:%]+:[a-z0-9:%]+)[ 	]+([a-zA-Z0-9.\-*]+)(.+)?/;
var lockedRecords = [
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
var HostFile = (function () {
    function HostFile(fileData) {
        this.lines = [];
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
var AddressLine = (function (_super) {
    __extends(AddressLine, _super);
    function AddressLine() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.active = false;
        _this.ipaddr = "127.0.0.1";
        _this.addr = "";
        _this.comment = "";
        _this.locked = false;
        return _this;
    }
    AddressLine.prototype.toString = function () {
        return ((this.active ? "" : "#") + this.ipaddr + " " + this.addr + " #" + this.comment);
    };
    AddressLine.prototype.toJSON = function () {
        return {
            type: "address",
            active: this.active,
            ipaddr: this.ipaddr,
            addr: this.addr,
            comment: this.comment,
            compiled: this.toString(),
            locked: this.locked
        };
    };
    AddressLine.prototype.clean = function () {
        while (this.comment.charAt(0) == "#" || this.comment.charAt(0) == " ") {
            this.comment = this.comment.substr(1);
        }
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
    };
    AddressLine.prototype.modify = function (key, value) {
        if (this.locked)
            return false;
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
            // TODO add regex for this
            this.addr = value;
            return true;
        }
        if (key == "comment") {
            this.comment = value;
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
