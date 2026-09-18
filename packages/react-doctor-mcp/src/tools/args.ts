import { InvalidArgumentsError } from "../errors.js";

export const readRequiredString = (args: Record<string, unknown>, key: string): string => {
  const value = args[key];
  if (typeof value !== "string" || value.trim() === "") {
    throw new InvalidArgumentsError(`${key} must be a non-empty string`);
  }
  return value;
};

export const readOptionalString = (
  args: Record<string, unknown>,
  key: string,
): string | undefined => {
  const value = args[key];
  if (value === undefined) return undefined;
  if (typeof value !== "string") throw new InvalidArgumentsError(`${key} must be a string`);
  return value;
};

export const readOptionalBoolean = (
  args: Record<string, unknown>,
  key: string,
): boolean | undefined => {
  const value = args[key];
  if (value === undefined) return undefined;
  if (typeof value !== "boolean") throw new InvalidArgumentsError(`${key} must be a boolean`);
  return value;
};

export const readOptionalInteger = (
  args: Record<string, unknown>,
  key: string,
): number | undefined => {
  const value = args[key];
  if (value === undefined) return undefined;
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new InvalidArgumentsError(`${key} must be an integer`);
  }
  return value;
};

export const readOptionalStringArray = (
  args: Record<string, unknown>,
  key: string,
): string[] | undefined => {
  const value = args[key];
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) throw new InvalidArgumentsError(`${key} must be an array of strings`);
  const strings: string[] = [];
  for (const entry of value) {
    if (typeof entry !== "string")
      throw new InvalidArgumentsError(`${key} must be an array of strings`);
    strings.push(entry);
  }
  return strings;
};
