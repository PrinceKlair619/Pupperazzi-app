const API_BASE =
  window.location.host.includes("aptitude.cse.buffalo.edu")
    ? "/CSE442/2025-Fall/cse-442ac/api"
    : "http://localhost:8000";

export async function fetchEvents(userId) {
  const res = await fetch(`${API_BASE}/events_list.php?user_id=${userId}`);
  return res.json();
}

export async function createEvent(payload) {
  const params = new URLSearchParams(payload).toString();
  const res = await fetch(`${API_BASE}/create_event.php?${params}`);
  return res.json();
}

export async function updateEvent(payload) {
  const params = new URLSearchParams(payload).toString();
  const res = await fetch(`${API_BASE}/update_event.php?${params}`);
  return res.json();
}

export async function deleteEvent(payload) {
  const params = new URLSearchParams(payload).toString();
  const res = await fetch(`${API_BASE}/delete_event.php?${params}`);
  return res.json();
}
