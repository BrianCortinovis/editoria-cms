import { redirect } from "next/navigation";

export default function DashboardConfigRedirectPage() {
  redirect("/app/profile/site");
}
