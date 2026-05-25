const SIZE_SENSITIVE_PATTERNS = [
  /deity/i,
  /god/i,
  /idol/i,
  /mukut/i,
  /crown/i,
  /kireedam/i,
  /haram/i,
  /vaddanam/i,
  /varalakshmi/i,
  /lakshmi/i,
  /amman/i,
  /real kemp/i,
  /kemp/i,
  /bharatanatyam/i,
  /kuchipudi/i,
  /dance set/i,
  /kids/i
];

export function classifyCart(checkout) {
  const lineItems = checkout.line_items || [];
  const haystack = lineItems
    .map((item) => [
      item.title,
      item.name,
      item.variant_title,
      item.product_title,
      ...(item.properties || []).map((property) => `${property.name} ${property.value}`)
    ].filter(Boolean).join(" "))
    .join(" ");

  const sizeSensitive = SIZE_SENSITIVE_PATTERNS.some((pattern) => pattern.test(haystack));
  return {
    cart_classification: sizeSensitive ? "size_help" : "general",
    template_name: sizeSensitive ? "gc_abandoned_checkout_size_help_v1" : "gc_abandoned_checkout_help_v1",
    reason: sizeSensitive ? "cart_contains_fit_sensitive_terms" : "default_general_cart"
  };
}

export function cartSummary(checkout) {
  const first = checkout.line_items?.[0]?.title || checkout.line_items?.[0]?.name;
  if (!first) return "items";
  const count = checkout.line_items?.length || 1;
  return count > 1 ? `${first} and ${count - 1} more item${count > 2 ? "s" : ""}` : first;
}
