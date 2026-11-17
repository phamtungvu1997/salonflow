import { PublicBookingApp } from "@/features/online-booking/public-booking-app";

export default async function PublicBookingLinkPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <PublicBookingApp token={token} embedded={false} />;
}
