import { TopNavShell } from "@/components/layout/top-nav-shell";

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: "Cairo, sans-serif" }}>
      <TopNavShell />
      <main className="flex-1">{children}</main>
    </div>
  );
}
