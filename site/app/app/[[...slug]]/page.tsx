import { redirect } from "next/navigation";
import { getPageUser, publicFarmer } from "@/lib/server";
import Dashboard from "@/components/dashboard";

export const dynamic = "force-dynamic";

export default async function AppPage({ params, searchParams }: {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await getPageUser();
  if (!user) redirect("/auth.html");
  const slug = (await params).slug ?? [];
  const query = (await searchParams).q ?? "";
  return <Dashboard me={publicFarmer(user, true)} view={slug[0] ?? "home"} target={slug[1] ?? ""} initialQuery={query} />;
}
