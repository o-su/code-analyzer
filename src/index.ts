import * as ts from "typescript";
import { FileTreeWalker } from "file-tree-walker-ts";

import { OnFileHandler, OnNodeHandler } from "./types";

export * from "./types";

export class CodeAnalyzer {
    private onFileStartHandler?: OnFileHandler;
    private onNodeHandler?: OnNodeHandler;
    private onFileEndHandler?: OnFileHandler;
    private fileTreeWalker: FileTreeWalker;

    constructor() {
        this.fileTreeWalker = new FileTreeWalker().setAllowedFileTypes(["ts", "tsx"]);
    }

    setFileEncoding = (fileEncoding: string): this => {
        this.fileTreeWalker.setFileEncoding(fileEncoding);

        return this;
    };

    setExcludedFiles = (excludedFiles: string[]): this => {
        this.fileTreeWalker.setExcludedFiles(excludedFiles);

        return this;
    };

    setAllowedFileTypes = (allowedFileTypes: string[]): this => {
        this.fileTreeWalker.setAllowedFileTypes(allowedFileTypes);

        return this;
    };

    onFileStart = (onFileStartHandler: OnFileHandler): this => {
        this.onFileStartHandler = onFileStartHandler;

        return this;
    };

    onNode = (onNodeHandler: OnNodeHandler): this => {
        this.onNodeHandler = onNodeHandler;

        return this;
    };

    onFileEnd = (onFileEndHandler: OnFileHandler): this => {
        this.onFileEndHandler = onFileEndHandler;

        return this;
    };

    analyze = (sourceDirectory: string): void => {
        this.fileTreeWalker
            .onFile(
                (filePath: string, filename: string, fileExtension: string, content: string) => {
                    this.onFileStartHandler?.(filePath, filename, fileExtension, content);
                    this.analyzeSourceFile(
                        filename,
                        content,
                        (node: ts.Node) =>
                            this.onNodeHandler?.(node, filePath, filename, fileExtension),
                    );
                    this.onFileEndHandler?.(filePath, filename, fileExtension, content);
                },
            )
            .walk(sourceDirectory);
    };

    private analyzeSourceFile = (
        fileName: string,
        sourceCode: string,
        transformNode: (node: ts.Node) => void,
    ): void => {
        const ast: ts.Node = this.transformSourceCodeToAst(fileName, sourceCode);

        ts.transform(
            ast,
            [(context: ts.TransformationContext) => this.createTransformer(context, transformNode)],
            {
                removeComments: false,
            },
        );
    };

    private transformSourceCodeToAst = (fileName: string, sourceCode: string): ts.SourceFile =>
        ts.createSourceFile(fileName, sourceCode, ts.ScriptTarget.Latest, true);

    private createTransformer =
        <T extends ts.Node>(context: ts.TransformationContext, onNode: (node: ts.Node) => void) =>
        (rootNode: T) => {
            return ts.visitNode(rootNode, (childNode: ts.Node) =>
                this.visitNode(childNode, context, onNode),
            );
        };

    private visitNode = (
        node: ts.Node,
        context: ts.TransformationContext,
        onNode: (node: ts.Node) => void,
    ): ts.Node => {
        onNode(node);

        return ts.visitEachChild(
            node,
            (childNode: ts.Node) => this.visitNode(childNode, context, onNode),
            context,
        );
    };
}
