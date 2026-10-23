export const languages = [
  { code: "en", name: "English" },
  { code: "ta", name: "தமிழ் (Tamil)" },
  { code: "es", name: "Español (Spanish)" },
  { code: "hi", name: "हिन्दी (Hindi)" },
  { code: "ar", name: "العربية (Arabic)" },
  { code: "fr", name: "Français (French)" },
  { code: "te", name: "తెలుగు (Telugu)" },
  { code: "ml", name: "മലയാളം (Malayalam)" },
] as const;

export function validLanguage(value: unknown): string | null {
  return typeof value === "string" && languages.some((language) => language.code === value) ? value : null;
}

export function languageName(code: string): string {
  return languages.find((language) => language.code === code)?.name ?? code;
}
