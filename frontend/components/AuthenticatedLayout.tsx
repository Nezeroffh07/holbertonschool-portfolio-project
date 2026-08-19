import Navbar from "@/components/Navbar";
import UserSidebar from "@/components/UserSidebar";
import Footer from "@/components/Footer";

type AuthenticatedLayoutProps = {
  children: React.ReactNode;
};

export default function AuthenticatedLayout({
  children,
}: AuthenticatedLayoutProps) {
  return (
    <div className="min-h-screen bg-background md:flex">
      <UserSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar hideBrand />

        <div className="flex-1">{children}</div>

        <Footer />
      </div>
    </div>
  );
}
