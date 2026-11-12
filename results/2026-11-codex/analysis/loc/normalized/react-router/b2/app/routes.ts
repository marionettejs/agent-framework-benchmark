import { index, route } from "@react-router/dev/routes";
export default [
  index("routes/home.tsx"),
  route("pokemon/:name", "routes/pokemon.tsx"),
  route("types", "routes/types.tsx"),
  route(":kind/:name", "routes/detail.tsx"),
  route("*", "routes/missing.tsx"),
];
