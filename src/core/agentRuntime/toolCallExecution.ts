import { ToolExecutionContext, ToolRegistry } from './toolRegistry';
import { logger } from '../utils/logger';
import { ToolExecutionError, ToolTimeoutError, ToolValidationError, ToolErrorKind } from './toolErrors';

/**
 * Capture the outcome of a tool execution attempt.
 *
 * Details: successful calls include a result payload; failures include an error
 * message suitable for LLM consumption.
 *
 * Side effects: none.
 * Error behavior: none.
 */
export interface ToolResult {
  name: string;
  success: boolean;
  result?: unknown;
  error?: string;
  errorType?: ToolErrorKind;
  latencyMs: number;
}

/**
 * Execute a tool with a timeout guard.
 *
 * Details: races the tool execution against a timeout to prevent stalled calls.
 *
 * Side effects: executes tool code and any downstream effects it performs.
 * Error behavior: returns a failure result on timeout or tool errors.
 */
export async function executeToolWithTimeout(
  registry: ToolRegistry,
  call: { name: string; args: unknown },
  ctx: ToolExecutionContext,
  timeoutMs: number,
): Promise<ToolResult> {
  const start = Date.now();
  logger.info(
    { traceId: ctx.traceId, toolName: call.name, event: 'tool_invocation_start' },
    'Tool invocation started',
  );

  const timeoutPromise = new Promise<ToolResult>((resolve) => {
    setTimeout(() => {
      const timeoutError = new ToolTimeoutError(call.name, timeoutMs);
      resolve({
        name: call.name,
        success: false,
        error: timeoutError.message,
        errorType: timeoutError.kind,
        latencyMs: timeoutMs,
      });
    }, timeoutMs);
  });

  const executionPromise = registry.executeValidated(call, ctx).then((result) => ({
    name: call.name,
    success: result.success,
    result: result.success ? result.result : undefined,
    error: result.success ? undefined : result.error,
    errorType: result.success ? undefined : result.errorType,
    latencyMs: Date.now() - start,
  }));

  const result = await Promise.race([executionPromise, timeoutPromise]);
  const latencyMs = Math.max(0, Date.now() - start);

  const finalResult = {
    ...result,
    latencyMs: result.latencyMs ?? latencyMs,
  } satisfies ToolResult;

  if (!finalResult.success) {
    const errorType = finalResult.errorType ?? 'execution';
    if (errorType === 'validation') {
      const error = new ToolValidationError(call.name, finalResult.error ?? 'Invalid tool call');
      logger.warn(
        {
          traceId: ctx.traceId,
          toolName: call.name,
          errorType,
          errorName: error.name,
          latencyMs: finalResult.latencyMs,
        },
        'Tool invocation rejected',
      );
    } else if (errorType === 'timeout') {
      const error = new ToolTimeoutError(call.name, timeoutMs);
      logger.warn(
        {
          traceId: ctx.traceId,
          toolName: call.name,
          errorType,
          errorName: error.name,
          latencyMs: finalResult.latencyMs,
        },
        'Tool invocation timed out',
      );
    } else {
      const error = new ToolExecutionError(call.name, finalResult.error ?? 'Tool execution failed');
      logger.warn(
        {
          traceId: ctx.traceId,
          toolName: call.name,
          errorType,
          errorName: error.name,
          latencyMs: finalResult.latencyMs,
        },
        'Tool invocation failed',
      );
    }
  } else {
    logger.info(
      { traceId: ctx.traceId, toolName: call.name, latencyMs: finalResult.latencyMs },
      'Tool invocation succeeded',
    );
  }

  return finalResult;
}
