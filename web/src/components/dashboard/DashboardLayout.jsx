import { Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function DashboardLayout() {
  const { user } = useSelector((state) => state.auth);

  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-[var(--app-text)]">
      <div className="flex min-h-screen">
        <Sidebar user={user} />

        <div className="min-w-0 flex-1">
          <Topbar user={user} />

          <main className="px-5 py-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}