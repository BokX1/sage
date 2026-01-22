export type ToolErrorKind = 'validation' | 'execution' | 'timeout';

export class ToolValidationError extends Error {
  readonly toolName: string;
  readonly kind: ToolErrorKind = 'validation';

  constructor(toolName: string, message: string) {
    super(message);
    this.name = 'ToolValidationError';
    this.toolName = toolName;
  }
}

export class ToolExecutionError extends Error {
  readonly toolName: string;
  readonly kind: ToolErrorKind = 'execution';

  constructor(toolName: string, message: string) {
    super(message);
    this.name = 'ToolExecutionError';
    this.toolName = toolName;
  }
}

export class ToolTimeoutError extends Error {
  readonly toolName: string;
  readonly timeoutMs: number;
  readonly kind: ToolErrorKind = 'timeout';

  constructor(toolName: string, timeoutMs: number) {
    super(`Tool "${toolName}" timed out after ${timeoutMs}ms`);
    this.name = 'ToolTimeoutError';
    this.toolName = toolName;
    this.timeoutMs = timeoutMs;
  }
}
