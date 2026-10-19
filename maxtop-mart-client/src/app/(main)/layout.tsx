import Header from "@/components/layout/Header/Header";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import NewFooter from "@/components/layout/Footer/NewFooter";

export default function MainLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <>
            <Header />
            <main className="pb-[58px] sm:pb-0">
                {children}
            </main>
            <NewFooter />
            <MobileBottomNav />
        </>
    );
}
