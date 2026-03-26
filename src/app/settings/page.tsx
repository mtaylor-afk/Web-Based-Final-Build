import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { SettingsForm } from "./settings-form";

async function getSettings() {
  let settings = await prisma.settings.findFirst();
  if (!settings) {
    settings = await prisma.settings.create({ data: { id: "singleton" } });
  }
  return settings;
}

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader title="Settings" description="Company information and system defaults" />
      <SettingsForm initialSettings={settings} />
    </div>
  );
}
