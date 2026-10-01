import { createFileRoute } from "@tanstack/react-router";

import { UtilityPage } from "@/components/app/UtilityPage";

export const Route = createFileRoute("/_authenticated/water")({
  head: () => ({
    meta: [
      { title: "Water payments — NyumbaPro" },
      { name: "description", content: "Record and track water bill payments per room and tenant." },
      { property: "og:title", content: "Water payments — NyumbaPro" },
      { property: "og:description", content: "Record and track water bill payments per room and tenant." },
    ],
  }),
  component: () => <UtilityPage kind="water" />,
});
