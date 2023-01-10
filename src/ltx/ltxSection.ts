import { DiagnosticSeverity, Position, Range } from "vscode";
import { isDiagnosticEnabled } from "../settings";
import { LtxDocumentType } from "./ltxDocument";
import { addError } from "./ltxError";
import { LtxLine } from "./ltxLine";
import { LtxSectionType } from "./ltxSectionType";
import { addSemantic, LtxSemantic, LtxSemanticDescription, LtxSemanticModification, LtxSemanticType } from "./ltxSemantic";

export class LtxSection {
    readonly name: string
    readonly type: LtxSectionType
    readonly startLine: number
    readonly linkRange?: Range
    endLine?: number

    lines: Map<number, LtxLine>
    private tempLines: Map<number, string> = new Map<number, string>()

    validate() { 
        if (this.tempLines.size === 0) {            
            addError(this.linkRange, "Рекомендуется, если хотите закончить логику, использовать nil.", this.name, DiagnosticSeverity.Warning, "ReplaceToNil");
        }
    }

    close() {
        if (this.tempLines.size !== 0 ) {
            this.endLine = Math.max(...Array.from(this.tempLines.keys()));
        }
        else {
            this.endLine = this.startLine;
        }
        
        if (isDiagnosticEnabled()) {
            this.validate();
        }
    }

    addTempLine(index : number, line : string) {
        this.tempLines.set(index, line);
    }

    async parseLines() {
        if (this.tempLines.size === 0) {
            return;
        }
        let data = new Map<number, LtxLine>();
        for await (const [key, value] of this.tempLines) {
            data.set(key, new LtxLine(key, value));
        } 
        this.lines = data; 
    }

    getSectionTypeName() {
        return this.type.name;
    }

    constructor(name: string, startLine: number, startCharacter: number, filetype : LtxDocumentType) {
        this.name = name.slice(1, name.length - 1).trim();
        if (this.name !== "") {
            this.type = new LtxSectionType((/^\w*[^\@.*]/.exec(name.slice(1, name.length - 1)))[0]);

            if (!this.type.isValid && filetype === LtxDocumentType.Logic) {
                addError(this.linkRange, "Неизвестный тип секции", this.name, DiagnosticSeverity.Warning);
            }
        }
        
        this.linkRange = new Range(new Position(startLine, startCharacter + 1), new Position(startLine, startCharacter + name.length - 1));
        this.startLine = startLine;
        addSemantic(new LtxSemantic(LtxSemanticType.struct, LtxSemanticModification.declaration, this.linkRange, LtxSemanticDescription.signal, this.name))
    }
}
