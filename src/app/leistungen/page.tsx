import { redirect } from "next/navigation";

export default function LeistungenPage() {
  redirect("/einstellungen?section=services");
}
