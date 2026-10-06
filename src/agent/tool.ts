import type { LocalizedText, ToolExecution } from "../domain/types.js";

export interface AgentTool<Input, Output> {
  readonly name: string;
  readonly version: string;
  readonly responsibility: LocalizedText;
  execute(input: Input): Promise<ToolExecution<Output>>;
}

export class CustomerNotFoundError extends Error {
  constructor(public readonly customerId: string) {
    super(`Customer not found: ${customerId}`);
    this.name = "CustomerNotFoundError";
  }
}
