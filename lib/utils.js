/**
 * Format Indian Rupees
 */
export function formatINR(amount) {
  if (!amount && amount !== 0) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format date to Indian format
 */
export function formatDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Format short date
 */
export function formatShortDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Time since (e.g. "2 hours ago")
 */
export function timeAgo(dateStr) {
  const now = new Date();
  const past = new Date(dateStr);
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatShortDate(dateStr);
}

/**
 * Generate slug from string
 */
export function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

/**
 * Budget allocation suggestions based on event type and total budget
 */
export function suggestBudgetAllocation(eventType, totalBudget, services) {
  const allocations = {
    Wedding: {
      Venue: 0.25,
      Catering: 0.22,
      Photography: 0.07,
      Videography: 0.05,
      Decoration: 0.13,
      Makeup: 0.03,
      Mehendi: 0.015,
      DJ: 0.04,
      "Event Planner": 0.05,
      Invitation: 0.015,
      Transport: 0.03,
      Cake: 0.01,
      Entertainment: 0.02,
    },
    Birthday: {
      Venue: 0.30,
      Catering: 0.25,
      Photography: 0.08,
      Decoration: 0.15,
      Cake: 0.07,
      DJ: 0.08,
      Entertainment: 0.05,
      Invitation: 0.02,
    },
    Engagement: {
      Venue: 0.28,
      Catering: 0.23,
      Photography: 0.10,
      Decoration: 0.18,
      Makeup: 0.05,
      Mehendi: 0.04,
      DJ: 0.06,
      Invitation: 0.02,
      Cake: 0.04,
    },
    Corporate: {
      Venue: 0.35,
      Catering: 0.25,
      Photography: 0.06,
      Videography: 0.05,
      Decoration: 0.08,
      DJ: 0.05,
      Entertainment: 0.08,
      Transport: 0.05,
      Invitation: 0.03,
    },
    "Private Party": {
      Venue: 0.30,
      Catering: 0.28,
      Photography: 0.07,
      Decoration: 0.12,
      DJ: 0.10,
      Cake: 0.05,
      Entertainment: 0.05,
      Invitation: 0.03,
    },
  };

  const template = allocations[eventType] || allocations["Wedding"];
  const selectedServices = services || Object.keys(template);

  // Filter to only selected services and re-normalize
  const filtered = {};
  let total = 0;
  for (const svc of selectedServices) {
    if (template[svc]) {
      filtered[svc] = template[svc];
      total += template[svc];
    } else {
      filtered[svc] = 0.03;
      total += 0.03;
    }
  }

  const result = {};
  for (const [svc, pct] of Object.entries(filtered)) {
    result[svc] = Math.round((pct / total) * totalBudget);
  }

  return result;
}

/**
 * Event type options
 */
export const EVENT_TYPES = [
  { value: "Wedding", label: "Wedding", icon: "💍", description: "The big day" },
  { value: "Engagement", label: "Engagement", icon: "💎", description: "Celebrate the commitment" },
  { value: "Birthday", label: "Birthday", icon: "🎂", description: "Make it special" },
  { value: "Corporate", label: "Corporate Event", icon: "🏢", description: "Professional & impactful" },
  { value: "Baby Shower", label: "Baby Shower", icon: "🍼", description: "Welcome the little one" },
  { value: "Anniversary", label: "Anniversary", icon: "❤️", description: "Celebrate your love" },
  { value: "Religious Event", label: "Religious Event", icon: "🙏", description: "Sacred occasions" },
  { value: "Private Party", label: "Private Party", icon: "🥂", description: "Exclusive gatherings" },
  { value: "Other", label: "Other", icon: "🎉", description: "Any celebration" },
];

/**
 * All services list
 */
export const ALL_SERVICES = [
  "Photography",
  "Videography",
  "Venue",
  "Catering",
  "Decoration",
  "Makeup",
  "Mehendi",
  "DJ",
  "Entertainment",
  "Invitation",
  "Cake",
  "Transport",
  "Event Planner",
];

/**
 * Clamp number between min and max
 */
export function clamp(num, min, max) {
  return Math.min(Math.max(num, min), max);
}

/**
 * Check if date is in the past
 */
export function isPastDate(dateStr) {
  return new Date(dateStr) < new Date();
}

/**
 * Get initials from name
 */
export function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

/**
 * Truncate text
 */
export function truncate(text, length = 100) {
  if (!text) return "";
  return text.length > length ? text.slice(0, length) + "..." : text;
}

/**
 * Star rating array helper
 */
export function starArray(rating) {
  return Array.from({ length: 5 }, (_, i) => {
    if (i < Math.floor(rating)) return "full";
    if (i < rating) return "half";
    return "empty";
  });
}
