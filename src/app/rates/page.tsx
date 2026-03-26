import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { RatesManager } from "./rates-manager";

async function getRates() {
  return prisma.ratesLibrary.findMany({ orderBy: [{ category: "asc" }, { name: "asc" }] });
}

export default async function RatesPage() {
  const rates = await getRates();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rates Library"
        description="Manage standard pricing and rates. These inform AI quote assistance."
      />
      <RatesManager initialRates={rates} />
    </div>
  );
}
