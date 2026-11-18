import { PublicBookingApp } from "@/features/online-booking/public-booking-app";

export default async function PublicBookingEmbedPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <PublicBookingApp token={token} embedded={true} />;
}
