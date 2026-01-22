import { useMemo, useState } from "react";
import GroupCard from "./GroupCard";
import "./GroupsBar.css";

export default function GroupsBar({ groups }) {
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState(groups?.[0]?.id ?? null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups ?? [];
    return (groups ?? []).filter((g) => g.name.toLowerCase().includes(q));
  }, [groups, query]);

  return (
    <section className="groups">
      <h2 className="sr-only">Groups</h2>

      <div className="groups-search">
        <input
          className="groups-search-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search groups"
          aria-label="Search groups"
        />
      </div>

      <div className="groups-rail" role="list">
        {filtered.map((g) => (
          <div className="groups-item" role="listitem" key={g.id}>
            <GroupCard
              name={g.name}
              active={g.id === activeId}
              onClick={() => setActiveId(g.id)}
            />
          </div>
        ))}

        {filtered.length === 0 ? (
          <div className="groups-empty">No groups found.</div>
        ) : null}
      </div>
    </section>
  );
}
