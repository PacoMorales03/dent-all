import FrontPage from "@/components/FrontPage";
import { Button } from "@/components/ui/button";
import Link from "next/dist/client/link";

export default function Home() {

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <FrontPage />
      <div className="mt-10 flex flex-col sm:flex-row gap-4">
        
        <Button asChild size="lg" className="px-8">
          <Link href="/platform">
          Ve a la Platforma
          </Link>
        </Button>

        <Button 
          asChild 
          variant="outline" 
          size="lg" 
          className="px-8"
        >
          <Link href="/about">
            Echa un vistazo a las clínicas
          </Link>
        </Button>

      </div>
    </div>
  );
}
