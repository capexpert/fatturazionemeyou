import { PageHeader } from "@/components/page-header";
import { CompanyForm } from "@/components/forms/company-form";
import { getCompanyProfile } from "@/lib/data";

export default async function SettingsPage() {
  const company = await getCompanyProfile();

  return (
    <>
      <PageHeader title="Settings" />
      <CompanyForm company={company} />
    </>
  );
}
