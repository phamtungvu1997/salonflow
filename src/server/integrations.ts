import type { Db } from "@/server/db";
import { BookingError } from "@/server/time";

export const INTEGRATION_CHANNELS = [
  {
    id: "whatsapp",
    name: "WhatsApp Business",
    simulator: true,
    note: "Gespräche laufen im Kundendialog. Es wird nichts an WhatsApp gesendet.",
  },
  {
    id: "instagram",
    name: "Instagram Direct",
    simulator: true,
    note: "Gleicher Schalter wie die anderen Kanäle. Instagram selbst bleibt getrennt.",
  },
  {
    id: "tiktok",
    name: "TikTok Direct",
    simulator: true,
    note: "Der Simulator nimmt die Nachricht an. TikTok wird nicht angebunden.",
  },
  {
    id: "email",
    name: "E-Mail",
    simulator: true,
    note: "Eingehende Demo-Mails landen im Kundendialog. Es geht keine Mail hinaus.",
  },
  {
    id: "messenger",
    name: "Facebook Messenger",
    simulator: false,
    note: "Messenger hat noch keinen Simulator. Eine Verbindung ist nicht möglich.",
  },
  {
    id: "phone",
    name: "Telefonie",
    simulator: false,
    note: "Anrufe werden nicht angenommen. Der Kanal bleibt sichtbar, aber aus.",
  },
] as const;

export type IntegrationChannelId = (typeof INTEGRATION_CHANNELS)[number]["id"];

export type IntegrationChannelState = {
  id: IntegrationChannelId;
  name: string;
  note: string;
  simulatorSupported: boolean;
  simulatorEnabled: boolean;
  liveEnabled: false;
  liveLocked: true;
};

const SUPPORTED = new Set(
  INTEGRATION_CHANNELS.filter((channel) => channel.simulator).map((channel) => channel.id),
);

async function ensure(sql: Db) {
  await sql`
    CREATE TABLE IF NOT EXISTS salon_channels (
      salon_id text NOT NULL,
      channel text NOT NULL,
      simulator_enabled boolean NOT NULL DEFAULT true,
      updated_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (salon_id, channel)
    )
  `;
}

export function isSimulatorChannel(channel: string): channel is IntegrationChannelId {
  return SUPPORTED.has(channel as IntegrationChannelId);
}

export async function loadIntegrations(sql: Db, salonId: string) {
  await ensure(sql);
  const rows = await sql<{ channel: string; simulator_enabled: boolean }[]>`
    SELECT channel, simulator_enabled
    FROM salon_channels
    WHERE salon_id = ${salonId}
  `;
  const saved = new Map(rows.map((row) => [row.channel, row.simulator_enabled]));
  const channels: IntegrationChannelState[] = INTEGRATION_CHANNELS.map((channel) => ({
    id: channel.id,
    name: channel.name,
    note: channel.note,
    simulatorSupported: channel.simulator,
    simulatorEnabled: channel.simulator ? (saved.get(channel.id) ?? true) : false,
    liveEnabled: false,
    liveLocked: true,
  }));
  return { channels };
}

export async function setChannelSimulator(
  sql: Db,
  salonId: string,
  channel: string,
  simulatorEnabled: boolean,
) {
  if (!isSimulatorChannel(channel)) {
    throw new BookingError(422, "channel_locked", "Dieser Kanal kann nicht eingeschaltet werden.");
  }
  await ensure(sql);
  await sql`
    INSERT INTO salon_channels (salon_id, channel, simulator_enabled)
    VALUES (${salonId}, ${channel}, ${simulatorEnabled})
    ON CONFLICT (salon_id, channel)
    DO UPDATE SET simulator_enabled = EXCLUDED.simulator_enabled, updated_at = now()
  `;
  return loadIntegrations(sql, salonId);
}

export async function assertChannelSimulatorEnabled(sql: Db, salonId: string, channel: string) {
  const desk = await loadIntegrations(sql, salonId);
  const row = desk.channels.find((item) => item.id === channel);
  if (!row?.simulatorEnabled) {
    throw new BookingError(
      403,
      "channel_off",
      "Dieser Kanal ist für den Salon ausgeschaltet. Schalten Sie ihn unter Integrationen ein.",
    );
  }
}
