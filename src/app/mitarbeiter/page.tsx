import { redirect } from "next/navigation";

export default function MitarbeiterPage() {
  redirect("/einstellungen?section=employees");
}
