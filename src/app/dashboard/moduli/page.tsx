import { redirect } from "next/navigation";

export default function DashboardModulesRedirectPage() {
  redirect("/app/profile/modules");
}
