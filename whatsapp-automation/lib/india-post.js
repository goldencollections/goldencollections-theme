const INDIA_POST_TRACKING_BASE_URL = "https://www.indiapost.gov.in/_layouts/15/DOP.Portal.Tracking/TrackConsignment.aspx";

export function normalizeTrackingNumber(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

export function isLikelyIndiaPostTracking(value) {
  const trackingNumber = normalizeTrackingNumber(value);
  return /^[A-Z]{2}\d{9}IN$/.test(trackingNumber);
}

export function indiaPostTrackingUrl(value) {
  const trackingNumber = normalizeTrackingNumber(value);
  if (!trackingNumber) return null;
  return `${INDIA_POST_TRACKING_BASE_URL}?Artical=${encodeURIComponent(trackingNumber)}`;
}

export function detectTrackingCarrier(fulfillment = {}) {
  const company = String(fulfillment.tracking_company || "").trim();
  const normalized = company.toLowerCase();
  const firstNumber = normalizeTrackingNumber(fulfillment.tracking_number || fulfillment.tracking_numbers?.[0]);

  if (normalized.includes("india post") || normalized.includes("speed post")) return "India Post";
  if (isLikelyIndiaPostTracking(firstNumber)) return "India Post";
  return company || "unknown";
}

export function extractShipmentFromFulfillment(fulfillment = {}) {
  const numbers = [
    fulfillment.tracking_number,
    ...(Array.isArray(fulfillment.tracking_numbers) ? fulfillment.tracking_numbers : []),
  ]
    .map(normalizeTrackingNumber)
    .filter(Boolean);
  const trackingNumber = [...new Set(numbers)][0] || null;
  const carrier = detectTrackingCarrier(fulfillment);
  const carrierUrl = fulfillment.tracking_url || fulfillment.tracking_urls?.[0] || null;
  const officialTrackingUrl = carrier === "India Post" && trackingNumber ? indiaPostTrackingUrl(trackingNumber) : carrierUrl;

  return {
    tracking_number: trackingNumber,
    carrier,
    tracking_url: officialTrackingUrl,
    shopify_tracking_url: carrierUrl,
  };
}
