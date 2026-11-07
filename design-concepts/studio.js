window.STUDIO = {
  salon: "Jeannie Nagelstudio",
  city: "Hamburg",
  dateLabel: "Montag, 9. November",
  staff: [
    { id: "mira", name: "Mira", shift: ["09:00", "18:00"] },
    { id: "klara", name: "Klara", shift: ["10:00", "18:00"] },
    { id: "sophie", name: "Sophie", shift: ["09:00", "17:00"] },
    { id: "hannah", name: "Hannah", shift: ["09:00", "18:00"] },
    { id: "lea", name: "Lea", shift: ["09:00", "18:00"] },
    { id: "nora", name: "Nora", shift: ["12:00", "20:00"] },
    { id: "jonas", name: "Jonas", shift: ["09:00", "18:00"] },
    { id: "emil", name: "Emil", shift: ["09:00", "16:00"] },
    { id: "thea", name: "Thea", shift: ["10:00", "19:00"] },
    { id: "paul", name: "Paul", shift: ["09:00", "18:00"] },
  ],
  appointments: [
    ["mira", "09:00", 75, "Anna Berger", "Shellac Natur", "shellac"],
    ["mira", "11:00", 60, "Ida Krüger", "Maniküre Klassik", "mani"],
    ["mira", "13:30", 90, "Mara Lind", "Gel Auffüllung", "gel"],
    ["mira", "16:00", 45, "Jule Hansen", "French", "french"],
    ["klara", "10:00", 90, "Pia Berger", "Gel Auffüllung", "gel"],
    ["klara", "12:00", 45, "Tom Adler", "Shellac Natur", "shellac"],
    ["klara", "14:15", 75, "Nele Vogt", "Pediküre", "pedi"],
    ["sophie", "09:15", 60, "Romy Falk", "Maniküre Klassik", "mani"],
    ["sophie", "11:30", 90, "Lina Ott", "Gel Auffüllung", "gel"],
    ["sophie", "14:00", 60, "Mats Berger", "Shellac Natur", "shellac"],
    ["hannah", "09:00", 45, "Eva Holm", "French", "french"],
    ["hannah", "10:30", 75, "Sara Nguyen", "Pediküre", "pedi"],
    ["hannah", "13:00", 60, "Kim Albrecht", "Maniküre Klassik", "mani"],
    ["hannah", "15:30", 75, "Juna Beck", "Gel Auffüllung", "gel"],
    ["lea", "09:00", 90, "Mila König", "Gel Auffüllung", "gel"],
    ["lea", "12:30", 60, "Helena Vogt", "Shellac Natur", "shellac"],
    ["lea", "15:00", 75, "Rita Paul", "Pediküre", "pedi"],
    ["nora", "12:00", 75, "Anni Sol", "Maniküre Klassik", "mani"],
    ["nora", "14:30", 90, "Greta Fink", "Gel Auffüllung", "gel"],
    ["nora", "17:00", 60, "Lotta Heim", "French", "french"],
    ["jonas", "09:30", 60, "Benno Kraft", "Shellac Natur", "shellac"],
    ["jonas", "11:15", 75, "Oda Merz", "Pediküre", "pedi"],
    ["jonas", "14:00", 45, "Nils Hart", "French", "french"],
    ["jonas", "16:15", 60, "Tilde Rom", "Maniküre Klassik", "mani"],
    ["emil", "09:00", 60, "Kian Vogel", "Maniküre Klassik", "mani"],
    ["emil", "11:00", 90, "Mara Eck", "Gel Auffüllung", "gel"],
    ["emil", "14:00", 60, "Jo Ost", "Shellac Natur", "shellac"],
    ["thea", "10:15", 75, "Fine Abel", "Pediküre", "pedi"],
    ["thea", "13:00", 60, "Luzie Brandt", "French", "french"],
    ["thea", "15:30", 90, "Hedi Lang", "Gel Auffüllung", "gel"],
    ["paul", "09:00", 45, "Uwe Klein", "French", "french"],
    ["paul", "10:45", 75, "Mia Cordes", "Shellac Natur", "shellac"],
    ["paul", "13:15", 60, "Lars Bode", "Maniküre Klassik", "mani"],
    ["paul", "15:45", 75, "Ines Roth", "Pediküre", "pedi"],
  ].map(([staff, start, dur, customer, service, tone]) => ({ staff, start, dur, customer, service, tone })),
};

window.minutes = (value) => {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
};

window.clock = (total) => {
  const hour = Math.floor(total / 60);
  const minute = total % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
};
