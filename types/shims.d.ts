// Global/test ambient declarations for CI typecheck only
declare module 'web-push';
declare module 'jsdom';

// Vitest globals in test files
declare const vi: any;
// Testing Library matchers ambient (if types not auto-included)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface Assertion<T = any> {
  toBeInTheDocument(): void
  toHaveAttribute(attr: string, val?: string): void
  toHaveClass(...classNames: string[]): void
  toHaveAccessibleName(name?: string | RegExp): void
  toHaveFocus(): void
  toBeDisabled(): void
  toHaveValue(val?: any): void
}

// Google Maps JS API global
declare const google: any;

