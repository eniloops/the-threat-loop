export type Region =
  | "Global"
  | "North America"
  | "LatAm"
  | "Europe"
  | "APAC"
  | "Middle East & Africa";

export type Sector =
  | "Financial"
  | "Healthcare"
  | "Government"
  | "Energy"
  | "Technology";

export type ThreatType =
  | "Ransomware"
  | "APT"
  | "CVE"
  | "Phishing"
  | "Supply Chain";

export interface IntelItem {
  id: string;
  headline: string;
  source: string;
  url: string;
  date: string; // ISO
  region: Region;
  sector: Sector;
  threat: ThreatType;
  summary: string;
  lang?: "en" | "es";
}

const days = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
};

export const intel: IntelItem[] = [
  {
    id: "1",
    headline: "LockBit affiliate breaches major US regional bank",
    source: "BleepingComputer",
    url: "https://www.bleepingcomputer.com/",
    date: days(1),
    region: "North America",
    sector: "Financial",
    threat: "Ransomware",
    summary:
      "Threat actors exfiltrated 1.2TB of customer records before deploying encryptors across core banking infrastructure. Recovery is ongoing.",
  },
  {
    id: "2",
    headline: "Grupo bancario brasileño sufre ataque de ransomware Medusa",
    source: "CISO Advisor",
    url: "https://www.cisoadvisor.com.br/",
    date: days(2),
    region: "LatAm",
    sector: "Financial",
    threat: "Ransomware",
    lang: "es",
    summary:
      "El grupo Medusa exigió un rescate de 8 millones de dólares tras cifrar sistemas de back-office. La banca minorista quedó offline durante 14 horas.",
  },
  {
    id: "3",
    headline: "APT29 spear-phishing wave targets EU foreign ministries",
    source: "Mandiant",
    url: "https://cloud.google.com/blog/topics/threat-intelligence",
    date: days(3),
    region: "Europe",
    sector: "Government",
    threat: "APT",
    summary:
      "Cozy Bear operators are abusing legitimate cloud storage to deliver DUKE-family payloads through OAuth consent lures aimed at diplomats.",
  },
  {
    id: "4",
    headline: "Critical RCE in Fortinet FortiManager — CVE-2026-1147",
    source: "NVD",
    url: "https://nvd.nist.gov/",
    date: days(0),
    region: "Global",
    sector: "Technology",
    threat: "CVE",
    summary:
      "CVSS 9.8 unauthenticated remote code execution in FortiManager fgfmd is being actively exploited. Patches available; isolate management plane.",
  },
  {
    id: "5",
    headline: "Mexican federal agency hit by Phishing-as-a-Service kit",
    source: "ESET LATAM",
    url: "https://www.welivesecurity.com/es/",
    date: days(4),
    region: "LatAm",
    sector: "Government",
    threat: "Phishing",
    summary:
      "Operators leveraged Tycoon 2FA to bypass Microsoft 365 MFA on staff accounts, harvesting session tokens for downstream document theft.",
  },
  {
    id: "6",
    headline: "Supply chain compromise in popular npm crypto helper",
    source: "Socket",
    url: "https://socket.dev/",
    date: days(5),
    region: "Global",
    sector: "Technology",
    threat: "Supply Chain",
    summary:
      "A malicious post-install script in v3.4.1 of a 12M-download package exfiltrates env vars and SSH keys to a Cloudflare Worker endpoint.",
  },
  {
    id: "7",
    headline: "Saudi energy operator targeted by wiper malware",
    source: "Recorded Future",
    url: "https://www.recordedfuture.com/",
    date: days(6),
    region: "Middle East & Africa",
    sector: "Energy",
    threat: "APT",
    summary:
      "A new Shamoon variant with EFI-level persistence struck operational workstations during a planned maintenance window. ICS unaffected.",
  },
  {
    id: "8",
    headline: "Singaporean hospital network discloses ransomware breach",
    source: "The Straits Times",
    url: "https://www.straitstimes.com/",
    date: days(7),
    region: "APAC",
    sector: "Healthcare",
    threat: "Ransomware",
    summary:
      "Akira affiliates accessed patient records via a compromised VPN appliance. Elective procedures delayed; emergency services remained online.",
  },
];

export const REGIONS: Region[] = [
  "Global",
  "North America",
  "LatAm",
  "Europe",
  "APAC",
  "Middle East & Africa",
];
export const SECTORS: Sector[] = [
  "Financial",
  "Healthcare",
  "Government",
  "Energy",
  "Technology",
];
export const THREATS: ThreatType[] = [
  "Ransomware",
  "APT",
  "CVE",
  "Phishing",
  "Supply Chain",
];
export const TIME_RANGES = [
  { label: "Last 24h", days: 1 },
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days", days: 30 },
] as const;

// Approximate map coordinates per region (for the Map page)
export const REGION_COORDS: Record<Region, { x: number; y: number }> = {
  Global: { x: 50, y: 50 },
  "North America": { x: 22, y: 35 },
  LatAm: { x: 32, y: 65 },
  Europe: { x: 50, y: 30 },
  APAC: { x: 78, y: 45 },
  "Middle East & Africa": { x: 56, y: 55 },
};
