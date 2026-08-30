import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "移工狀態雷達" },
      {
        name: "description",
        content: "地方政府使用的移工聘僱關係事件追蹤與跨機關證據衝突工作台。",
      },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
});
