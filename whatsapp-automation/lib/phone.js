export function normalizePhone(value) {
  if (!value) return null;
  const digits = String(value).replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length === 10) return `91${digits}`;
  return digits;
}
