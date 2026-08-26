import Dashboard from "./ui/dashboard";

type Props = { searchParams: Promise<{ customer?: string }> };

export default async function OverviewPage({ searchParams }: Props) {
  const { customer } = await searchParams;
  return <Dashboard view="overview" customer={customer} />;
}
