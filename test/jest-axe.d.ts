declare module 'jest-axe' {
  export interface AxeViolation {
    id: string;
    impact?: string | null;
    description: string;
    help: string;
    nodes: unknown[];
  }

  export interface AxeResults {
    violations: AxeViolation[];
  }

  export interface AxeOptions {
    rules?: Record<string, { enabled: boolean }>;
  }

  export const axe: (html: Element | string, options?: AxeOptions) => Promise<AxeResults>;
}
