import { window, workspace } from "vscode";

export function getPathToScripts() : string | null {
    return workspace.getConfiguration("", workspace.workspaceFile).get("Directories.PathToScripts");
}

export function isIgnoreParamsDiagnostic() : boolean {
    return workspace.getConfiguration("", workspace.workspaceFile).get("Diagnostics.IgnoreParamsDiagnostic")
}

export function isDiagnosticEnabled() : boolean {
    return false; //workspace.getConfiguration("", workspace.workspaceFile).get("Diagnostics.EnableDiagnostic")
}