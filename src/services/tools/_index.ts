import { EMAIL_READER_TOOL } from './emailReader';
import { EMAIL_SEARCH_TOOL } from './emailSearch';
import { EMAIL_FORMATTER_TOOL } from './emailFormatter';

export const tools = [
  EMAIL_READER_TOOL,
  EMAIL_SEARCH_TOOL,
  EMAIL_FORMATTER_TOOL
];

export * from './emailReader';
export * from './emailSearch';
export * from './emailFormatter'; 