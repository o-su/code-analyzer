import * as ts from "typescript";

export type OnFileHandler = (
    filePath: string,
    filename: string,
    fileExtension: string,
    content: string
) => void;

export type OnNodeHandler = (
    node: ts.Node,
    filePath: string,
    filename: string,
    fileExtension: string
) => void;
