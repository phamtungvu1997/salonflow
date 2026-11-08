import postgres from "postgres";
import { databaseUrl, startLocalPostgres } from "./postgres-local.mjs";

await startLocalPostgres();
const sql = postgres(databaseUrl(), { max: 1 });
const salonId = "salon_jeannie";

await sql`UPDATE services SET active = false WHERE name ~ '^Shellac [0-9]+$' OR name LIKE '%Test%'`;
await sql`DELETE FROM calendar_events WHERE description LIKE 'Team-Briefing%'`.catch(() => {});
await sql`DELETE FROM idempotency_keys WHERE appointment_id IS NOT NULL AND appointment_id NOT LIKE 'appt_demo_%'`.catch(() => {});
await sql`DELETE FROM appointment_audit WHERE appointment_id NOT LIKE 'appt_demo_%'`.catch(() => {});
await sql`DELETE FROM resource_allocations WHERE appointment_id IS NOT NULL AND appointment_id NOT LIKE 'appt_demo_%'`.catch(() => {});
await sql`DELETE FROM appointment_services WHERE appointment_id NOT LIKE 'appt_demo_%'`.catch(() => {});
await sql`DELETE FROM appointments WHERE id NOT LIKE 'appt_demo_%'`.catch(() => {});
await sql`DELETE FROM customers WHERE id LIKE 'cust_%-%' AND id NOT IN (SELECT DISTINCT customer_id FROM appointments WHERE customer_id IS NOT NULL)`.catch(() => {});

const harness = await sql`
  SELECT id FROM staff
  WHERE display_name ~ '^Eva [0-9]+$' OR display_name LIKE 'Test %'
`;
for (const row of harness) {
  await sql`UPDATE resource_allocations SET active = false WHERE resource_id IN (SELECT id FROM resources WHERE staff_id = ${row.id})`;
  await sql`DELETE FROM weekly_shifts WHERE staff_id = ${row.id}`;
  await sql`DELETE FROM staff_services WHERE staff_id = ${row.id}`;
  await sql`DELETE FROM staff_salon_assignments WHERE staff_id = ${row.id}`;
  await sql`UPDATE staff SET active = false, display_name = ${`Archiv ${row.id.slice(-4)}`} WHERE id = ${row.id}`;
}
await sql`DELETE FROM absences WHERE reason LIKE 'Fortbildung Nageldesign%'`.catch(() => {});
await sql`DELETE FROM user_salon_roles WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'leitung.%@salonflow.local')`.catch(() => {});
await sql`DELETE FROM users WHERE email LIKE 'leitung.%@salonflow.local'`.catch(() => {});

const roster = [
  ["staff_anna", "Anna Vogel", "#f7c59f"],
  ["staff_clara", "Clara Hartmann", "#d7c4f2"],
  ["staff_david", "David König", "#f6c9d0"],
  ["staff_emma", "Emma Wolf", "#f6d7a8"],
  ["staff_julia", "Julia Krüger", "#c5d4f0"],
  ["staff_lena", "Lena Berger", "#f4b6c2"],
  ["staff_mia", "Mia Weber", "#f5cbd4"],
  ["staff_mira", "Mira Schulz", "#c9b6e4"],
  ["staff_nora", "Nora Klein", "#b7d7c9"],
  ["staff_thuy", "Thuy Nguyen", "#f3d1dc"],
  ["staff_tommy", "Tommy Becker", "#dec9f2"],
];

for (const [id, name, color] of roster) {
  await sql`
    INSERT INTO staff (id, display_name, color)
    VALUES (${id}, ${name}, ${color})
    ON CONFLICT (id) DO UPDATE SET display_name = EXCLUDED.display_name, color = EXCLUDED.color
  `;
  await sql`
    INSERT INTO staff_salon_assignments (id, staff_id, salon_id, active)
    VALUES (${`asg_${id}`}, ${id}, ${salonId}, true)
    ON CONFLICT (id) DO NOTHING
  `;
  await sql`
    INSERT INTO resources (id, resource_type, staff_id, active)
    VALUES (${`res_${id}`}, 'staff', ${id}, true)
    ON CONFLICT (id) DO NOTHING
  `;
  for (let weekday = 1; weekday <= 6; weekday += 1) {
    await sql`
      INSERT INTO weekly_shifts (id, staff_id, salon_id, iso_weekday, start_minute, end_minute)
      VALUES (${`shift_${id}_${weekday}`}, ${id}, ${salonId}, ${weekday}, ${9 * 60}, ${19 * 60})
      ON CONFLICT (id) DO UPDATE SET start_minute = EXCLUDED.start_minute, end_minute = EXCLUDED.end_minute
    `;
  }
}

// Emma Wolf Sunday shift (13:00 - 18:45) matching the reference video Sunday state
await sql`
  INSERT INTO weekly_shifts (id, staff_id, salon_id, iso_weekday, start_minute, end_minute)
  VALUES ('shift_staff_emma_7', 'staff_emma', ${salonId}, 7, ${13 * 60}, ${18 * 60 + 45})
  ON CONFLICT (id) DO UPDATE SET start_minute = EXCLUDED.start_minute, end_minute = EXCLUDED.end_minute
`;

for (const sId of ["salon_jeannie", "salon_juliet", "salon_heide"]) {
  await sql`
    INSERT INTO salon_settings (salon_id)
    VALUES (${sId})
    ON CONFLICT (salon_id) DO NOTHING
  `;
}

await sql`
  INSERT INTO users (id, email, display_name, status, password_hash)
  VALUES ('user_reception', 'empfang@salonflow.local', 'Mitarbeiter Empfang', 'active', 'dev:SalonFlow!2026')
  ON CONFLICT (id) DO UPDATE SET display_name = EXCLUDED.display_name, status = 'active'
`;
await sql`
  INSERT INTO user_salon_roles (user_id, salon_id, role)
  VALUES ('user_reception', ${salonId}, 'receptionist')
  ON CONFLICT DO NOTHING
`;

const categories = [
  ["cat_mani", "Maniküre", "#f9a8d4", 1],
  ["cat_pedi", "Pediküre", "#93c5fd", 2],
  ["cat_shellac", "Shellac", "#fdba74", 3],
  ["cat_gel", "Gel & BIAB (vegan)", "#c4b5fd", 4],
  ["cat_acryl", "Acryl & Neumodellage", "#86efac", 5],
];
for (const [catId, catName, catColor, sortOrder] of categories) {
  await sql`
    INSERT INTO service_categories (id, name, color, salon_id, sort_order)
    VALUES (${catId}, ${catName}, ${catColor}, ${salonId}, ${sortOrder})
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      color = EXCLUDED.color,
      salon_id = EXCLUDED.salon_id,
      sort_order = EXCLUDED.sort_order
  `;
}

const services = [
  ["svc_mani", "Maniküre", 45, 3500, "cat_mani"],
  ["svc_mani_classic", "Maniküre mit Nagellack", 50, 4200, "cat_mani"],
  ["svc_pedi", "Pediküre", 60, 4500, "cat_pedi"],
  ["svc_spa_pedi", "Spa Pediküre mit Fußmassage", 75, 5800, "cat_pedi"],
  ["svc_shellac", "Shellac", 60, 4200, "cat_shellac"],
  ["svc_shellac_french", "Shellac French / Babyboomer", 65, 4900, "cat_shellac"],
  ["svc_biab", "BIAB Naturnagelverstärkung", 60, 5200, "cat_gel"],
  ["svc_gel_refill", "Gel Auffüllen inkl. Farbe", 75, 5500, "cat_gel"],
  ["svc_acryl_neu", "Acryl Neumodellage mit Verlängerung", 90, 6800, "cat_acryl"],
];
for (const [id, name, duration, price, categoryId] of services) {
  await sql`
    INSERT INTO services (id, category_id, name, active)
    VALUES (${id}, ${categoryId}, ${name}, true)
    ON CONFLICT (id) DO UPDATE SET category_id = EXCLUDED.category_id, name = EXCLUDED.name
  `;
  await sql`
    INSERT INTO salon_services (salon_id, service_id, duration_minutes, price_cents, active)
    VALUES (${salonId}, ${id}, ${duration}, ${price}, true)
    ON CONFLICT (salon_id, service_id) DO NOTHING
  `;
  for (const [staffId] of roster) {
    await sql`
      INSERT INTO staff_services (staff_id, service_id)
      VALUES (${staffId}, ${id})
      ON CONFLICT DO NOTHING
    `;
  }
}

const customers = [
  ["cust_amira", "Amira Büchel", "Amira", "Büchel", "female", "1994-03-14", "+49 1573 2125001", "amira.buechel@example.test", "22303", "12", "Borgweg", "Hamburg", ["Favorit"], "Bevorzugt helle Nude-Töne (BIAB).", true],
  ["cust_alina", "Alina Euler", "Alina", "Euler", "female", "1998-07-22", "+49 1511 9791002", "alina.euler@example.test", "20249", "44", "Eppendorfer Baum", "Hamburg", [], null, true],
  ["cust_celia", "Celia Mattern", "Celia", "Mattern", "female", "1991-11-05", "+49 176 48201003", "celia.mattern@example.test", "22085", "8", "Uhlenhorster Weg", "Hamburg", ["Favorit"], "Immer mit Nagelhautpflege.", true],
  ["cust_diana", "Diana Lindner", "Diana", "Lindner", "female", "1989-02-19", "+49 160 91821004", "diana.lindner@example.test", "22301", "21", "Dorotheenstraße", "Hamburg", [], null, false],
  ["cust_elena", "Elena Richter", "Elena", "Richter", "female", "1995-09-30", "+49 152 31990205", "elena.richter@example.test", "20146", "5", "Rothenbaumchaussee", "Hamburg", [], null, true],
  ["cust_franziska", "Franziska Voigt", "Franziska", "Voigt", "female", "1993-12-11", "+49 172 64051006", "franziska.voigt@example.test", "22299", "19", "Mühlenkamp", "Hamburg", [], "Reagiert empfindlich auf Aceton.", true],
  ["cust_greta", "Greta Baumann", "Greta", "Baumann", "female", "2000-04-08", "+49 151 55021007", "greta.baumann@example.test", "20354", "3", "Neuer Wall", "Hamburg", [], null, false],
  ["cust_hannah", "Hannah Becker", "Hannah", "Becker", "female", "1992-06-17", "+49 152 31990202", "hannah.becker@example.test", "22303", "7", "Barmbeker Straße", "Hamburg", ["Favorit"], "Stammkundin bei Lena & Julia.", true],
  ["cust_ines", "Ines Krämer", "Ines", "Krämer", "female", "1987-08-25", "+49 171 33491009", "ines.kraemer@example.test", "22305", "62", "Fuhlsbüttler Straße", "Hamburg", [], null, true],
  ["cust_jana", "Jana Seidel", "Jana", "Seidel", "female", "1996-01-14", "+49 157 88231010", "jana.seidel@example.test", "22083", "15", "Mozartstraße", "Hamburg", [], null, false],
  ["cust_klara", "Klara Beispiel", "Klara", "Beispiel", "female", "1990-05-12", "+49 151 23450101", "klara.beispiel@example.test", "22303", "3", "Borgweg", "Hamburg", ["Favorit"], "Wünscht French Gel-Design und Kräutertee.", true],
  ["cust_lea", "Lea Neumann", "Lea", "Neumann", "female", "1997-10-03", "+49 152 31990203", "lea.neumann@example.test", "22297", "28", "Alsterdorfer Straße", "Hamburg", [], null, true],
  ["cust_marie", "Marie Hoffmann", "Marie", "Hoffmann", "female", "1994-07-19", "+49 152 31990204", "marie.hoffmann@example.test", "20251", "11", "Haynstraße", "Hamburg", ["Favorit"], null, true],
  ["cust_mira_s", "Mira Sommer", "Mira", "Sommer", "female", "1999-03-27", "+49 151 0000000", "mira.sommer@example.test", "22303", "14", "Wiesendamm", "Hamburg", [], null, false],
  ["cust_nina", "Nina Albrecht", "Nina", "Albrecht", "female", "1991-11-29", "+49 176 99121015", "nina.albrecht@example.test", "22087", "9", "Hofweg", "Hamburg", [], null, true],
  ["cust_nora", "Nora Hartmann", "Nora", "Hartmann", "female", "1993-04-16", "+49 151 23450102", "nora.hartmann@example.test", "22301", "33", "Poelchaukamp", "Hamburg", ["Favorit"], "Bitte 5 Min. Puffer für Nail-Art einplanen.", true],
  ["cust_paula", "Paula Brandt", "Paula", "Brandt", "female", "1996-08-09", "+49 162 44181017", "paula.brandt@example.test", "20148", "18", "Mittelweg", "Hamburg", [], null, false],
  ["cust_sophie", "Sophie Wagner", "Sophie", "Wagner", "female", "1992-01-23", "+49 152 31990201", "sophie.wagner@example.test", "22303", "10", "Jarrestraße", "Hamburg", ["Favorit"], "Shellac Rose-Nude #14.", true],
  ["cust_tabea", "Tabea Lorenz", "Tabea", "Lorenz", "female", "1995-12-02", "+49 151 77341019", "tabea.lorenz@example.test", "22089", "41", "Eilbeker Weg", "Hamburg", [], null, true],
  ["cust_walkin", "Walk-in", "Walk-in", "", "unknown", null, null, null, null, null, null, null, [], null, false],
];
for (const [
  id,
  name,
  firstName,
  lastName,
  gender,
  birthDate,
  phone,
  email,
  postalCode,
  houseNumber,
  addressLine,
  city,
  labels,
  additionalInfo,
  newsletterOptIn,
] of customers) {
  await sql`
    INSERT INTO customers (
      id, display_name, first_name, last_name, gender, birth_date,
      phone_normalized, email, postal_code, house_number, address_line, city,
      labels, additional_info, newsletter_opt_in, home_salon_id
    )
    VALUES (
      ${id}, ${name}, ${firstName || null}, ${lastName || null}, ${gender}, ${birthDate},
      ${phone}, ${email}, ${postalCode}, ${houseNumber}, ${addressLine}, ${city},
      ${labels}, ${additionalInfo}, ${newsletterOptIn}, ${salonId}
    )
    ON CONFLICT (id) DO UPDATE SET
      display_name = EXCLUDED.display_name,
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name,
      gender = EXCLUDED.gender,
      birth_date = EXCLUDED.birth_date,
      phone_normalized = COALESCE(EXCLUDED.phone_normalized, customers.phone_normalized),
      email = COALESCE(EXCLUDED.email, customers.email),
      postal_code = EXCLUDED.postal_code,
      house_number = EXCLUDED.house_number,
      address_line = EXCLUDED.address_line,
      city = EXCLUDED.city,
      labels = EXCLUDED.labels,
      additional_info = COALESCE(EXCLUDED.additional_info, customers.additional_info),
      newsletter_opt_in = EXCLUDED.newsletter_opt_in,
      archived_at = NULL
  `;
}

const samples = [
  // Monday 2026-11-09
  ["appt_demo_1", "staff_lena", "cust_klara", "svc_shellac", "Shellac", 60, 4200, "2026-11-09T09:00:00+01:00", "2026-11-09T10:00:00+01:00"],
  ["appt_demo_2", "staff_mira", "cust_nora", "svc_mani", "Maniküre", 45, 3500, "2026-11-09T10:15:00+01:00", "2026-11-09T11:00:00+01:00"],
  ["appt_demo_3", "staff_anna", "cust_walkin", "svc_pedi", "Pediküre", 60, 4500, "2026-11-09T13:00:00+01:00", "2026-11-09T14:00:00+01:00"],
  ["appt_demo_4", "staff_lena", "cust_sophie", "svc_shellac", "Shellac", 60, 4200, "2026-11-09T12:00:00+01:00", "2026-11-09T13:00:00+01:00"],
  ["appt_demo_5", "staff_julia", "cust_hannah", "svc_shellac", "Shellac", 60, 4200, "2026-11-09T15:00:00+01:00", "2026-11-09T16:00:00+01:00"],
  ["appt_demo_6", "staff_julia", "cust_lea", "svc_mani", "Maniküre", 45, 3500, "2026-11-09T16:00:00+01:00", "2026-11-09T16:45:00+01:00"],
  ["appt_demo_7", "staff_nora", "cust_mira_s", "svc_mani", "Maniküre", 45, 3500, "2026-11-09T15:00:00+01:00", "2026-11-09T15:45:00+01:00"],
  ["appt_demo_8", "staff_tommy", "cust_marie", "svc_shellac", "Shellac", 60, 4200, "2026-11-09T10:00:00+01:00", "2026-11-09T11:00:00+01:00"],
  ["appt_demo_9", "staff_mia", "cust_sophie", "svc_pedi", "Pediküre", 60, 4500, "2026-11-09T11:00:00+01:00", "2026-11-09T12:00:00+01:00"],

  // Tuesday 2026-11-10
  ["appt_demo_10", "staff_lena", "cust_marie", "svc_shellac", "Shellac", 60, 4200, "2026-11-10T10:00:00+01:00", "2026-11-10T11:00:00+01:00"],
  ["appt_demo_11", "staff_anna", "cust_klara", "svc_mani", "Maniküre", 45, 3500, "2026-11-10T11:30:00+01:00", "2026-11-10T12:15:00+01:00"],
  ["appt_demo_12", "staff_julia", "cust_nora", "svc_pedi", "Pediküre", 60, 4500, "2026-11-10T14:00:00+01:00", "2026-11-10T15:00:00+01:00"],

  // Wednesday 2026-11-11
  ["appt_demo_13", "staff_lena", "cust_hannah", "svc_shellac", "Shellac", 60, 4200, "2026-11-11T10:00:00+01:00", "2026-11-11T11:00:00+01:00"],
  ["appt_demo_14", "staff_david", "cust_walkin", "svc_mani", "Maniküre", 45, 3500, "2026-11-11T15:00:00+01:00", "2026-11-11T15:45:00+01:00"],
  ["appt_demo_15", "staff_mia", "cust_lea", "svc_shellac", "Shellac", 60, 4200, "2026-11-11T15:00:00+01:00", "2026-11-11T16:00:00+01:00"],

  // Thursday 2026-11-12
  ["appt_demo_16", "staff_lena", "cust_sophie", "svc_shellac", "Shellac", 60, 4200, "2026-11-12T10:00:00+01:00", "2026-11-12T11:00:00+01:00"],
  ["appt_demo_17", "staff_mira", "cust_marie", "svc_pedi", "Pediküre", 60, 4500, "2026-11-12T13:00:00+01:00", "2026-11-12T14:00:00+01:00"],

  // Friday 2026-11-13
  ["appt_demo_18", "staff_anna", "cust_klara", "svc_mani", "Maniküre", 45, 3500, "2026-11-13T13:30:00+01:00", "2026-11-13T14:15:00+01:00"],
  ["appt_demo_19", "staff_tommy", "cust_nora", "svc_shellac", "Shellac", 60, 4200, "2026-11-13T16:00:00+01:00", "2026-11-13T17:00:00+01:00"],

  // Saturday 2026-11-14
  ["appt_demo_20", "staff_lena", "cust_lea", "svc_mani", "Maniküre", 45, 3500, "2026-11-14T10:00:00+01:00", "2026-11-14T10:45:00+01:00"],
  ["appt_demo_21", "staff_julia", "cust_hannah", "svc_shellac", "Shellac", 60, 4200, "2026-11-14T11:00:00+01:00", "2026-11-14T12:00:00+01:00"],
];

for (const [id, staffId, customerId, , title, duration, price, start, end] of samples) {
  const overlap = await sql`
    SELECT 1 FROM resource_allocations
    WHERE resource_id = ${`res_${staffId}`}
      AND active
      AND period && tstzrange(${start}::timestamptz, ${end}::timestamptz, '[)')
  `;
  if (overlap.length > 0) continue;
  await sql`
    INSERT INTO appointments (id, salon_id, customer_id, status, source, version, start_at, end_at)
    VALUES (${id}, ${salonId}, ${customerId}, 'booked', 'internal', 1, ${start}, ${end})
    ON CONFLICT (id) DO NOTHING
  `;
  await sql`
    INSERT INTO appointment_services (
      id, appointment_id, sequence, staff_id, title_snapshot, duration_minutes_snapshot, price_cents_snapshot
    ) VALUES (${`item_${id}`}, ${id}, 1, ${staffId}, ${title}, ${duration}, ${price})
    ON CONFLICT (id) DO NOTHING
  `;
  await sql`
    INSERT INTO resource_allocations (id, resource_id, appointment_id, start_at, end_at, active)
    VALUES (${`alloc_${id}`}, ${`res_${staffId}`}, ${id}, ${start}, ${end}, true)
    ON CONFLICT (id) DO NOTHING
  `;
}

// Sample unavailability blocks matching the reference video ("Julia is not available")
const demoAbsences = [
  ["abs_demo_julia_1", "staff_julia", "2026-11-09T10:00:00+01:00", "2026-11-09T10:45:00+01:00", "Auffüllen mit Vegan-Gel"],
  ["abs_demo_david_1", "staff_david", "2026-11-09T13:00:00+01:00", "2026-11-09T13:45:00+01:00", "Pause / interner Block"],
];
for (const [id, staffId, startsAt, endsAt, reason] of demoAbsences) {
  await sql`
    INSERT INTO absences (id, staff_id, salon_id, starts_at, ends_at, reason)
    VALUES (${id}, ${staffId}, ${salonId}, ${startsAt}, ${endsAt}, ${reason})
    ON CONFLICT (id) DO NOTHING
  `;
}

await sql.end();
console.log("seeded fictional Jeannie day roster (Mon–Sat 09:00–19:00; Emma Sunday 13:00–18:45)");
