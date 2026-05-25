export function getConfig() {
  return {
    supabaseUrl: requireEnv("SUPABASE_URL"),
    supabaseServiceRoleKey: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    shopifyWebhookSecret: requireEnv("SHOPIFY_WEBHOOK_SECRET"),
    whatsappAccessToken: requireEnv("WHATSAPP_ACCESS_TOKEN"),
    whatsappPhoneNumberId: requireEnv("WHATSAPP_PHONE_NUMBER_ID"),
    whatsappVerifyToken: requireEnv("WHATSAPP_VERIFY_TOKEN"),
    whatsappAppSecret: requireEnv("WHATSAPP_APP_SECRET"),
    whatsappGraphApiVersion: process.env.WHATSAPP_GRAPH_API_VERSION || "v23.0",
    cronSecret: requireEnv("CRON_SECRET"),
    abandonedCheckoutDelayMinutes: Number(process.env.ABANDONED_CHECKOUT_DELAY_MINUTES || 120),
    reviewRequestDelayHours: Number(process.env.REVIEW_REQUEST_DELAY_HOURS || 48),
    reviewRequestDomesticDelayDays: Number(process.env.REVIEW_REQUEST_DOMESTIC_DELAY_DAYS || 7),
    reviewRequestInternationalDelayDays: Number(process.env.REVIEW_REQUEST_INTERNATIONAL_DELAY_DAYS || 10),
    googleReviewUrl: process.env.GOOGLE_REVIEW_URL || "https://g.page/r/CbA6KqXz4_UpEAE/review",
    reviewRequestTemplateName: process.env.REVIEW_REQUEST_TEMPLATE_NAME || "gc_post_purchase_review_neutral_v1",
    trackingProvider: process.env.TRACKING_PROVIDER || "",
    ship24ApiKey: process.env.SHIP24_API_KEY || "",
    trackingPollLimit: Number(process.env.TRACKING_POLL_LIMIT || 10),
    trackingPollMinAgeHours: Number(process.env.TRACKING_POLL_MIN_AGE_HOURS || 12),
    automationEnabled: process.env.WHATSAPP_AUTOMATION_ENABLED === "true",
    dryRun: process.env.WHATSAPP_DRY_RUN !== "false"
  };
}

export function requireEnv(key) {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required env var: ${key}`);
  return value;
}
