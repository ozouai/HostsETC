var App;
(function (App) {
    var Page = (function () {
        function Page(server) {
            var _this = this;
            this.tagManager = new GlobalTagManager();
            this.lines = [];
            this._inverseLine = false;
            var div = document.createElement("div");
            div.className = "lineContainer";
            $("#lineContainer").append(div);
            this.container = div;
            this.server = server;
            server.get("hostsJSON", function (data) {
                for (var i = 0; i < data.length; i++) {
                    var line = data[i];
                    if (line.type != "address")
                        continue;
                    if (line.locked)
                        continue;
                    var l = new Line(_this, i, line.addr, line.ipaddr, line.comment, line.active, line.tags);
                    _this.lines.push(l);
                    $(_this.container).prepend(l.render());
                }
            }, true);
        }
        Page.prototype.registerLine = function (line) {
            this.lines.push(line);
            $(this.container).prepend(line.render());
        };
        Page.prototype.createLine = function (addr, ipaddr, comment) {
            var _this = this;
            this.server.post("createEntry", {
                addr: addr,
                ipaddr: ipaddr,
                comment: comment
            }, function (data) {
                var l = new Line(_this, data.line, addr, ipaddr, comment, true, []);
                _this.lines.push(l);
                $(_this.container).prepend(l.render());
            });
        };
        return Page;
    }());
    App.Page = Page;
    var GlobalTagManager = (function () {
        function GlobalTagManager() {
            this._tagList = [];
            this._tags = {};
        }
        GlobalTagManager.prototype.getTag = function (name) {
            if (!this._tags[name]) {
                var tag = new Tag(name);
                this._tags[name] = tag;
                this._tagList.push(tag);
            }
            return this._tags[name];
        };
        return GlobalTagManager;
    }());
    App.GlobalTagManager = GlobalTagManager;
    var TagManager = (function () {
        function TagManager(line) {
            this._tags = [];
            this._tagMap = {};
            this._line = line;
        }
        TagManager.prototype.hasTag = function (tag) {
            if (typeof tag == "string") {
                return !(!this._tagMap[tag]);
            }
            else {
                return this._tags.indexOf(tag) !== -1;
            }
        };
        TagManager.prototype.getTags = function () {
            return this._tags;
        };
        TagManager.prototype.addTag = function (tag) {
            if (typeof tag == "string") {
                var t = this._line.page.tagManager.getTag(tag);
                this._tags.push(t);
                this._tagMap[tag] = t;
                t.linkLine(this._line);
            }
            else {
                this._tags.push(tag);
                this._tagMap[tag.name] = tag;
                tag.linkLine(this._line);
            }
        };
        TagManager.prototype.map = function (d) {
            return this._tags.map(d);
        };
        return TagManager;
    }());
    var Server = (function () {
        function Server(host, port) {
            this.autoCommit = true;
            this._host = host;
            this._port = port;
        }
        Server.prototype.get = function (action, onComplete, noCommit) {
            var _this = this;
            $.get("http://" + this._host + ":" + this._port + "/" + action, function (data) {
                if (_this.autoCommit && !noCommit) {
                    $.get("http://" + _this._host + ":" + _this._port + "/commit", function (commitData) {
                        if (onComplete)
                            onComplete(data);
                    });
                }
                else {
                    if (onComplete)
                        onComplete(data);
                }
            });
        };
        Server.prototype.post = function (action, data, onComplete) {
            var _this = this;
            $.post("http://" + this._host + ":" + this._port + "/" + action, data, function (data) {
                if (_this.autoCommit) {
                    $.get("http://" + _this._host + ":" + _this._port + "/commit", function (commitData) {
                        if (onComplete)
                            onComplete(data);
                    });
                }
                else {
                    if (onComplete)
                        onComplete(data);
                }
            });
        };
        return Server;
    }());
    App.Server = Server;
    var Tag = (function () {
        function Tag(name) {
            this._links = [];
            this.name = name;
        }
        Tag.prototype.linkLine = function (target) {
            if (this._links.indexOf(target) === -1)
                this._links.push(target);
        };
        Tag.prototype.toString = function () {
            return this.name;
        };
        return Tag;
    }());
    var Line = (function () {
        function Line(page, line, addr, ipaddr, comment, active, tags) {
            if (tags === void 0) { tags = []; }
            this.page = page;
            this.line = line;
            this.addr = addr;
            this.ipaddr = ipaddr;
            this.comment = comment;
            this.active = active;
            this.tags = new TagManager(this);
            if (tags.length > 0) {
                for (var _i = 0, tags_1 = tags; _i < tags_1.length; _i++) {
                    var tag = tags_1[_i];
                    this.tags.addTag(tag);
                }
            }
        }
        Line.prototype.render = function () {
            var _this = this;
            if (!this._div) {
                var div = document.createElement("div");
                div.className = "row entryRow";
                div.innerHTML = "\n           \n                <div class=\"col-sm-2 entryActive \">\n                    <div class=\"bootstrap-switch-square\">\n                        <input type=\"checkbox\" " + (this.active ? "checked" : "") + " data-toggle=\"switch\" class=\"entryActiveSwitch\" data-on-text=\"<span class='fui-check'></span>\" data-off-text=\"<span class='fui-cross'></span>\" />\n                    </div>\n                </div>\n                <div class=\"col-sm-3 entryAddr\">" + this.addr + "</div>\n                <div class=\"col-sm-3 entryIpaddr\">" + this.ipaddr + "</div>\n                <div class=\"col-sm-3 entryComment\"># " + this.comment + "</div>\n                <div class=\"col-sm-1\"><span class=\"fui-tag entryTags\"></span></div>\n            </div>\n        \n            ";
                this._div = div;
                if (this.page._inverseLine) {
                    $(div).addClass("inverse");
                }
                this.page._inverseLine = !this.page._inverseLine;
                $(div).find(".entryActiveSwitch").bootstrapSwitch();
                $(div).find(".entryActiveSwitch").on("switchChange.bootstrapSwitch", this._toggleActive.bind(this));
                this._makeEditable("entryAddr", {
                    onData: function (data) {
                        _this.addr = data;
                        _this.page.server.get("editLine/" + _this.line + "/addr/" + _this.addr);
                    }
                });
                this._makeEditable("entryIpaddr", {
                    onData: function (data) {
                        _this.ipaddr = data;
                        _this.page.server.get("editLine/" + _this.line + "/ipaddr/" + _this.ipaddr);
                    }
                });
                this._makeEditable("entryComment", {
                    onEditStart: function () {
                        while ($(this).html().charAt(0) == "#" || $(this).html().charAt(0) == " ") {
                            $(this).html($(this).html().substr(1));
                        }
                    },
                    onData: function (data) {
                        _this.addr = data;
                        _this.page.server.get("editLine/" + _this.line + "/comment/" + _this.addr);
                    },
                    onEditFinish: function () {
                        $(this).html("# " + $(this).html());
                    }
                });
                this._tagEditor = new TagEditor(this, $(div).find(".entryTags").first().get()[0]);
            }
            else {
                $(this._div).find(".entryAddr").html(this.addr);
                $(this._div).find(".entryIpaddr").html(this.ipaddr);
                $(this._div).find(".entryComment").html("#" + this.comment);
            }
            return this._div;
        };
        Line.prototype._toggleActive = function (ev, status) {
            this.page.server.get("editLine/" + this.line + "/active/" + status);
        };
        Line.prototype._makeEditable = function (field, mutators) {
            var editing = false;
            $(this._div).find("." + field).on("dblclick", function () {
                if (editing)
                    return;
                editing = true;
                if (mutators.onEditStart)
                    mutators.onEditStart.bind(this)();
                $(this).attr("contenteditable", true);
                $(this).focus();
                $(this).one("blur", function () {
                    $(this).removeAttr("contentEditable");
                    var result = $(this).html();
                    if (mutators.onData)
                        mutators.onData.bind(this)(result);
                    if (mutators.onEditFinish)
                        mutators.onEditFinish.bind(this)();
                });
            });
            $(this._div).find("." + field).on("keydown", function (e) {
                if (!editing)
                    return;
                if (e.keyCode == 13) {
                    e.preventDefault();
                    $(this).blur();
                }
            });
        };
        return Line;
    }());
    App.Line = Line;
    var TagEditor = (function () {
        function TagEditor(line, toolTipHolder) {
            this._editing = false;
            this._line = line;
            this._toolTip = toolTipHolder;
            $(this._toolTip).tooltip({
                html: true,
                placement: "right",
                title: "<div class='tagHolder'>" + (this._line.tags.map(function (t) { return ("<div>" + t.toString() + "</div>"); }).join("")) + "</div><div class='newTag'>New Tag +</div>",
                trigger: "manual",
                container: "body"
            });
            console.log($(this._toolTip));
            var s = this;
            $(this._toolTip).on("mouseenter", function () {
                s._mouseEnter(this);
            });
            $(this._toolTip).on("mouseleave", function (e) {
                s._mouseLeave(this, e);
            });
            console.log("done");
        }
        TagEditor.prototype.updateContent = function () {
            $(this._toolTip).attr("data-original-title", "<div class='tagHolder'>" + (this._line.tags.map(function (t) { return ("<div>" + t.toString() + "</div>"); }).join("")) + "</div><div class='newTag'>New Tag +</div>");
        };
        TagEditor.prototype._mouseEnter = function (elem) {
            var s = this;
            $(elem).tooltip("show");
            var ariaElem = $("#" + $(elem).attr("aria-describedby"));
            this._temp_ariaElem = ariaElem;
            ariaElem.on("mouseleave", function () {
                $(elem).trigger("mouseleave");
            });
            ariaElem.find(".newTag").on("click", function () {
                s._newTagClick(this);
            });
        };
        TagEditor.prototype._newTagClick = function (elem) {
            var _this = this;
            var s = this;
            $(elem).attr("contenteditable", true);
            $(elem).focus();
            $(elem).html("");
            this._editing = true;
            $(elem).on("blur", function (e) {
                $(elem).attr("contenteditable", false);
                $(elem).html("New Tag +");
                _this._editing = false;
                $(_this._toolTip).trigger("mouseleave");
            });
            $(elem).on("keydown", function (e) {
                s._newTagKeyPress(this, e);
            });
        };
        TagEditor.prototype._newTagKeyPress = function (elem, e) {
            if (e.keyCode == 13) {
                e.preventDefault();
                var newTag = $(elem).html();
                $(elem).attr("contenteditable", false);
                $(elem).html("New Tag +");
                this._editing = false;
                $(this._toolTip).trigger("mouseleave");
                if (newTag != "New Tag +") {
                    if (!this._line.tags.hasTag(newTag)) {
                        this._temp_ariaElem.find(".tagHolder").append("<div>" + newTag + "</div>");
                        this._line.tags.addTag(newTag);
                        this.updateContent();
                        this._line.page.server.get("editLine/" + this._line.line + "/addTag/" + newTag);
                    }
                }
            }
        };
        TagEditor.prototype._mouseLeave = function (elem, e) {
            var _this = this;
            e.preventDefault();
            setTimeout(function () {
                if (!$(_this._temp_ariaElem).find(":hover").length && !_this._editing) {
                    $(_this._toolTip).tooltip("hide");
                }
            }, 100);
        };
        return TagEditor;
    }());
})(App || (App = {}));
