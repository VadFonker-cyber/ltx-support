import { getDefaultPathToScripts, getPathToScripts } from "../settings";
import { analyzeFile, findLuaElements } from "./fileReader";

// `Cекции`:`Cкрипт`
var modulesData: string[];
// `Тип`:`параметр`
var basedConditions: string[] = [];
// `Секция` => `Тип`:`параметр`
var sectionsData: Map<string, string[]> = new Map<string, string[]>();
const ignoredParams = ["cfg_get_string:active"]

export function getParamsData(): string[][] {
    if (sectionsData.size === 0) {
        updateSectionsData();
    }
    return Array.from(sectionsData.values());
}

export function getSectionData(): Map<string, string[]> {
    if (sectionsData.size === 0) {
        updateSectionsData();
    }
    return sectionsData;
}

export function getBasedConditions() {
    if (!basedConditions) {
        updateSectionsData();
    }
    return basedConditions;
}

/**
 * Получить список модулей в форме `Cекции`:`Cкрипт`. Необходимо скорее для парсинга файлов, чем для обычного использования.
 */
export function getModules(): string[] {
    if (!modulesData) {
        updateModules();
    }
    return modulesData.concat(["logic:xr_logic.script", "smart_terrain:smart_terrain.script", "smart_control:smart_terrain_control.script", "anomal_zone:bind_anomaly_zone.script"]);
}

export function getAllParams() {
    var arr: string[] = [];

    if (sectionsData.size === 0) {
        updateSectionsData()
    }

    for (var section of sectionsData.values()) {
        arr = arr.concat(section.map((value) => { return value.split(":")[1] }))
    }
    return Array.from(new Set(arr.concat(basedConditions.map((value) => { return value.split(":")[1] })))).sort()
}

/**
 * Получить список параметров, на основе названия файла. Нужно для файлов конфигурации.
 * @param filename Название файла
 */
export function getParamsByFile(filename: string) {
    return analyzeFile(filename, getPathToScripts(), getDefaultPathToScripts(), findSectionParamsInFile)
}

function updateModules() {
    modulesData = Array.from(new Set(analyzeFile("modules.script", getPathToScripts(), getDefaultPathToScripts(), findModulesFileNames)));
}

function updateSectionsData() {
    let modules = getModules();
    // Получаем список параметров для каждого типа секций логики
    for (let index = 0; index < modules.length; index++) {
        const data = modules[index].split(':');
        var fileData = analyzeFile(data[1], getPathToScripts(), getDefaultPathToScripts(), findSectionParamsInFile);
        if (!fileData) {
            continue;
        }
        sectionsData.set(data[0], fileData);
    }

    // Получаем базовые параметры секций, которые если у любого типа (например on_info)
    basedConditions = analyzeFile("xr_logic.script", getPathToScripts(), getDefaultPathToScripts(), findBasedConditions)
}

function findModulesFileNames(filePath: string) {
    return findLuaElements(filePath, /(?<=load_scheme\().+(?=\))/g, (match) => {
        let data = match[0].split(",");
        let fileNameItem = data[0].trim();
        let sectionNameItem = data[1].trim();
        let sectionType = data[2].trim();
        return sectionNameItem.slice(1, sectionNameItem.length - 1) + ":" + fileNameItem.slice(1, fileNameItem.length - 1) + ".script:" + sectionType;
    })
}

function findSectionParamsInFile(filePath: string): string[] | null {
    return findLuaElements(filePath, /(cfg_get_.+?)(\(.+?\,\t*.+?\t*((?<=\")\w+(?=\")).+?\))/g, (match) => {
        var result = match[1].trim() + ":" + match[3];
        if (!ignoredParams.includes(result)) {
            return result;
        }
    })
}

function findBasedConditions(filePath: string) {
    return findLuaElements(filePath, /(?<!function\sadd_conditions\()(?<=(add_conditions\()).+?(?=\))/g, (match) => {
        var type = match[0].split(",")[0].trim();
        var item = match[0].split(",")[1].trim();
        return type + ":" + item.slice(1, item.length - 1);
    })
}

