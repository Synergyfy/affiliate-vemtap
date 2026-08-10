export interface LeadQualityInput {
  businessName?: string;
  businessAddress?: string;
  location?: string;
  industry?: string;
  phone?: string;
  email?: string;
  contactName?: string;
  contactRole?: string;
  website?: string;
  hasGpsEvidence?: boolean;
}

export interface LeadQualityResult {
  score: number;
  breakdown: {
    businessName: number;
    location: number;
    category: number;
    contact: number;
    decisionMaker: number;
    profile: number;
    gpsEvidence: number;
  };
  missing: string[];
}

const MAX = 100;

/**
 * Pure lead-quality scorer. No DB access — safe to call from any module.
 * Scores 0-100 based on the completeness and relevance of captured data.
 */
export function evaluateLeadQuality(input: LeadQualityInput): LeadQualityResult {
  const breakdown = {
    businessName: 25,
    location: 15,
    category: 15,
    contact: 15,
    decisionMaker: 10,
    profile: 15,
    gpsEvidence: 5,
  };

  const missing: string[] = [];
  let score = 0;

  const has = (v: string | undefined | null) =>
    typeof v === 'string' && v.trim().length > 0;

  if (has(input.businessName)) {
    score += breakdown.businessName;
  } else {
    missing.push('businessName');
  }

  if (has(input.businessAddress) || has(input.location)) {
    score += breakdown.location;
  } else {
    missing.push('location');
  }

  if (has(input.industry)) {
    score += breakdown.category;
  } else {
    missing.push('industry');
  }

  if (has(input.phone) || has(input.email)) {
    score += breakdown.contact;
  } else {
    missing.push('phone/email');
  }

  if (has(input.contactName) || has(input.contactRole)) {
    score += breakdown.decisionMaker;
  } else {
    missing.push('contactName/contactRole');
  }

  if (has(input.website) && (has(input.contactName) || has(input.contactRole))) {
    score += breakdown.profile;
  } else if (has(input.phone) && has(input.email) && has(input.contactName)) {
    score += breakdown.profile;
  }

  if (input.hasGpsEvidence) {
    score += breakdown.gpsEvidence;
  } else {
    missing.push('gpsEvidence');
  }

  return {
    score: Math.min(Math.max(score, 0), MAX),
    breakdown,
    missing,
  };
}

export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
