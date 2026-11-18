import type { SettingsSectionId } from "@/features/settings/settings-types";
import { SettingsWorkspace } from "@/features/settings/settings-workspace";

export default async function EinstellungenPage({
  searchParams,
}: {
  searchParams?: Promise<{ section?: string | string[] }>;
}) {
  const params = searchParams ? await searchParams : {};
  const rawSection = Array.isArray(params.section) ? params.section[0] : params.section;
  return <SettingsWorkspace initialSection={rawSection as SettingsSectionId | undefined} />;
}
