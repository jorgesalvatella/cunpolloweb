import type { ReactNode } from "react";

export const metadata = {
  title: "CUNPOLLO Admin",
  robots: "noindex, nofollow",
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}
