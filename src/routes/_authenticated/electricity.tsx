import { createFileRoute } from "@tanstack/react-router";

import { UtilityPage } from "@/components/app/UtilityPage";

export const Route = createFileRoute("/_authenticated/electricity")({
  head: () => ({
    meta: [
      { title: "Electricity payments — NyumbaPro" },
      { name: "description", content: "Record and track electricity token purchases per room and tenant." },
      { property: "og:title", content: "Electricity payments — NyumbaPro" },
      { property: "og:description", content: "Record and track electricity token purchases per room and tenant." },
    ],
  }),
  component: () => <UtilityPage kind="electricity" />,
});
