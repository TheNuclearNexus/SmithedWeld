import DefaultDatapackBuilder from "slimeball/out/datapack.js";
import { FileData, FileOccurence, parseData,  } from "slimeball/out/util.js";
import JSZip from 'jszip'
import { MetaData } from "./metadata.js";
import { asEnumerable } from "linq-es5";
import { Rule, TargetSourceRule } from "./rules.js";
import fetch from 'node-fetch'

const weldCategories = ['loot_tables','predicates','item_modifiers','dimension','dimension_type','worldgen','recipes']
let cachedData: {[key: string]: {
    [key: string]: any
}} = {}
export class WeldDatapackBuilder extends DefaultDatapackBuilder {
    version: string = '1.18.1'
    constructor(version?: string) {
        super();
        if(version !== undefined)
            this.version = version

        if(cachedData[this.version] === undefined) cachedData[this.version] = {}
    }

    async mergeViaWeld(fileData: FileData, resolvedData: string[]) {
        let baseTable = null
        if(fileData.namespace === 'minecraft') {
            this.onUpdate('Fetch vanilla loot table')
            if(cachedData[this.version] !== undefined && cachedData[this.version][fileData.path] !== undefined) {
                baseTable = cachedData[this.version][fileData.path]
            }
            const rawTable = (await fetch(`https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/${this.version}/${fileData.path}`))
            if(rawTable != null) {
                const jsonString = await rawTable.text()
                baseTable = parseData(jsonString)
                cachedData[this.version][fileData.path] = baseTable
            }
        }

        this.onUpdate('Load loot tables')
        let data: {}[] = [];
        for(let d of resolvedData) {
            const parsedData = parseData(d);
            const meta = MetaData.buildFromRawJson(parsedData)
            if(meta != null) {
                data.push(parsedData)
            }
        }
        if (data.length === 0) {
            await this.finalZip.addFile(fileData.path, Buffer.from(resolvedData[0]));
            return;
        }

        data = asEnumerable(data).OrderBy(d => {
            const meta = MetaData.buildFromRawJson(d)

            return meta != null ? meta.priority.default : 0;
        }).ToArray();

        if(baseTable == null) {
            baseTable = data.shift()
        }

        this.onUpdate('Apply rules')
        let newTable = this.applyRules(baseTable, data);
        await this.finalZip.addFile(fileData.path, Buffer.from(JSON.stringify(newTable, null, 2)));
    }

    private applyRules(baseTable: any, data: {}[]) {
        let newTable = baseTable;

        let rules: [number, TargetSourceRule][] = []

        for (let i = 0; i < data.length; i++) {
            const d = data[i];
            const meta = MetaData.buildFromRawJson(d);
            if(meta == null) continue;
            
            for (let r of meta.rules) {
                if(r instanceof TargetSourceRule)
                    rules.push([i, r])
            }
        }

        rules = asEnumerable(rules).OrderByDescending(r => r[1].getTypePriorty()).ThenByDescending(r => r[1].target.length).ToArray()

        
        rules.forEach(r => {
            // console.log(`${r[1].type} -> ${r[1].target} [${r[1].target.length}]`)

            newTable = r[1].handle(newTable, data[r[0]])
        })

        return newTable;
    }

    override async handleConflict(fileData: FileData, occurences: FileOccurence[]) {
        const onSuccess = async (resolvedData: string[]) => {
            if(fileData.category === 'tags') {
                await this.mergeTags(fileData, resolvedData);
                return true;
            } 
            else if (weldCategories.includes(fileData.category)) {
                await this.mergeViaWeld(fileData, resolvedData);
                return true;
            } else {
                await this.finalZip.addFile(fileData.path, Buffer.from(resolvedData[0]));
                return false;
            }
        }

        const onFailure = (resolvedData: string[]) => {
            this.finalZip.addFile(fileData.path, Buffer.from(resolvedData[0]));
            return false;
        }
        return await this.ifAnyDifferent(fileData, occurences, onSuccess, onFailure)
    }
}
