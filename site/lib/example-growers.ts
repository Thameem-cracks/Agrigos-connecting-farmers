import { db } from "./server";

// Fictional profiles used to populate the globe until more growers join.
// Stable IDs and INSERT OR IGNORE keep existing members and their data intact.
const growers = [
  ["maya_ca", "Maya Chen", "Canada", "British Columbia", "Vancouver", "Urban vegetables", "kale, tomatoes", 49.28, -123.12],
  ["luis_us", "Luis Rivera", "United States", "California", "Fresno", "Regenerative farming", "almonds, citrus", 36.74, -119.78],
  ["sofia_mx", "Sofía Hernández", "Mexico", "Jalisco", "Guadalajara", "Small farm growing", "maize, beans", 20.67, -103.35],
  ["ana_br", "Ana Oliveira", "Brazil", "São Paulo", "Campinas", "Agroforestry", "coffee, bananas", -22.91, -47.06],
  ["camila_co", "Camila Torres", "Colombia", "Antioquia", "Medellín", "Coffee growing", "coffee, plantain", 6.24, -75.58],
  ["mateo_ar", "Mateo Fernández", "Argentina", "Mendoza", "Mendoza", "Vineyard growing", "grapes, olives", -32.89, -68.84],
  ["grace_uk", "Grace Patel", "United Kingdom", "England", "Bristol", "Community gardening", "herbs, greens", 51.45, -2.59],
  ["lucia_es", "Lucía García", "Spain", "Andalusia", "Seville", "Water-wise growing", "olives, tomatoes", 37.39, -5.99],
  ["camille_fr", "Camille Martin", "France", "Occitanie", "Toulouse", "Market gardening", "lettuce, squash", 43.60, 1.44],
  ["youssef_ma", "Youssef El Amrani", "Morocco", "Marrakesh-Safi", "Marrakesh", "Dryland farming", "dates, olives", 31.63, -8.00],
  ["amina_ke", "Amina Wanjiku", "Kenya", "Nakuru", "Nakuru", "Vegetable growing", "kale, potatoes", -0.30, 36.08],
  ["chidi_ng", "Chidi Okafor", "Nigeria", "Oyo", "Ibadan", "Food crop growing", "cassava, maize", 7.38, 3.93],
  ["naledi_za", "Naledi Mokoena", "South Africa", "Gauteng", "Pretoria", "Urban food gardens", "spinach, peppers", -25.75, 28.19],
  ["kavya_in", "Kavya Nair", "India", "Kerala", "Kochi", "Organic growing", "rice, spices", 9.93, 76.27],
  ["sita_np", "Sita Thapa", "Nepal", "Gandaki", "Pokhara", "Terrace farming", "millet, vegetables", 28.21, 83.99],
  ["mei_cn", "Mei Lin", "China", "Zhejiang", "Hangzhou", "Smart greenhouse growing", "tea, leafy greens", 30.27, 120.16],
  ["haru_jp", "Haru Sato", "Japan", "Kyoto", "Kyoto", "Small scale growing", "rice, herbs", 35.01, 135.77],
  ["putri_id", "Putri Lestari", "Indonesia", "West Java", "Bandung", "Agroecology", "rice, chilies", -6.91, 107.61],
  ["mia_au", "Mia Thompson", "Australia", "Victoria", "Melbourne", "Sustainable growing", "berries, vegetables", -37.81, 144.96],
  ["hana_nz", "Hana Williams", "New Zealand", "Waikato", "Hamilton", "Community growing", "kiwifruit, greens", -37.79, 175.28],
] as const;

export async function ensureExampleGrowers() {
  const existing = await db().prepare("SELECT COUNT(*) AS count FROM users WHERE id LIKE 'example-grower-%'").first<{ count: number }>();
  if ((existing?.count ?? 0) >= growers.length) return;
  await db().batch(growers.map(([key, name, country, region, city, focus, crops, latitude, longitude]) =>
    db().prepare(`INSERT OR IGNORE INTO users
      (id,email,password_hash,password_salt,display_name,username,farmer_type,country,region,city,bio,crops,experience,preferred_language,map_visible,latitude,longitude,created_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .bind(`example-grower-${key}`, `${key}@example.invalid`, "example-account-disabled", "example-account-disabled",
        name, `eg_${key}`, focus, country, region, city,
        `Fictional example profile showing a grower in ${city}, ${country}. This account cannot receive messages or reply.`,
        crops, "Example profile", "en", 1, latitude, longitude, "2026-01-01T00:00:00.000Z")));
}
