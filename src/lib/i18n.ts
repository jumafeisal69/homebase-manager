import { useSyncExternalStore } from "react";

export type Lang = "en" | "sw";

const KEY = "nyumbapro-lang";
const listeners = new Set<() => void>();
let current: Lang | null = null;

function read(): Lang {
  if (current) return current;
  if (typeof window === "undefined") return "en";
  current = window.localStorage.getItem(KEY) === "sw" ? "sw" : "en";
  return current;
}

export function setLang(lang: Lang) {
  current = lang;
  window.localStorage.setItem(KEY, lang);
  document.documentElement.lang = lang;
  listeners.forEach((l) => l());
}

export function useLang(): Lang {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    read,
    () => "en",
  );
}

/** English text → Swahili. Anything missing falls back to English. */
const sw: Record<string, string> = {
  Dashboard: "Dashibodi",
  Properties: "Mali",
  Property: "Mali",
  Buildings: "Majengo",
  Rooms: "Vyumba",
  Tenants: "Wapangaji",
  Tenant: "Mpangaji",
  "Rent & Payments": "Kodi na Malipo",
  "Rent & payments": "Kodi na malipo",
  Electricity: "Umeme",
  Water: "Maji",
  Maintenance: "Matengenezo",
  Contracts: "Mikataba",
  Reports: "Ripoti",
  Notifications: "Taarifa",
  "Users & Activity": "Watumiaji na Shughuli",
  "Users & access": "Watumiaji na ruhusa",
  Settings: "Mipangilio",
  "My Home": "Nyumbani Kwangu",
  "Electricity & Water": "Umeme na Maji",
  Landlord: "Mwenye nyumba",
  "Property manager": "Msimamizi wa mali",
  "Electricity payments": "Malipo ya umeme",
  "Water payments": "Malipo ya maji",
  "Your profile": "Wasifu wako",
  "Rent rules & notifications": "Kanuni za kodi na taarifa",
  Security: "Usalama",
  "Full name": "Jina kamili",
  Phone: "Simu",
  Email: "Barua pepe",
  Name: "Jina",
  Region: "Mkoa",
  District: "Wilaya",
  Ward: "Kata",
  Street: "Mtaa",
  Address: "Anwani",
  Status: "Hali",
  Description: "Maelezo",
  Notes: "Maelezo ya ziada",
  Amount: "Kiasi",
  "Amount (TZS)": "Kiasi (TZS)",
  Method: "Njia ya malipo",
  Reference: "Kumbukumbu",
  Room: "Chumba",
  Month: "Mwezi",
  "Due date": "Tarehe ya mwisho",
  "Payment date": "Tarehe ya malipo",
  "Purchase date": "Tarehe ya kununua",
  "Start date": "Tarehe ya kuanza",
  "End date": "Tarehe ya kuisha",
  Expected: "Inayotarajiwa",
  Collected: "Iliyokusanywa",
  Outstanding: "Deni",
  "This month": "Mwezi huu",
  "Previous month": "Mwezi uliopita",
  "All time": "Jumla yote",
  "Open jobs": "Kazi zilizo wazi",
  "High or urgent": "Juu au dharura",
  "Repair spend": "Gharama za matengenezo",
  Active: "Hai",
  Expired: "Imeisha",
  "All requests": "Maombi yote",
  "All contracts": "Mikataba yote",
  "Rent charges": "Madai ya kodi",
  "Payments received": "Malipo yaliyopokelewa",
  "Month by month": "Mwezi kwa mwezi",
  "Net income": "Mapato halisi",
  Occupancy: "Ukaliaji",
  "Current room": "Chumba cha sasa",
  "Monthly rent": "Kodi ya mwezi",
  "Total paid": "Jumla iliyolipwa",
  "Outstanding balance": "Deni lililobaki",
  "Personal details": "Taarifa binafsi",
  "Room history": "Historia ya vyumba",
  "Account activity": "Shughuli za akaunti",
  Owner: "Mmiliki",
  "Property managers": "Wasimamizi wa mali",
  "Tenant portal access": "Ufikiaji wa wapangaji",
  "Nothing here yet.": "Hakuna kitu bado.",
  "No properties yet.": "Bado hakuna mali.",
};

export function translate(lang: Lang, text: string): string {
  return lang === "sw" ? (sw[text] ?? text) : text;
}

export function useT() {
  const lang = useLang();
  return (text: string) => translate(lang, text);
}
