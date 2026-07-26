export default function Footer() {
  return (
    <footer className="border-t border-[#E2E8F0] bg-white px-4 py-10 md:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm">
          <h2 className="text-[20px] font-semibold text-[#16423C]">
            TUP
          </h2>

          <p className="mt-3 text-sm leading-relaxed text-[#64748B]">
            Build better teams and create better projects with the right
            people.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-[#1E293B]">
            Platform
          </h3>

          <ul className="mt-3 space-y-2 text-sm text-[#64748B]">
            <li>
              <a href="#" className="hover:text-[#16423C]">
                Find a Team
              </a>
            </li>

            <li>
              <a href="#" className="hover:text-[#16423C]">
                Explore Projects
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-[#1E293B]">
            Resources
          </h3>

          <ul className="mt-3 space-y-2 text-sm text-[#64748B]">
            <li>
              <a href="#" className="hover:text-[#16423C]">
                About
              </a>
            </li>

            <li>
              <a href="#" className="hover:text-[#16423C]">
                Contact
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-6xl border-t border-[#E2E8F0] pt-6">
        <p className="text-sm text-[#64748B]">
          © 2026 TUP. All rights reserved.
        </p>
      </div>
    </footer>
  );
}