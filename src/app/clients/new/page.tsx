import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { ClientForm } from "@/components/forms/client-form";

export default function NewClientPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader
        title="New Client"
        description="Add a new client to the directory. Save on first click — no second confirmation required."
      />
      <Card>
        <CardContent className="pt-6">
          <ClientForm />
        </CardContent>
      </Card>
    </div>
  );
}
