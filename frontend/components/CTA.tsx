import { Button } from "@/components/ui/button";

export default function CTA() {
  return (
    <section className="bg-[#16423C] px-4 py-16 md:px-8">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="text-[24px] font-semibold text-white md:text-[28px]">
          Ready to Build Your Team?
        </h2>

        <p className="mx-auto mt-4 max-w-2xl text-base leading-normal text-[#E2E8F0]">
          Find the right people for your next project, startup, research,
          or hackathon.
        </p>

        <Button size="lg" variant="secondary" className="mt-8">
          Get Started
        </Button>
      </div>
    </section>
  );
}
