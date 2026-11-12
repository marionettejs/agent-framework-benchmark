import { useLoaderData } from "react-router";
import { types, api } from "../api.server";
import { Badge, titleMeta } from "../ui";
export const meta = titleMeta;
export async function loader() {
  return {
    title: "Types",
    types: await Promise.all((await types()).map((x) => api(x.url))),
  };
}
export default function Types() {
  const d = useLoaderData();
  return (
    <>
      <h1>Types</h1>
      <ul className="type-list">
        {d.types.map((t) => (
          <li key={t.name}>
            <Badge
              name={t.name}
              label={t.names.find((x) => x.language.name === "en")?.name}
            />
          </li>
        ))}
      </ul>
    </>
  );
}
