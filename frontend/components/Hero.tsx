export default function Hero() {
  return (
    <section className="flex min-h-[calc(100vh-72px)] items-center bg-[#F8FAFC] px-4 py-16 md:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <div className="max-w-3xl">
          <h1 className="text-[28px] font-bold leading-tight text-[#1E293B] md:text-[32px]">
            Build Your Perfect Team
          </h1>

          <p className="mt-6 text-base leading-relaxed text-[#64748B]">
            Find the right people for your next project, startup,
            research, or hackathon.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <button className="rounded-lg bg-[#44766C] px-6 py-3 text-white transition-colors hover:bg-[#16423C] focus:outline-none focus:ring-2 focus:ring-[#44766C] focus:ring-offset-2">
              Find a Team
            </button>

            <button className="rounded-lg border border-[#44766C] px-6 py-3 text-[#44766C] transition-colors hover:bg-[#44766C] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#44766C] focus:ring-offset-2">
              Explore Projects
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}