import { getDefaultPathToModules, getDefaultPathToScripts, getPathToScripts } from "../settings";
import { readScriptDir, scriptFiles } from "./luaParser";
import * as path from 'path';
import { analyzeFile, findElements} from "./fileReader";

var modulesData : string[];
var sectionsData : Map<string, string[]> = new Map<string, string[]>();
var notExistedFiles : string [] = [];
var basedConditions = [];

export function getParams(sectionName : string) {
    if (sectionsData.size === 0) {
        getSectionsData()
    }
    
    if (notExistedFiles.length === 0) {
        console.log(notExistedFiles);
    }
    return sectionsData.get(sectionName).concat(basedConditions);
}

function getModules() {
    if (!scriptFiles) {
        readScriptDir();
    }
    modulesData = Array.from(new Set(analyzeFile(scriptFiles, "modules.script", getPathToScripts(), getDefaultPathToScripts(), findModulesFileNames)));
}

function getSectionsData() {
    if (!modulesData) {
        getModules();
    }
    
    // Получаем список параметров для каждого типа секций логики
    for (let index = 0; index < modulesData.length; index++) {
        const data = modulesData[index].split(':');
        var fileData = analyzeFile(scriptFiles, data[1], getPathToScripts(), getDefaultPathToScripts(), findSectionParamsInFile);
        if (!fileData) {
            continue;
        }
        sectionsData.set(data[0], fileData);        
    }

    // Получаем базовые параметры секций, которые если у любого типа (например on_info)
    basedConditions = analyzeFile(scriptFiles, "xr_logic.script", getPathToScripts(), getDefaultPathToScripts(), findBasedConditions)
}

function findModulesFileNames(filePath : string) {
    return findElements(filePath, /(?<=load_scheme\().+(?=\))/g, (match) => {
        let data = match[0].split(",");
        let fileNameItem = data[0].trim();
        let sectionNameItem = data[1].trim();
        return sectionNameItem.slice(1, sectionNameItem.length - 1) + ":" + fileNameItem.slice(1, fileNameItem.length - 1) + ".script";
    })
}

function findSectionParamsInFile(filePath : string) : string[] | null {
    return findElements(filePath, /(utils\.(cfg_get_.+))(\(.+?((?<=\")\w+(?=\")).+?\))/g, (match) => {
        return match[4];
    })
}

function findBasedConditions(filePath : string) {
    return findElements(filePath, /(?<!function\sadd_conditions\()(?<=(add_conditions\()).+?(?=\))/g, (match) => {
        var item = match[0].split(",")[1].trim();
        return item.slice(1, item.length - 1);
    })
}
