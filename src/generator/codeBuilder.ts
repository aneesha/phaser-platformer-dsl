/**
 * Fluent builder for generating indented code strings.
 * Builder pattern: each method returns `this` for chaining.
 */
export class CodeBuilder {
  private lines: string[] = [];
  private indentLevel = 0;
  private indentStr = '  ';

  indent(): this {
    this.indentLevel++;
    return this;
  }

  dedent(): this {
    this.indentLevel = Math.max(0, this.indentLevel - 1);
    return this;
  }

  line(text = ''): this {
    if (text === '') {
      this.lines.push('');
    } else {
      this.lines.push(this.indentStr.repeat(this.indentLevel) + text);
    }
    return this;
  }

  block(header: string, body: (b: CodeBuilder) => void): this {
    this.line(`${header} {`);
    this.indent();
    body(this);
    this.dedent();
    this.line('}');
    return this;
  }

  raw(code: string): this {
    for (const line of code.split('\n')) {
      this.lines.push(line);
    }
    return this;
  }

  append(other: CodeBuilder): this {
    for (const line of other.lines) {
      this.lines.push(this.indentStr.repeat(this.indentLevel) + line);
    }
    return this;
  }

  toString(): string {
    return this.lines.join('\n');
  }
}
