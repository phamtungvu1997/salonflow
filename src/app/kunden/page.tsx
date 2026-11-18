import { CustomerAdmin } from "@/features/customers/customer-admin";

export default async function KundenPage({
  searchParams,
}: {
  searchParams?: Promise<{ kunde?: string | string[] }>;
}) {
  const params = searchParams ? await searchParams : {};
  const kunde = Array.isArray(params.kunde) ? params.kunde[0] : params.kunde;
  return (
    <div data-testid="page-kunden">
      <CustomerAdmin initialProfileId={kunde ?? null} />
    </div>
  );
}
