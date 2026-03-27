import { redirect } from "next/navigation";

export default function DashboardLayoutRedirectPage() {
  redirect("/dashboard/desktop-bridge");
}
