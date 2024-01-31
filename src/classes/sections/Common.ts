import { Range } from "vscode"
import { Parameter } from "../parameters/Index"
import { Document } from "../documents/Index"

export class Section {
    static namePattern = /(?<=\[).+(?=\])/g
    static bodyPattern = /^[\t\ ]*\[[^\r\n]*\](?:\:.+)?(?:[\r\n ]*(?:[^[\r\n ]+(?!\[))?)*$/gm
    
    private declaration: Range
    private parameters: Parameter[]
    
    constructor(private owner: Document, private _range: Range) {}
    
    public get range(): Range {
        return this._range;
    }   

    public static getNamePatternWithParents(parents: string[]): RegExp {
        return new RegExp(Section.namePattern.source + "\:[^\n]*?\b(" + parents.join("|") + ")\b)", "g")
    }
    
}