import { Link } from "react-router";
export const human = (s = "") =>
  s
    .split("-")
    .map((x) => x.charAt(0).toUpperCase() + x.slice(1))
    .join(" ");
export const english = (x) =>
  x?.names?.find((n) => n.language.name === "en")?.name || human(x?.name);
export const flavor = (x) =>
  x.flavor_text_entries
    ?.filter((e) => e.language.name === "en")
    .at(-1)
    ?.flavor_text.replace(/\s+/g, " ") || "—";
export const effect = (x) =>
  x.effect_entries?.find((e) => e.language.name === "en")?.short_effect ||
  flavor(x);
export const dex = (n) => "#" + String(n).padStart(4, "0");
export function Badge({ name, linked = true, label }) {
  const props = {
    className: "badge",
    style: { background: `var(--type-${name})` },
    children: label || human(name),
  };
  return linked ? (
    <Link to={"/types/" + name} {...props} />
  ) : (
    <span {...props} />
  );
}
export function Section({ title, children, id }) {
  const key = id || title.toLowerCase().replaceAll(" ", "-");
  return (
    <section id={key} aria-labelledby={key + "-heading"}>
      <h2 id={key + "-heading"}>{title}</h2>
      {children}
    </section>
  );
}
export function Cards({ items }) {
  return (
    <ul className="cards">
      {items.map((p) => (
        <li key={p.id}>
          <Link to={"/pokemon/" + p.name}>
            <img src={p.sprite} alt={human(p.name)} />
            <span className="dex">{dex(p.id)}</span>
            <span>{human(p.name)}</span>
            {p.types && (
              <span className="badges">
                {p.types.map((t) => (
                  <Badge key={t.type.name} name={t.type.name} linked={false} />
                ))}
              </span>
            )}
            {p.hidden && <small>Hidden ability</small>}
          </Link>
        </li>
      ))}
    </ul>
  );
}
export function Missing() {
  return (
    <>
      <h1>Not found</h1>
      <Link to="/">Back to Pokémon</Link>
    </>
  );
}
export const titleMeta = ({ loaderData }) => [
  {
    title: loaderData?.title
      ? loaderData.title + " – Pokédex"
      : "Not found – Pokédex",
  },
];
