import FrontPage from "@/components/FrontPage";
import { PricingTable } from '@clerk/nextjs'

export default function Home() {

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <FrontPage />
      <PricingTable />
      <a href="/platform" className="pt-20">
        Plataforma
      </a>
    </div>
  );
}
