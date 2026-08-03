import Navbar from "@/components/Navbar";
import UserSidebar from "@/components/UserSidebar";

type AuthenticatedLayoutProps = {
  children: React.ReactNode;
};

export default function AuthenticatedLayout({
  children,
}: AuthenticatedLayoutProps) {
  return (
    <div className="min-h-screen bg-background md:flex">
      <UserSidebar />

      <div className="min-w-0 flex-1">
        <Navbar hideBrand />

        {children}
      </div>
    </div>
  );
}