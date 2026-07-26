import { UserRound, ClipboardList, UsersRound } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    title: "Profile & Skills",
    description:
      "Show your skills, interests, previous projects, and portfolio in one place.",
    icon: UserRound,
  },
  {
    title: "Project Board",
    description:
      "Create projects, describe your idea, and find people with the skills you need.",
    icon: ClipboardList,
  },
  {
    title: "Team Matching",
    description:
      "Discover projects that match your interests and apply to join their teams.",
    icon: UsersRound,
  },
];

export default function Features() {
  return (
    <section className="bg-card px-4 py-16 md:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-12 max-w-2xl">
          <h2 className="text-[24px] font-semibold text-foreground">
            Everything You Need to Build a Team
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            TUP makes it easier to discover people, create projects, and
            build the right team.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title}>
                <CardContent className="p-6">
                  <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                    <Icon size={20} aria-hidden="true" />
                  </div>
                  <h3 className="text-[20px] font-semibold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                    {feature.description}
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
