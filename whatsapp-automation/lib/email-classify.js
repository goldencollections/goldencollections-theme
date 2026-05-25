const RULES = [
  {
    classification: "order_status",
    pattern: /\b(order|tracking|track|awb|consignment|shipped|dispatch|delivery|delivered|where is|not received)\b/i,
  },
  {
    classification: "deity_fit",
    pattern: /\b(deity|god|idol|vigraham|vigraha|lakshmi|varalakshmi|amman|krishna|ganesha|balaji|mukut|crown|haram|size|measurement|fit)\b/i,
  },
  {
    classification: "real_kemp",
    pattern: /\b(real kemp|kemp|kempu|bharatanatyam|kuchipudi|arangetram|dance jewellery|dance jewelry)\b/i,
  },
  {
    classification: "return_exchange",
    pattern: /\b(return|exchange|refund|damaged|broken|wrong item|defective|replacement)\b/i,
  },
  {
    classification: "bulk_wholesale",
    pattern: /\b(bulk|wholesale|reseller|dealer|institute|dance school|many sets|quantity)\b/i,
  },
];

const SYSTEM_SENDER_PATTERNS = [
  /^no-?reply@/i,
  /^do-?not-?reply@/i,
  /^mailer-daemon@/i,
  /^postmaster@/i,
  /^bounce@/i,
  /^notification(s)?@/i,
  /^mailer@shopify\.com$/i,
  /@email\.shopify\.com$/i,
  /@shopify\.com$/i,
  /@godaddy\.com$/i,
  /@secureserver\.net$/i,
];

const SYSTEM_SUBJECT_PATTERNS = [
  /\bverify your email address\b/i,
  /\bverification code\b/i,
  /\badd all your new email to your devices\b/i,
  /\bpassword reset\b/i,
  /\bsecurity alert\b/i,
  /\blogin alert\b/i,
  /\bautomated notification\b/i,
  /\bdelivery status notification\b/i,
  /\bundeliverable\b/i,
];

export function classifyEmail({ subject = "", text = "" } = {}) {
  const haystack = `${subject}\n${text}`;
  for (const rule of RULES) {
    if (rule.pattern.test(haystack)) return rule.classification;
  }
  return "general_support";
}

export function shouldIgnoreEmail({ from_email = "", subject = "", raw_headers = {} } = {}) {
  const from = String(from_email || "").trim().toLowerCase();
  const cleanSubject = String(subject || "").trim();
  const autoSubmitted = getHeader(raw_headers, "auto-submitted");
  const precedence = getHeader(raw_headers, "precedence");

  if (SYSTEM_SENDER_PATTERNS.some((pattern) => pattern.test(from))) {
    return { ignore: true, reason: "system_sender" };
  }
  if (SYSTEM_SUBJECT_PATTERNS.some((pattern) => pattern.test(cleanSubject))) {
    return { ignore: true, reason: "system_subject" };
  }
  if (autoSubmitted && !/^no$/i.test(autoSubmitted)) {
    return { ignore: true, reason: "auto_submitted_header" };
  }
  if (/\b(bulk|junk|list)\b/i.test(precedence || "")) {
    return { ignore: true, reason: "bulk_precedence_header" };
  }

  return { ignore: false, reason: null };
}

export function draftReply({ fromName, classification, subject }) {
  const greetingName = firstName(fromName);
  const greeting = greetingName ? `Hi ${greetingName},` : "Hi,";
  const subjectLine = normalizeReplySubject(subject);

  return {
    subject: subjectLine,
    body: `${greeting}\n\n${draftBodyFor(classification)}\n\n${supportEmailSignature()}`,
  };
}

export function supportEmailSignature() {
  const customSignature = process.env.SUPPORT_EMAIL_SIGNATURE;
  if (customSignature && customSignature.trim()) {
    return customSignature.replace(/\\n/g, "\n").trim();
  }

  return [
    "Warm regards,",
    "Golden Collections Support",
    "Golden Collections",
    "Bharatanatyam, Kuchipudi and Deity Jewellery",
    "https://www.goldencollections.com/",
    "support@goldencollections.com",
    "WhatsApp: +91 7337294499",
  ].join("\n");
}

export function ensureSupportEmailSignature(body = "") {
  const text = String(body || "").trimEnd();
  const signature = supportEmailSignature();

  if (!text) return signature;
  if (text.includes(signature) || text.includes("https://www.goldencollections.com/")) {
    return text;
  }

  const oldClosingPattern = /\n\n(?:Regards|Warm regards),?\s*\nGolden Collections Support\s*$/i;
  if (oldClosingPattern.test(text)) {
    return text.replace(oldClosingPattern, `\n\n${signature}`);
  }

  return `${text}\n\n${signature}`;
}

function draftBodyFor(classification) {
  switch (classification) {
    case "order_status":
      return "Thank you for writing to Golden Collections. We will check your order and tracking details and get back to you with the latest update.";
    case "deity_fit":
      return "Thank you for contacting Golden Collections. For deity jewellery fit help, please share the idol height, face/head width, and a clear front photo if not already shared. This helps us guide you more accurately.";
    case "real_kemp":
      return "Thank you for your interest in real kemp jewellery. Please share whether this is for Bharatanatyam, Kuchipudi, bridal use, or a traditional function, and we will guide you on suitable pieces.";
    case "return_exchange":
      return "Thank you for letting us know. Please share your order number and clear photos of the issue so our team can review and guide you on the next step.";
    case "bulk_wholesale":
      return "Thank you for your enquiry. Please share the product category, required quantity, age group or use case, and required date so we can check availability and options.";
    default:
      return "Thank you for contacting Golden Collections. We have received your message and will get back to you shortly.";
  }
}

function normalizeReplySubject(subject = "") {
  const clean = subject.trim() || "Your Golden Collections enquiry";
  return /^re:/i.test(clean) ? clean : `Re: ${clean}`;
}

function firstName(name = "") {
  const clean = name.trim();
  if (!clean || clean.includes("@")) return "";
  return clean.split(/\s+/)[0];
}

function getHeader(headers, name) {
  if (!headers || typeof headers !== "object") return "";
  const match = Object.entries(headers).find(([key]) => key.toLowerCase() === name.toLowerCase());
  return match ? String(match[1] || "") : "";
}
