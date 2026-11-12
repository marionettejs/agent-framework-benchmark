import { route, index } from "@react-router/dev/routes";
export default [
  index("page.tsx"),
  route("pokemon/:name", "page.tsx", { id: "pokemon" }),
  route("moves/:name", "page.tsx", { id: "move" }),
  route("abilities/:name", "page.tsx", { id: "ability" }),
  route("types", "page.tsx", { id: "types" }),
  route("types/:name", "page.tsx", { id: "type" }),
  route("*", "page.tsx", { id: "missing" }),
];
