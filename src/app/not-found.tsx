import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Surface } from "@/components/ui/surface";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col bg-[#F4FAFF] text-[#0B0B14]">
      <Navbar />

      <div className="flex-1 flex items-center justify-center pt-28 pb-16 px-4">
        <Surface
          tone="white"
          radius="xl"
          className="p-8 sm:p-12 bg-white border-[3px] border-[#0B0B14] shadow-[0_8px_0_#0B0B14] max-w-md w-full text-center flex flex-col items-center gap-4"
        >
          <div className="w-20 h-20 rounded-full bg-[#FFE66B] border-[3px] border-[#0B0B14] shadow-[0_3px_0_#0B0B14] flex items-center justify-center text-4xl select-none">
            🪙
          </div>

          <h1 className="font-display font-black text-4xl text-[#0B0B14]">
            404
          </h1>
          <p className="font-body text-xs sm:text-sm text-[#0B0B14]/80">
            Looks like this coin flipped off the table! The page you were looking for doesn&apos;t exist.
          </p>

          <Link href="/">
            <Button variant="pink" size="md" className="font-black px-6 mt-2">
              Back to Game
            </Button>
          </Link>
        </Surface>
      </div>

      <Footer />
    </main>
  );
}
