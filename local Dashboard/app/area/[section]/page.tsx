import { notFound } from "next/navigation";

import { isSection } from "@/lib/data";
import Dashboard from "@/app/ui/dashboard";

type Props = {
  params: Promise<{ section: string }>;
  searchParams: Promise<{ customer?: string; kpi?: string }>;
};

export default async function AreaPage({ params, searchParams }: Props) {
  const { section } = await params;
  if (!isSection(section)) notFound();

  const { customer, kpi } = await searchParams;
  return <Dashboard view="area" section={section} customer={customer} kpi={kpi} />;
}
