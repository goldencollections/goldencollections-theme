import { markReviewRequestDelivered } from "./review-requests.js";
import { supabase } from "./supabase.js";

export async function pollTrackingProvider(config, now = new Date().toISOString()) {
  if (!isTrackingEnabled(config)) {
    return { enabled: false, processed: 0, results: [] };
  }

  const cutoff = new Date(new Date(now).getTime() - config.trackingPollMinAgeHours * 60 * 60 * 1000).toISOString();
  const { data: shipments, error } = await supabase()
    .from("shipment_events")
    .select("id,shopify_order_id,tracking_number,carrier,status,status_updated_at,raw_payload")
    .neq("status", "delivered")
    .neq("status", "delivery_issue")
    .lte("status_updated_at", cutoff)
    .order("status_updated_at", { ascending: true })
    .limit(config.trackingPollLimit);

  if (error) throw error;

  const results = [];
  for (const shipment of shipments || []) {
    try {
      const tracking = await fetchShip24Tracking(config, shipment);
      const status = normalizeProviderStatus(tracking.statusMilestone || tracking.statusCode || tracking.statusCategory);
      const deliveredAt = status === "delivered" ? (tracking.deliveredAt || now) : null;
      const rawPayload = {
        ...(shipment.raw_payload || {}),
        tracking_provider: {
          provider: "ship24",
          checked_at: now,
          status_milestone: tracking.statusMilestone,
          status_code: tracking.statusCode,
          status_category: tracking.statusCategory,
          latest_event_at: tracking.latestEventAt,
        }
      };

      const { error: updateError } = await supabase()
        .from("shipment_events")
        .update({
          status,
          status_updated_at: now,
          delivered_at: deliveredAt,
          raw_payload: rawPayload
        })
        .eq("id", shipment.id);

      if (updateError) throw updateError;

      let reviewRequest = null;
      if (status === "delivered") {
        reviewRequest = await markReviewRequestDelivered({
          orderId: shipment.shopify_order_id,
          config,
          now: deliveredAt || now
        });
      }

      results.push({ tracking_number: shipment.tracking_number, status, review_request: reviewRequest });
    } catch (error) {
      await supabase()
        .from("shipment_events")
        .update({
          status_updated_at: now,
          raw_payload: {
            ...(shipment.raw_payload || {}),
            tracking_provider_error: {
              provider: "ship24",
              checked_at: now,
              message: error.message
            }
          }
        })
        .eq("id", shipment.id);
      results.push({ tracking_number: shipment.tracking_number, status: "error", error: error.message });
    }
  }

  return { enabled: true, processed: results.length, results };
}

function isTrackingEnabled(config) {
  return config.trackingProvider.toLowerCase() === "ship24" && Boolean(config.ship24ApiKey);
}

async function fetchShip24Tracking(config, shipment) {
  const res = await fetch("https://api.ship24.com/public/v1/trackers/track", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.ship24ApiKey}`,
      "Content-Type": "application/json; charset=utf-8"
    },
    body: JSON.stringify({
      trackingNumber: shipment.tracking_number,
      shipmentReference: shipment.shopify_order_id || shipment.tracking_number,
      originCountryCode: "IN",
      trackingUrl: shipment.raw_payload?.tracking_url || undefined
    })
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body?.message || body?.error || `Ship24 request failed with ${res.status}`);
  }

  const tracking = body?.data?.trackings?.[0];
  const shipmentData = tracking?.shipment || {};
  const events = tracking?.events || [];
  return {
    statusMilestone: shipmentData.statusMilestone,
    statusCode: shipmentData.statusCode,
    statusCategory: shipmentData.statusCategory,
    latestEventAt: events[0]?.datetime || events[0]?.occurrenceDatetime || null,
    deliveredAt: shipmentData.delivery?.datetime || events.find((event) => normalizeProviderStatus(event.statusMilestone || event.statusCode) === "delivered")?.datetime || null
  };
}

function normalizeProviderStatus(value) {
  const status = String(value || "").toLowerCase();
  if (status.includes("delivered")) return "delivered";
  if (status.includes("exception") || status.includes("failed") || status.includes("return")) return "delivery_issue";
  if (status.includes("out_for_delivery")) return "out_for_delivery";
  if (status.includes("transit") || status.includes("delivery")) return "in_transit";
  if (status.includes("info") || status.includes("pending")) return "tracking_pending";
  return status.replace(/\s+/g, "_") || "tracking_pending";
}
