# code-analyzer

Static code analyzer implemented using TypeScript compiler.

## Installation

```bash
npm install --save code-analyzer-ts
```

## Example Usage

```typescript
import * as ts from "typescript";
import { FileTreeWalker } from "code-analyzer-ts";

new CodeAnalyzer()
    .onFileStart((filePath: string, filename: string, fileExtension: string, content: string) => {
        console.log(filePath, filename, fileExtension, content);
    })
    .onNode((node: ts.Node) => {
        if (ts.isCallExpression(node) && node.expression.getText() === "eval") {
            console.error("Eval is evil!");
        }
    })
    .onFileEnd((filePath: string, filename: string, fileExtension: string, content: string) => {
        console.log(filePath, filename, fileExtension, content);
    })
    .analyze("path");
```
