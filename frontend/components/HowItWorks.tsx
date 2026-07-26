import { UserPlus, Search, UsersRound } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const steps = [
  {
    number: "01",
    title: "Create Your Profile",
    description:
      "Add your skills, interests, experience, and portfolio to show what you can bring to a team.",
    icon: UserPlus,
  },
  {
    number: "02",
    title: "Find a Project",
    description:
      "Explore projects that match your interests or create your own project and share your idea.",
    icon: Search,
  },
  {
    number: "03",
    title: "Build Your Team",
    description:
      "Connect with people who have the skills you need and build your ideal project team.",
    icon: UsersRound,
  },
];

export default function HowItWorks() {
  return (
    <section className="bg-background px-4 py-16 md:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-[24px] font-semibold text-foreground">
            How TUP Works
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Build your team in three simple steps.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <Card key={step.number} className="relative">
                <CardContent className="p-6">
                  <div className="mb-6 flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                      <Icon size={20} aria-hidden="true" />
                    </div>
                    <span className="text-sm font-semibold text-primary">
                      {step.number}
                    </span>
                  </div>
                  <h3 className="text-[20px] font-semibold text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
