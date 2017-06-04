/**
 * Created by omar on 6/3/17.
 */

var reg = /([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+|[a-z0-9:%]+:[a-z0-9:%]+)[ 	]+([a-zA-Z0-9.\-*]+)(.+)?/;


export class HostFile {
    public lines: Array<Line> = [];
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
            } else {
                let l = new CommentLine(this);
                l.data = line;
                this.lines.push(l);
                l.clean();
            }
        }
    }
    public toString(): string {
        var o = "";
        for(var l of this.lines) {
            o+=l.toString()+"\n";
        }
        return o;
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
    protected parentFile: HostFile;
    constructor(pf: HostFile) {
        this.parentFile = pf;
    }
    public abstract toString(): string;
    public abstract toJSON(): object;
    public abstract modify(key: string, value: any) : boolean;
}


export class AddressLine extends Line {
    public active: boolean = false;
    public ipaddr: string = "127.0.0.1";
    public addr: string = "";
    public comment: string = "";

    toString() {
        return (
            (this.active ? "" : "#") + this.ipaddr + " " + this.addr +" #" + this.comment
        );
    }
    toJSON() {
        return {
            type: "address",
            ipaddr: this.ipaddr,
            addr: this.addr,
            comment: this.comment,
            compiled: this.toString()
        }
    }
    modify(key, value) {
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
            // TODO add regex for this
            this.addr = value;
            return true;
        }
        if(key == "comment") {
            this.comment = value;
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