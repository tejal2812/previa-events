export function requiredString(value, maxLength = 500) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed && trimmed.length <= maxLength ? trimmed : null;
}

export function boundedInteger(value, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  if (value === "" || value === null || value === undefined) return null;

  const number = Number(value);
  if (!Number.isInteger(number) || number < min || number > max) return null;
  return number;
}