export default function CTA() {
  return (
    <section className="bg-[#16423C] px-4 py-16 md:px-8">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="text-[24px] font-semibold text-white md:text-[28px]">
          Ready to Build Your Team?
        </h2>

        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[#E2E8F0]">
          Find the right people for your next project, startup, research,
          or hackathon.
        </p>

        <button
          className="mt-8 rounded-lg bg-[#D3E8BF] px-6 py-3 font-medium text-[#16423C] transition-colors hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#D3E8BF] focus:ring-offset-2 focus:ring-offset-[#16423C]"
        >
          Get Started
        </button>
      </div>
    </section>
  );
}