import type { en } from './en';

export type MessageKey = keyof typeof en;

/**
 * Shape every locale bundle must fill in completely.
 *
 * @remarks Derived from the English bundle, so a missing or misspelled key in any
 * translation is a compile error rather than a blank message in production.
 */
export type Messages = Record<MessageKey, string>;
