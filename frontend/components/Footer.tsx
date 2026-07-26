export default function Footer() {
  return (
    <footer className="border-t border-border bg-card px-4 py-10 md:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm">
          <h2 className="text-[20px] font-semibold text-[#16423C]">TUP</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Build better teams and create better projects with the right
            people.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-foreground">Platform</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <a href="#" className="hover:text-primary">
                Find a Team
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-primary">
                Explore Projects
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-foreground">Resources</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <a href="#" className="hover:text-primary">
                About
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-primary">
                Contact
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-6xl border-t border-border pt-6">
        <p className="text-sm text-muted-foreground">
          © 2026 TUP. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
