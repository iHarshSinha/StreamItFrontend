export default function GroupCard({ name, active, onClick }) {
  return (
    <button
      type="button"
      className={`group-card${active ? " is-active" : ""}`}
      onClick={onClick}
    >
      <div className="group-avatar" aria-hidden="true">
        {name?.trim()?.[0]?.toUpperCase() ?? "G"}
      </div>
      <div className="group-name" title={name}>
        {name}
      </div>
    </button>
  );
}
