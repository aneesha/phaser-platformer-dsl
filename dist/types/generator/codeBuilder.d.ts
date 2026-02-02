/**
 * Fluent builder for generating indented code strings.
 * Builder pattern: each method returns `this` for chaining.
 */
export declare class CodeBuilder {
    private lines;
    private indentLevel;
    private indentStr;
    indent(): this;
    dedent(): this;
    line(text?: string): this;
    block(header: string, body: (b: CodeBuilder) => void): this;
    raw(code: string): this;
    append(other: CodeBuilder): this;
    toString(): string;
}
//# sourceMappingURL=codeBuilder.d.ts.map