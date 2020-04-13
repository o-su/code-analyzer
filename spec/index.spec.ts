import * as fs from "fs";
import * as ts from "typescript";

import { CodeAnalyzer } from "../src/index";

describe("when root directory contains one file", () => {
    test("then CodeAnalyzer finds this file and returns data", () => {
        // given
        mockFsReaddir(() => ["file.ts"]);
        mockFsStat(() => ({ isDirectory: () => false, isFile: () => true }));
        mockFsReadFile(() => "content");
        const codeAnalyzer: CodeAnalyzer = new CodeAnalyzer();

        // when, then
        codeAnalyzer
            .onFileStart(
                (filePath: string, filename: string, fileExtension: string, content: string) => {
                    expect(filePath).toBe("path\\file.ts");
                    expect(filename).toBe("file");
                    expect(fileExtension).toBe(".ts");
                    expect(content).toBe("content");
                }
            )
            .onFileEnd(
                (filePath: string, filename: string, fileExtension: string, content: string) => {
                    expect(filePath).toBe("path\\file.ts");
                    expect(filename).toBe("file");
                    expect(fileExtension).toBe(".ts");
                    expect(content).toBe("content");
                }
            )
            .analyze("path");
    });
});

describe("when root directory contains TypeScript source file", () => {
    test("then CodeAnalyzer parses file correctly", () => {
        // given
        mockFsReaddir(() => ["file.ts"]);
        mockFsStat(() => ({ isDirectory: () => false, isFile: () => true }));
        mockFsReadFile(() => "const test: number = 5;");
        const codeAnalyzer: CodeAnalyzer = new CodeAnalyzer();

        // when, then
        codeAnalyzer
            .onNode((node: ts.Node, filePath: string, filename: string, fileExtension: string) => {
                if (ts.isSourceFile(node)) {
                    const variableStatement = node.statements[0];

                    if (ts.isVariableStatement(variableStatement)) {
                        const variableDeclaration =
                            variableStatement.declarationList.declarations[0];

                        if (ts.isVariableDeclaration(variableDeclaration)) {
                            expect(variableDeclaration.name.getText()).toBe("test");
                            expect(variableDeclaration.type!.kind).toBe(
                                ts.SyntaxKind.NumberKeyword
                            );
                            expect(variableDeclaration.initializer!.getText()).toBe("5");
                        }
                    }
                }
                expect(filePath).toBe("path\\file.ts");
                expect(filename).toBe("file");
                expect(fileExtension).toBe(".ts");
            })
            .analyze("path");
    });
});

describe("when root directory contains JavaScript source file", () => {
    test("then CodeAnalyzer parses file correctly", () => {
        // given
        mockFsReaddir(() => ["file.js"]);
        mockFsStat(() => ({ isDirectory: () => false, isFile: () => true }));
        mockFsReadFile(() => "const test = 5;");
        const codeAnalyzer: CodeAnalyzer = new CodeAnalyzer();

        // when, then
        codeAnalyzer
            .setAllowedFileTypes(["js"])
            .onNode((node: ts.Node, filePath: string, filename: string, fileExtension: string) => {
                if (ts.isSourceFile(node)) {
                    const variableStatement = node.statements[0];

                    if (ts.isVariableStatement(variableStatement)) {
                        const variableDeclaration =
                            variableStatement.declarationList.declarations[0];

                        if (ts.isVariableDeclaration(variableDeclaration)) {
                            expect(variableDeclaration.name.getText()).toBe("test");
                            expect(variableDeclaration.type).toBeUndefined();
                            expect(variableDeclaration.initializer!.getText()).toBe("5");
                        }
                    }
                }
                expect(filePath).toBe("path\\file.js");
                expect(filename).toBe("file");
                expect(fileExtension).toBe(".js");
            })
            .analyze("path");
    });
});

function mockFsReaddir(getReturnValue: (directoryPath: string) => string[]) {
    spyOn(fs, "readdir").and.callFake((directoryPath, callback) => {
        callback(undefined, getReturnValue(directoryPath));
    });
}
function mockFsStat(getReturnValue: () => object) {
    spyOn(fs, "stat").and.callFake((_directoryPath, callback) => {
        callback(undefined, getReturnValue());
    });
}
function mockFsReadFile(getReturnValue: () => string) {
    spyOn(fs, "readFile").and.callFake((_directoryPath, _encoding, callback) => {
        callback(undefined, getReturnValue());
    });
}
