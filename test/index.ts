import DefaultDatapackBuilder from 'slimeball/out/datapack'
import DefaultResourcepackBuilder from 'slimeball/out/resourcepack';
import * as fs from 'fs';
import * as path from 'path';
import { BuildResult } from 'slimeball/out/util';
import download from 'download';
import JSZip from 'jszip';
import { Insert, Merge, Rule } from '../src/rules.js';
import { MetaData } from '../src/metadata.js';
import { WeldDatapackBuilder } from '../src/datapack.js';
import {Blob} from 'blob-polyfill'
import Worker from 'web-worker'

globalThis.Blob = Blob
globalThis.Worker = Worker

import("./test.js").then(test => {
    test.testDatapacks();
})