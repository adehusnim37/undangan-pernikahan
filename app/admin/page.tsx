import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/admin-dashboard";
import { isAdmin } from "@/lib/auth";

export default async function AdminPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  return <AdminDashboard />;
}
