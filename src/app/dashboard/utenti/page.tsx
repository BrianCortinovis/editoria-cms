import { redirect } from "next/navigation";

export default function DashboardTeamRedirectPage() {
  redirect("/app/profile/team");
}
