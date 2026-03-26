import { useEffect, useState } from "react";

export default function CreateEventModal({
  open,
  onClose,
  onSubmit,
  mode = "create",
  initial = null,
}) {
  const [form, setForm] = useState({
    type: "activity",
    title: "",
    datetime: "",
    location: "",
    description: "",
    details: "",
    image_url: "",
    image_file: null,
  });

  // Load initial values for editing
  useEffect(() => {
    if (!open) return;

    if (initial) {
      setForm({
        type: initial.category || initial.type || "activity",
        title: initial.title || "",
        datetime: initial.starts_at
          ? initial.starts_at.replace(" ", "T").slice(0, 16)
          : "",
        location: initial.location || "",
        description: initial.description || "",
        details: Array.isArray(initial.details)
          ? initial.details.join("\n")
          : initial.details || "",
        image_url: initial.cover_url || "",
        image_file: null,
      });
    } else {
      setForm({
        type: "activity",
        title: "",
        datetime: "",
        location: "",
        description: "",
        details: "",
        image_url: "",
        image_file: null,
      });
    }
  }, [open, initial]);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.datetime) return;

    const payload = {
      type: form.type,
      title: form.title.trim(),
      datetime: form.datetime,
      location: form.location.trim(),
      description: form.description.trim(),
      details: form.details
        ? form.details
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
      image_url: form.image_url.trim(),
      image_file: form.image_file || null,
    };

    onSubmit?.(payload);
    onClose?.();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{mode === "edit" ? "Edit Event" : "Create Event"}</h3>

        <form className="form" onSubmit={handleSubmit}>
          <div className="row two">
            <label>
              Tag
              <select
                value={form.type}
                onChange={(e) =>
                  setForm((f) => ({ ...f, type: e.target.value }))
                }
              >
                <option value="activity">Activity</option>
                <option value="playdate">Playdate</option>
              </select>
            </label>

            <label>
              Title
              <input
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                placeholder="Beach walk, Dog park meetup…"
                required
              />
            </label>
          </div>

          <div className="row two">
            <label>
              When
              <input
                type="datetime-local"
                value={form.datetime}
                onChange={(e) =>
                  setForm((f) => ({ ...f, datetime: e.target.value }))
                }
                required
              />
            </label>

            <label>
              Location
              <input
                value={form.location}
                onChange={(e) =>
                  setForm((f) => ({ ...f, location: e.target.value }))
                }
                placeholder="Delaware Park"
              />
            </label>
          </div>

          <label>
            Description
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              placeholder="Short summary for the event page…"
            />
          </label>

          <label>
            What to know (one per line)
            <textarea
              rows={3}
              value={form.details}
              onChange={(e) =>
                setForm((f) => ({ ...f, details: e.target.value }))
              }
              placeholder={"Bring water bowl\nLeashes on entry\nBe kind and patient"}
            />
          </label>

          <label>
            Upload Image (optional)
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  const localUrl = URL.createObjectURL(file);
                  setForm((f) => ({
                    ...f,
                    image_url: localUrl,
                    image_file: file,
                  }));
                }
              }}
            />
          </label>

          {form.image_url && (
            <div className="image-preview">
              <img src={form.image_url} alt="Event Preview" />
            </div>
          )}

          <div className="actions">
            <button type="button" className="btncancel" onClick={onClose}>
              Cancel
            </button>

            <button type="submit" className="btncreate2">
              {mode === "edit" ? "Save Changes" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
