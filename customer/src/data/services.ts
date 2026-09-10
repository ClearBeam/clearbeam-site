/** The services ClearBeam AutoCare offers. Mirrors services.html. */

export type Service = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  icon: string;
};

export const SERVICES: Service[] = [
  {
    slug: "diagnostics",
    name: "Diagnostics & Check Engine Light",
    tagline: "Find out what's actually wrong",
    description:
      "OBD-II scan, code pull, and a plain-English explanation of what's actually wrong — before any work starts.",
    icon: "🔍",
  },
  {
    slug: "battery",
    name: "Battery Testing & Replacement",
    tagline: "Dead battery? We come to you",
    description:
      "Load test on the spot. If it's dead, we swap it same-visit — no jump-and-hope, no second appointment.",
    icon: "🔋",
  },
  {
    slug: "brakes",
    name: "Brake Pads & Rotors",
    tagline: "Grinding or squealing? Fixed curbside",
    description:
      "Grinding, squealing, or soft pedal — pads, rotors, and fluid flush handled curbside.",
    icon: "🛑",
  },
  {
    slug: "alternator-starter",
    name: "Alternators, Starters & Belts",
    tagline: "Won't start? We'll get you going",
    description:
      "Won't start, won't stay running, or that new belt squeal on cold mornings — sourced and installed on-site.",
    icon: "⚡",
  },
  {
    slug: "oil-fluid",
    name: "Oil Changes & Fluid Service",
    tagline: "Full service in your driveway",
    description:
      "Conventional, synthetic blend, or full synthetic — plus coolant, brake, and transmission fluid top-offs.",
    icon: "🛢️",
  },
  {
    slug: "headlights",
    name: "Headlight Restoration",
    tagline: "Our specialty — clear again",
    description:
      "Cloudy, yellowed lenses buffed and sealed clear again — our specialty. Better night visibility, better look.",
    icon: "💡",
  },
];

export function getService(slug: string): Service | undefined {
  return SERVICES.find((s) => s.slug === slug);
}

export const SERVICE_AREA = ["Katy", "Richmond", "West Houston", "Energy Corridor"];

export const BUSINESS_PHONE = "(206) 403-3356";
export const BUSINESS_PHONE_TEL = "tel:+12064033356";
