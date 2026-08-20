import { Button } from "@/components/ui/button";
import HeroIllustration from "@/components/HeroIllustration";

export default function Hero() {
  return (
    <section className="flex min-h-[calc(100vh-72px)] items-center bg-background px-4 py-16 md:px-8">
      <div className="mx-auto grid w-full max-w-6xl gap-12 lg:grid-cols-2 lg:items-center">
        <div className="max-w-xl">
          <h1 className="text-[32px] font-bold leading-tight text-foreground md:text-[40px]">
            Build Your Perfect Team
          </h1>

          <p className="mt-6 text-base leading-normal text-muted-foreground">
            Find the right people for your next project, startup,
            research, or hackathon.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Button size="lg">Find a Team</Button>
            <Button size="lg" variant="outline">
              Explore Projects
            </Button>
          </div>
        </div>

        <div className="order-first flex justify-center lg:order-none">
          <HeroIllustration />
        </div>
      </div>
    </section>
  );
}
