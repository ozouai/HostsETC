/**
 * Created by omar on 6/3/17.
 */
import * as fs from "fs";
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

if(process.platform == "darwin") lockedRecords = [
    {
        addr:"localhost",
        ipaddr:"127.0.0.1"
    },
    {
        addr:"localhost",
        ipaddr:"::1"
    },
    {
        addr:"localhost",
        ipaddr:"fe80::1%lo0"
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
var restrictedDomains: Array<string> = null;

// Apply custom parameters
for(var arg of process.argv) {
    // Check to see if the option (-restricted) is provided. If so then load the embedded text file with restricted domains.
    if(arg == "-restricted") {
        restrictedDomains = fs.readFileSync(__dirname+"/assets/restrictedDomains.txt", "utf-8").split("\n");
        break;
    }
}
/**
 * Returns an array of restricted domains
 * @returns {string[]}
 */
export function getRestrictedDomains() : Array<string> {
    if(restrictedDomains) return [].concat(restrictedDomains.slice(0));
    else return [];
}
/**
 * The manager class for a hosts file.
 */
export class HostFile {
    /**
     * The lines in the hosts file
     * @type {Array}
     */
    public lines: Array<Line> = [];

    /**
     * Lines that have been deleted and are available for re-use
     * @type {Array}
     */
    private freedLines: Array<{type: string, index:number, line: Line}> = [];

    constructor(fileData : string) {
        var t = fileData.replace(/\n\n|\r\n/g, "\n");
        var ls = t.split("\n");
        for(var line of ls) {
            line = line+" ";
            if(reg.test(line)) { // It's a commented out address
                var res = reg.exec(line);
                let l = new AddressLine(this);
                l.active = line.charAt(0) != "#";
                l.ipaddr = res[1];
                l.addr = res[2];
                l.comment = res[3];
                this.lines.push(l);
                l.clean();
            } else {
                let l = new CommentLine(this);
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
    public addLine(line: Line): number {
        var i =this.lines.push(line);
        line.parentFile = this;
        return i-1;
    }
    public toString(): string {
        var o = [];
        for(var l of this.lines) {
            o.push(l.toString());
        }
        return o.join("\n");
    }
    public toJSON() {
        var o = [];
        for(var l of this.lines) {
            o.push(l.toJSON());
        }
        return o;
    }
}

class UndoManager {
    private steps: Array<IUndoStep> = [];
    private step = 0;
    public addStep(newStep: IUndoStep) {
        if(this.steps.length > this.step) {
            this.steps = this.steps.slice(0, this.step)
        }
        this.steps.push(newStep);
        this.step++;
    }
    public undo() {
        if(this.step > 0) {
            this.step--;
            this.steps[this.step].Undo();
        }
    }
    public redo() {
        if(this.step < this.steps.length) {
            this.steps[this.step].Redo();
            this.step++;
        }
    }

}
interface IUndoStep {
    Undo: ()=>void;
    Redo: ()=>void;
    Timestamp?: Date;
}

abstract class Line {
    public parentFile: HostFile;
    constructor(pf?: HostFile) {
        if(pf) this.parentFile = pf;
    }
    public abstract toString(): string;
    public abstract toJSON(): object;
    public abstract modify(key: string, value: any) : boolean;
}

/**
 * The main class for an entry in the host file
 */
export class AddressLine extends Line {
    /**
     * Is the record active in the hostsfile
     * @type {boolean}
     */
    public active: boolean = false;
    /**
     * The IP Address the record points to
     * @type {string}
     */
    public ipaddr: string = "127.0.0.1";
    /**
     * The hostname of the record
     * @type {string}
     */
    public addr: string = "";
    /**
     * A description of the record
     * @type {string}
     */
    public comment: string = "";
    /**
     * If the record should be deleted on exit
     * @type {boolean}
     */
    public ephemeral: boolean = false;
    /**
     * Is the record un-editable
     * @type {boolean}
     */
    private locked: boolean = false;
    /**
     * Is the record deleted
     * @type {boolean}
     */
    public deleted: boolean = false;

    /**
     * An array of tags
     * @type {Array}
     */
    public tags: Array<string> = [];
    toString() {

        var hash = JSON.stringify({
            tags: this.tags,
            comment: this.comment
        });
        hash = (new Buffer(hash)).toString("base64");
        return (
            (this.active ? "" : "#") + this.ipaddr + " " + this.addr +" #__hashed:" + hash
        );
    }
    toJSON() {
        return {
            type: "address",
            active: this.active,
            ipaddr: this.ipaddr,
            addr: this.addr,
            comment: this.comment,
            compiled: this.toString(),
            locked: this.locked,
            tags: this.tags
        }
    }

    /**
     * Performs sanity checks on the data, such as filtering out unnecessary '#'s from the comment and checks to see if the record should be locked
     */
    public clean() {
        // Clean extraneous characters
        while(this.comment.charAt(0) == "#" || this.comment.charAt(0) == " ") {
            this.comment = this.comment.substr(1);
        }

        // Check to see if the record is protected
        var foundLock = false;
        for(var check of lockedRecords) {
            if(this.ipaddr == check.ipaddr && this.addr == check.addr) {
                foundLock = true;
                break;
            }
        }
        if(foundLock) {
            this.locked = true;
        }

        // Since this app stores extra data hashed, we check to see if we stored hashed data in the comment and attempts to open it
        if(this.comment.indexOf("__hashed") != -1) {
            var hash = this.comment.substr("__hashed:".length);
            hash = JSON.parse((new Buffer(hash, "base64")).toString());
            if(hash.comment) {
                this.comment = hash.comment
            } else {
                this.comment = "";
            }
            if(hash.tags) {
                this.tags = hash.tags;
            } else {
                this.tags = [];
            }
        }
    }

    /**
     * Makes changes to a paramter of the entry. Provides validation to ensure only valid data is saved.
     * @param key The parameter to change
     * @param value The new value of the parameter
     * @returns {boolean} Whether the change was successful or not
     */
    modify(key, value) {
        if(this.locked) return false;
        if(typeof value == "string") {
            value = value.trim();
        }
        if(key == "active") {
            if(typeof value == "string") {
                if(value != "true" && value != "false") return false;
                value = value == "true";
            }
            if(typeof value != "boolean") return false;
            this.active = value;
            return true;
        }
        if(key == "ipaddr") {
            if(typeof value != "string") return false;
            // TODO add regex for valid ip string
            this.ipaddr = value;
            return true;
        }
        if(key == "addr") {
            if(typeof value != "string") return false;

            if(restrictedDomains) {
                if(restrictedDomains.indexOf(value) != -1) {
                    return false; // Check to see if the change is restricted
                }
            }

            // TODO add regex for this

            this.addr = value;
            return true;
        }
        if(key == "comment") {
            this.comment = value;
            return true;
        }
        if(key == "deleted") {
            if(typeof value != "boolean") return false;
            this.deleted = value;
            return true;
        }
        if(key == "addTag") {
            if(typeof value != "string") return false;
            if(this.tags.indexOf(value) == -1) this.tags.push(value);
            return true;
        }
        if(key == "removeTag") {
            if(typeof value != "string") return false;
            if(this.tags.indexOf(value) != -1) this.tags.splice(this.tags.indexOf(value));
            return true;
        }
        return false;
    }
}

export class CommentLine extends Line {
    public data: string = "";
    toString() {
        return "#"+this.data;
    }
    public clean() {
        while(this.data.charAt(0) == "#") {
            this.data = this.data.substr(1);
        }
    }
    toJSON() {
        return {
            type: "comment",
            data: this.data,
            compiled: this.toString()
        }
    }
    modify(key, value) {
        if(key == "data") {
            this.data = value;
            return true;
        }
        return false;
    }
}