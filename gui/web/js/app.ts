/**
 * Created by omar on 6/10/17.
 */
declare var $;
namespace App {

    export class Page {
        public tagManager: GlobalTagManager = new GlobalTagManager();
        public container: HTMLDivElement;
        public server: Server;
        public lines: Array<Line> = [];
        public _inverseLine: boolean = false;
        constructor(server: Server) {
            var div = document.createElement("div");
            div.className = "lineContainer";
            $("#lineContainer").append(div);
            this.container = div;
            this.server = server;
            server.get("hostsJSON", (data)=> {
                for (var i = 0; i < data.length; i++) {
                    var line = data[i];
                    if (line.type != "address") continue;
                    if (line.locked) continue;
                    var l = new Line(this, i, line.addr, line.ipaddr, line.comment, line.active, line.tags);
                    this.lines.push(l);
                    $(this.container).prepend(l.render());
                }
            }, true);
        }
        public registerLine(line: Line) {
            this.lines.push(line);
            $(this.container).prepend(line.render());
        }
        public createLine(addr: string, ipaddr: string, comment: string) {
            this.server.post("createEntry", {
                addr: addr,
                ipaddr:ipaddr,
                comment:comment
            }, (data) => {
                var l = new Line(this, data.line, addr, ipaddr, comment, true, []);
                this.lines.push(l);
                $(this.container).prepend(l.render());
            })
        }
    }


    export class GlobalTagManager {
        private _tagList: Array<Tag> = [];
        private _tags: {[key:string]:Tag} = {};
        constructor() {

        }

        public getTag(name: string) {
            if(!this._tags[name]) {
                var tag = new Tag(name);
                this._tags[name] = tag;
                this._tagList.push(tag);
            }
            return this._tags[name];
        }

    }

    class TagManager {
        private _tags : Array<Tag> = [];
        private _tagMap: {[key: string]: Tag} = {};
        private _line: Line;
        constructor(line: Line) {
            this._line = line;
        }
        public hasTag(tag: string | Tag) : boolean {
            if(typeof tag == "string") {
                return !(!this._tagMap[tag]);
            } else {
                return this._tags.indexOf(tag) !== -1;
            }
        }
        public getTags() {
            return this._tags;
        }
        public addTag(tag: string | Tag) {
            if(typeof tag == "string") {
                var t = this._line.page.tagManager.getTag(tag);
                this._tags.push(t);
                this._tagMap[tag] = t;
                t.linkLine(this._line);
            } else {
                this._tags.push(tag);
                this._tagMap[tag.name] = tag;
                tag.linkLine(this._line);
            }
        }
        public map(d) {
            return this._tags.map(d);
        }
    }

    export class Server {
        private _host: string;
        private _port: string;
        public autoCommit: boolean = true;
        constructor(host: string, port: string) {
            this._host = host;
            this._port = port;
        }
        public get(action: string, onComplete?: (data)=>void, noCommit?: boolean) {
            $.get(`http://${this._host}:${this._port}/${action}`, (data) => {
                if(this.autoCommit && !noCommit) {
                    $.get(`http://${this._host}:${this._port}/commit`, (commitData)=> {
                        if(onComplete) onComplete(data);
                    });
                } else {
                    if(onComplete)onComplete(data);
                }
            })
        }
        public post(action: string, data: any, onComplete?: (data)=>void) {
            $.post(`http://${this._host}:${this._port}/${action}`, data, (data) => {
                if(this.autoCommit) {
                    $.get(`http://${this._host}:${this._port}/commit`, (commitData)=> {
                        if(onComplete) onComplete(data);
                    });
                } else {
                    if(onComplete) onComplete(data);
                }
            })
        }
    }

    class Tag {
        public name: string;
        private _links: Array<Line> = [];
        constructor(name: string) {
            this.name = name;
        }
        public linkLine(target: Line) {
            if(this._links.indexOf(target) === -1) this._links.push(target);
        }

        public toString() {
            return this.name;
        }
    }

interface IEditorMutators {
        onEditStart?: ()=>void;
        onEditFinish?: ()=>void;
        onData?: (data)=>void;
}

    export class Line {
        public page: Page;
        public line: number;
        public addr: string;
        public ipaddr: string;
        public comment: string;
        public active:boolean;
        public tags:TagManager;
        private _tagEditor: TagEditor;
        constructor(page: Page, line: number, addr: string, ipaddr: string, comment: string, active: boolean, tags:Array<string> = []) {
            this.page = page;
            this.line = line;
            this.addr = addr;
            this.ipaddr = ipaddr;
            this.comment = comment;
            this.active = active;
            this.tags = new TagManager(this);
            if(tags.length > 0) {
                for(var tag of tags) {
                    this.tags.addTag(tag);
                }
            }
        }


        private _div: HTMLDivElement;
        public render(): HTMLDivElement {
            if(!this._div) {
                var div = document.createElement("div");
                div.className = "row entryRow";
                div.innerHTML = `
           
                <div class="col-sm-2 entryActive ">
                    <div class="bootstrap-switch-square">
                        <input type="checkbox" ${this.active ? "checked" : ""} data-toggle="switch" class="entryActiveSwitch" data-on-text="<span class='fui-check'></span>" data-off-text="<span class='fui-cross'></span>" />
                    </div>
                </div>
                <div class="col-sm-3 entryAddr">${this.addr}</div>
                <div class="col-sm-3 entryIpaddr">${this.ipaddr}</div>
                <div class="col-sm-3 entryComment"># ${this.comment}</div>
                <div class="col-sm-1"><span class="fui-tag entryTags"></span></div>
            </div>
        
            `;

                this._div = div;
                if(this.page._inverseLine) {
                    $(div).addClass("inverse");
                }
                this.page._inverseLine = !this.page._inverseLine;
                $(div).find(".entryActiveSwitch").bootstrapSwitch();
                $(div).find(".entryActiveSwitch").on("switchChange.bootstrapSwitch", this._toggleActive.bind(this));

                this._makeEditable("entryAddr", {
                    onData: (data) => {
                        this.addr = data;
                        this.page.server.get(`editLine/${this.line}/addr/${this.addr}`);
                    }
                });

                this._makeEditable("entryIpaddr", {
                    onData: (data) => {
                        this.ipaddr = data;
                        this.page.server.get(`editLine/${this.line}/ipaddr/${this.ipaddr}`);
                    }
                });

                this._makeEditable("entryComment", {
                    onEditStart: function() {
                        while($(this).html().charAt(0) == "#" || $(this).html().charAt(0) == " ") {
                            $(this).html($(this).html().substr(1));
                        }
                    },
                    onData: (data) => {
                        this.addr = data;
                        this.page.server.get(`editLine/${this.line}/comment/${this.addr}`);
                    },
                    onEditFinish: function() {
                        $(this).html("# "+ $(this).html());
                    }
                });

                this._tagEditor = new TagEditor(this, $(div).find(".entryTags").first().get()[0]);

            } else {
                $(this._div).find(".entryAddr").html(this.addr);
                $(this._div).find(".entryIpaddr").html(this.ipaddr);
                $(this._div).find(".entryComment").html("#" + this.comment)
            }

            return this._div;
        }


        private _toggleActive(ev, status) {
            this.page.server.get(`editLine/${this.line}/active/${status}`);
        }

        private _makeEditable(field: string, mutators: IEditorMutators) {
            var editing = false;
            $(this._div).find(`.${field}`).on("dblclick", function(){
                if(editing) return;
                editing = true;
                if(mutators.onEditStart) mutators.onEditStart.bind(this)();
                $(this).attr("contenteditable", true);
                $(this).focus();
                $(this).one("blur", function() {
                    $(this).removeAttr("contentEditable");
                    var result = $(this).html();
                    if(mutators.onData)mutators.onData.bind(this)(result);
                    if(mutators.onEditFinish) mutators.onEditFinish.bind(this)();
                })
            });
            $(this._div).find(`.${field}`).on("keydown", function(e) {
                if(!editing) return;
                if(e.keyCode == 13) {
                    e.preventDefault();
                    $(this).blur();
                }
            });
        }
    }

    class TagEditor {
        private _line: Line;
        private _toolTip: HTMLDivElement;
        private _temp_ariaElem: any;
        private _editing: boolean = false;
        constructor(line: Line, toolTipHolder: HTMLDivElement) {
            this._line = line;
            this._toolTip = toolTipHolder;
            $(this._toolTip).tooltip({
                html: true,
                placement: "right",
                title: "<div class='tagHolder'>"+(this._line.tags.map(function(t){return ("<div>"+t.toString()+"</div>")}).join("")) + "</div><div class='newTag'>New Tag +</div>",
                trigger: "manual",
                container: "body"
            });
            console.log($(this._toolTip));
            var s = this;
            $(this._toolTip).on("mouseenter", function() {
                s._mouseEnter(this);
            });
            $(this._toolTip).on("mouseleave", function(e) {
                s._mouseLeave(this, e);
            })
            console.log("done");
        }

        public updateContent() {
            $(this._toolTip).attr("data-original-title", "<div class='tagHolder'>"+(this._line.tags.map(function(t){return ("<div>"+t.toString()+"</div>")}).join("")) + "</div><div class='newTag'>New Tag +</div>");
        }

        private _mouseEnter(elem) {
            var s = this;
            $(elem).tooltip("show");
            var ariaElem = $(`#${$(elem).attr("aria-describedby")}`);
            this._temp_ariaElem = ariaElem;
            ariaElem.on("mouseleave", function() {
                $(elem).trigger("mouseleave");
            });
            ariaElem.find(".newTag").on("click", function() {
                s._newTagClick(this);
            });
        }

        private _newTagClick(elem) {
            var s = this;
            $(elem).attr("contenteditable", true);
            $(elem).focus();
            $(elem).html("");
            this._editing = true;
            $(elem).on("blur", (e)=> {
                $(elem).attr("contenteditable", false);
                $(elem).html("New Tag +");
                this._editing = false;
                $(this._toolTip).trigger("mouseleave");
            });
            $(elem).on("keydown", function(e) {
                s._newTagKeyPress(this, e);
            })
        }

        private _newTagKeyPress(elem, e) {
            if(e.keyCode == 13) {
                e.preventDefault();
                var newTag = $(elem).html();
                $(elem).attr("contenteditable", false);
                $(elem).html("New Tag +");
                this._editing = false;
                $(this._toolTip).trigger("mouseleave");
                if(newTag != "New Tag +") {
                    if(!this._line.tags.hasTag(newTag)) {
                        this._temp_ariaElem.find(".tagHolder").append(`<div>${newTag}</div>`);
                        this._line.tags.addTag(newTag);
                        this.updateContent();
                        this._line.page.server.get(`editLine/${this._line.line}/addTag/${newTag}`);
                    }

                }

            }
        }

        private _mouseLeave(elem, e) {
            e.preventDefault();
            setTimeout(() => {
                if(!$(this._temp_ariaElem).find(":hover").length && !this._editing) {
                    $(this._toolTip).tooltip("hide");
                }
            }, 100);
        }


    }

}