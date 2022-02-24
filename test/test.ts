import * as fs from 'fs';
import * as path from 'path';
import { BuildResult } from 'slimeball/out/util';
import { WeldDatapackBuilder } from '../src/datapack.js';


export function testDatapacks() {
    const versionUrl = 'https://launcher.mojang.com/v1/objects/8d9b65467c7913fcf6f5b2e729d44a1e00fde150/client.jar' // 1.17.1


    const ddb = new WeldDatapackBuilder();
    const folderPath = 'packs/dp'

    let buffers: [string, Buffer][] = []
    fs.readdirSync(folderPath).forEach(v => {
        if (path.extname(v) === '.zip') {
            let buffer = fs.readFileSync(path.join(folderPath, v))
            buffers.push([v, buffer]);
        }
    })

    ddb.loadBuffers(buffers).then(() => {
        ddb.build().then(async (result: BuildResult) => {
            const blob: Blob = await result.zip.close()
            fs.writeFileSync('datapack.zip', Buffer.from(await blob.arrayBuffer()));
            console.log('Datapack Conflicts: ' + result.conflicts)
        })
    })
}
