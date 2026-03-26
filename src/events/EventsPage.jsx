import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

import "./events.css";

import ListCard from "./ListCard";
import DetailPane from "./DetailPane";
import CreateEventModal from "./CreateEventModal";
import FilterModal from "./FilterModal";

import { fetchEvents, createEvent, updateEvent, deleteEvent } from "./api";

export default function EventsPage() {
  /* ---------------------- State ---------------------- */
  const [events, setEvents] = useState([]);
  const [selected, setSelected] = useState(null);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [openCreate, setOpenCreate] = useState(false);
  const [editing, setEditing] = useState(null);
  const [openFilter, setOpenFilter] = useState(false);

  const [filters, setFilters] = useState({
    type: "all",
    upcomingOnly: true,
    dateFrom: "",
    dateTo: "",
    hasImage: false,
  });

  const currentUserId = Number(localStorage.getItem("user_id") || 0);

  /* ---------------------- URL preselect ---------------------- */
  const location = useLocation();
  const preselectId = Number(new URLSearchParams(location.search).get("id") || 0);

  /* ---------------------- Load events ---------------------- */
  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);

        const data = await fetchEvents(currentUserId);

        if (!active) return;

        if (data.ok && Array.isArray(data.events)) {
          const mapped = data.events.map((ev) => ({
            ...ev,
            category: ev.category || "activity",
            details: Array.isArray(ev.details) ? ev.details : ev.details_json ? JSON.parse(ev.details_json) : []
          }));

          setEvents(mapped);

          if (mapped.length > 0) {
            const match = preselectId
              ? mapped.find((ev) => Number(ev.id) === preselectId)
              : null;

            setSelected(match || mapped[0]);
          }
        }
      } finally {
        setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [currentUserId, preselectId]);

  /* ---------------------- Filters + search ---------------------- */
  const filteredEvents = useMemo(() => {
    const q = search.trim().toLowerCase();
    const now = new Date();

    let list = events
      .filter((ev) =>
        q
          ? ev.title?.toLowerCase().includes(q) ||
            ev.location?.toLowerCase().includes(q) ||
            ev.description?.toLowerCase().includes(q)
          : true
      )
      .filter((ev) =>
        filters.type === "all" ? true : ev.category === filters.type
      )
      .filter((ev) => (filters.upcomingOnly ? new Date(ev.starts_at) >= now : true))
      .filter((ev) => (filters.hasImage ? !!ev.cover_url : true))
      .filter((ev) =>
        filters.dateFrom
          ? new Date(ev.starts_at) >= new Date(filters.dateFrom)
          : true
      )
      .filter((ev) =>
        filters.dateTo
          ? new Date(ev.starts_at) <= new Date(filters.dateTo)
          : true
      );

    /* ⭐ ALWAYS include preselected event even if filters hide it ⭐ */
    if (preselectId) {
      const match = events.find((ev) => Number(ev.id) === preselectId);
      if (match && !list.some((e) => e.id === match.id)) {
        list = [match, ...list];
      }
    }

    return list.sort((a, b) => new Date(b.starts_at) - new Date(a.starts_at));
  }, [events, search, filters, preselectId]);

  /* ---------------------- Create event ---------------------- */
  const handleCreate = async (draft) => {
    if (!currentUserId) {
      alert("You must be logged in to create an event.");
      return;
    }

    try {
      const startsAt = draft.datetime.includes("T")
        ? draft.datetime.replace("T", " ") + ":00"
        : draft.datetime;

      const payload = {
        title: draft.title,
        starts_at: startsAt,
        location: draft.location,
        cover_url: draft.image_url,
        description: draft.description,
        details: JSON.stringify(draft.details || []),
        host_user_id: currentUserId,
        category: draft.type,
      };

      const data = await createEvent(payload);

      if (!data.ok || !data.event) {
        alert("Could not create event.");
        return;
      }

      const newEvent = {
        ...data.event,
        category: data.event.category || draft.type,
        host: { id: currentUserId, name: "You" }
      };

      setEvents((prev) => [newEvent, ...prev]);
      setSelected(newEvent);
    } catch (err) {
      console.error("Error creating event", err);
    }
  };

  /* ---------------------- Save edits ---------------------- */
  const handleUpdate = async (draft) => {
    if (!editing) return;
    if (!currentUserId) {
      alert("You must be logged in to edit an event.");
      return;
    }

    try {
      const startsAt = draft.datetime.includes("T")
        ? draft.datetime.replace("T", " ") + ":00"
        : draft.datetime;

      const payload = {
        id: editing.id,
        title: draft.title,
        starts_at: startsAt,
        location: draft.location,
        cover_url: draft.image_url,
        description: draft.description,
        details: JSON.stringify(draft.details || []),
        host_user_id: currentUserId,
        category: draft.type,
      };

      const data = await updateEvent(payload);

      if (!data.ok || !data.event) {
        alert("Could not save changes.");
        return;
      }

      setEvents((prev) =>
        prev.map((ev) =>
          ev.id === editing.id ? { ...ev, ...data.event } : ev
        )
      );

      setSelected((prev) =>
        prev && prev.id === editing.id ? { ...prev, ...data.event } : prev
      );
    } catch (err) {
      console.error("Error updating event", err);
    } finally {
      setEditing(null);
    }
  };

  /* ---------------------- Delete event ---------------------- */
  const handleDelete = async () => {
    const ev = selected;
    if (!ev) return;

    if (!currentUserId) {
      alert("You must be logged in to delete an event.");
      return;
    }

    const ok = window.confirm(
      `Are you sure you want to cancel/delete "${ev.title}"?`
    );
    if (!ok) return;

    try {
      const payload = {
        id: ev.id,
        host_user_id: currentUserId,
      };

      const data = await deleteEvent(payload);

      if (!data.ok) {
        alert("Could not delete event.");
        return;
      }

      setEvents((prev) => prev.filter((x) => x.id !== ev.id));

      const remaining = filteredEvents.filter((x) => x.id !== ev.id);
      setSelected(remaining[0] || null);
    } catch (err) {
      console.error("Error deleting event", err);
      alert("Something went wrong deleting the event.");
    }
  };

  /* ---------------------- Render ---------------------- */
  const activeEvent = selected || filteredEvents[0] || null;

  return (
    <div className="pup-events events-shell">
      <header className="events-header events-header--onecol">
        <h1>Events</h1>

        <div className="header-actions">
          <input
            className="search"
            placeholder="Search title, location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <button className="btnfilter" onClick={() => setOpenFilter(true)}>
            Filter
          </button>

          <button className="btncreate" onClick={() => setOpenCreate(true)}>
            + Create Event
          </button>
        </div>
      </header>

      <div className="events-body">
        {/* -------- LEFT LIST -------- */}
        <aside className="ev-list">
          {loading ? (
            <div className="state muted">Loading events…</div>
          ) : filteredEvents.length === 0 ? (
            <div className="state muted">
              {search ||
              filters.type !== "all" ||
              filters.hasImage ||
              filters.dateFrom ||
              filters.dateTo ||
              filters.upcomingOnly
                ? "No events match your filters."
                : "No events yet. Create one to get things started."}
            </div>
          ) : (
            filteredEvents.map((ev) => (
              <ListCard
                key={ev.id}
                ev={ev}
                active={activeEvent?.id === ev.id}
                onSelect={setSelected}
              />
            ))
          )}
        </aside>

        {/* -------- RIGHT DETAIL -------- */}
        <main className="ev-detail">
          <DetailPane
            ev={activeEvent}
            onRSVPChange={() => {}}
            canEdit={activeEvent && Number(activeEvent.host_user_id) === currentUserId}
            onEdit={() => setEditing(activeEvent)}
            onDelete={handleDelete}
          />
        </main>
      </div>

      {/* -------- Modals -------- */}
      <CreateEventModal
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        onSubmit={handleCreate}
        mode="create"
      />

      <CreateEventModal
        open={!!editing}
        onClose={() => setEditing(null)}
        onSubmit={handleUpdate}
        mode="edit"
        initial={editing}
      />

      <FilterModal
        open={openFilter}
        onClose={() => setOpenFilter(false)}
        value={filters}
        onApply={setFilters}
      />
    </div>
  );
}
