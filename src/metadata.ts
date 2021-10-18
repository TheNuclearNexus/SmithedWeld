import { Rule } from "./rules";

export class Priority {
    default: number = 0;
    after: string[] = [];
    before: string[] = [];

    constructor(data: any) {
        if(data["default"] != null)
            this.default = data["default"]
        if(data["after"] != null)
            this.after = data["after"]
        if(data["before"] != null)
            this.before = data["before"]
    }
}


export class MetaData {
    rules: Rule[]
    priority: Priority
    constructor(data: any) {
        if(data["rules"] != null) {
            this.rules = []
            for(let r of data["rules"]) {
                this.rules.push(Rule.build(r));
            }
        }
        if(data["priority"] != null) {
            this.priority = new Priority(data["priority"])
        } else {
            this.priority = new Priority({default: 0, after: [], before: []})
        }
    }

    static buildFromRawJson(data: any): MetaData {
        if(data["__smithed__"] != null) {
            return new MetaData(data["__smithed__"]);
        }
        return null;
    }
}