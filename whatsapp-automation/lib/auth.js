export function isCronAuthorized(req, config) {
  if (req.headers.authorization === `Bearer ${config.cronSecret}`) return true;

  const url = new URL(req.url, "https://goldencollections.local");
  return url.searchParams.get("token") === config.cronSecret;
}
