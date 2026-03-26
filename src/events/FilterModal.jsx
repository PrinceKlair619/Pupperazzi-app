import { useEffect, useState } from "react";

export default function FilterModal({ open, onClose, value, onApply }) {
  const [local, setLocal] = useState(value);

  useEffect(() => {
    if (open) setLocal(value);
  }, [open, value]);

  if (!open) return null;

  const apply = (e) => {
    e.preventDefault();
    onApply?.(local);
    onClose?.();
  };

  const clear = () => {
    const fresh = {
      type: "all",
      upcomingOnly: true,
      dateFrom: "",
      dateTo: "",
      hasImage: false,
    };

    setLocal(fresh);
    onApply?.(fresh);
    onClose?.();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Filter Events</h3>

        <form className="form" onSubmit={apply}>
          <div className="row two">
            <label>
              Tag
              <select
                value={local.type}
                onChange={(e) =>
                  setLocal((f) => ({ ...f, type: e.target.value }))
                }
              >
                <option value="all">All</option>
                <option value="activity">Activity</option>
                <option value="playdate">Playdate</option>
              </select>
            </label>

            <label>
              Upcoming only
              <select
                value={String(local.upcomingOnly)}
                onChange={(e) =>
                  setLocal((f) => ({
                    ...f,
                    upcomingOnly: e.target.value === "true",
                  }))
                }
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </label>
          </div>

          <div className="row two">
            <label>
              Start after
              <input
                type="datetime-local"
                value={local.dateFrom}
                onChange={(e) =>
                  setLocal((f) => ({ ...f, dateFrom: e.target.value }))
                }
              />
            </label>

            <label>
              End before
              <input
                type="datetime-local"
                value={local.dateTo}
                onChange={(e) =>
                  setLocal((f) => ({ ...f, dateTo: e.target.value }))
                }
              />
            </label>
          </div>

          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="checkbox"
              checked={local.hasImage}
              onChange={(e) =>
                setLocal((f) => ({ ...f, hasImage: e.target.checked }))
              }
            />
            Only show events with an image
          </label>

          <div className="actions">
            <button type="button" className="btncancel" onClick={clear}>
              Clear
            </button>

            <button type="button" className="btncancel" onClick={onClose}>
              Close
            </button>

            <button type="submit" className="btncreate2">
              Apply
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
