// src/PreferencesWizard.jsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const API =
  import.meta.env.VITE_API_BASE ??
  (import.meta.env.DEV
    ? "https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442ac/api"
    : "/CSE442/2025-Fall/cse-442ac/api");

function Chip({ on, children, onClick }) {
  return (
    <button
      type="button"
      className={`chip ${on ? "on" : ""}`}
      onClick={onClick}
      aria-pressed={on ? "true" : "false"}
    >
      {children}
    </button>
  );
}

export default function PreferencesWizard() {
  const navigate = useNavigate();

  const [prefs, setPrefs] = useState(() => ({}));
  const toggle = (k) => setPrefs((p) => ({ ...p, [k]: !p[k] }));

  const slides = useMemo(
    () => [
      {
        title: "Ready to answer a few questions?",
        desc: "Tell us which dogs match your comfort and style.",
        groups: [
          {
            heading: "Dog Compatibility",
            keys: [
              ["puppies_ok", "✓ Puppies ok"],
              ["seniors_ok", "✓ Seniors ok"],
              ["fixed_only", "✓ Fixed (spayed/neutered) only"],
              ["calm_ok", "✓ Calm/low-energy dogs"],
              ["high_energy_ok", "✓ High-energy play ok"],
              ["same_size_only", "✓ Same-size only"],
              ["any_size_ok", "✓ Any size ok"],
              ["avoid_intact_males", "✓ Avoid intact males"],
              ["avoid_toy_guarding", "✓ Avoid toy-guarding dogs"],
              ["avoid_food_guarding", "✓ Avoid resource guarding over food"],
              ["avoid_mounting", "✓ Avoid mounting behavior"],
            ],
          },
        ],
      },
      {
        title: "Play style",
        desc: "Pick the ways your dog likes to interact.",
        groups: [
          {
            heading: "Play Style",
            keys: [
              ["play_chase", "✓ Chase"],
              ["play_wrestle", "✓ Wrestle"],
              ["play_tug", "✓ Tug"],
              ["play_fetch_only", "✓ Fetch only"],
              ["parallel_walk", "✓ Parallel walk (no direct play)"],
              ["avoid_rough_play", "✓ Avoid rough play"],
            ],
          },
        ],
      },
      {
        title: "Environment",
        desc: "Where do you prefer to meet up?",
        groups: [
          {
            heading: "Environment",
            keys: [
              ["fenced_required", "✓ Fenced area required"],
              ["quiet_parks_only", "✓ Quiet parks only"],
              ["trails_ok", "✓ Trails ok"],
              ["backyard_ok", "✓ Backyard ok"],
              ["off_leash_ok", "✓ Off-leash ok (where legal)"],
              ["avoid_dog_parks", "✓ Avoid dog parks"],
              ["avoid_crowded", "✓ Avoid crowded areas"],
              ["avoid_indoor", "✓ Avoid indoor spaces"],
            ],
          },
        ],
      },
      {
        title: "Group & Social",
        desc: "How many pups and what kind of households are fine?",
        groups: [
          {
            heading: "Group & Social",
            keys: [
              ["one_on_one_only", "✓ One-on-one only"],
              ["group_small", "✓ Small group (2–3)"],
              ["group_medium", "✓ Medium group (4–6)"],
              ["kids_ok", "✓ With kids present ok"],
              ["avoid_with_cats", "✓ Avoid households with cats"],
              ["avoid_multi_dog_homes", "✓ Avoid multi-dog households"],
            ],
          },
        ],
      },
      {
        title: "Health & Safety",
        desc: "Basic guardrails for a safe meet.",
        groups: [
          {
            heading: "Health & Safety",
            keys: [
              ["vaccines_required", "✓ Proof of vaccines required"],
              ["recent_flea_tick", "✓ Recent flea/tick prevention"],
              ["share_vet_ok", "✓ Share vet contact if asked"],
              ["muzzle_friendly", "✓ Muzzle-friendly (if recommended)"],
              ["avoid_recovery", "✓ Avoid dogs recovering from illness/injury"],
              ["avoid_bikes_scooters", "✓ Avoid reactive to bikes/scooters"],
              ["avoid_sharing_toys_food", "✓ Avoid toy/food sharing"],
            ],
          },
        ],
      },
      {
        title: "Scheduling & Distance",
        desc: "When and how far works for you?",
        groups: [
          {
            heading: "Scheduling",
            keys: [
              ["weekday_mornings", "✓ Weekday mornings"],
              ["weekday_evenings", "✓ Weekday evenings"],
              ["weekend_mornings", "✓ Weekend mornings"],
              ["flex_short_notice", "✓ Flexible / short notice"],
              ["duration_30_45", "✓ 30–45 min meets"],
              ["duration_60_90", "✓ 60–90 min hikes"],
              ["avoid_night_meets", "✓ Avoid night meets"],
            ],
          },
          {
            heading: "Distance / Location",
            keys: [
              ["dist_1_3", "✓ Within 1–3 miles"],
              ["dist_5_10", "✓ Within 5–10 miles"],
              ["will_travel_car", "✓ Will travel with car"],
              ["avoid_over_10", "✓ Avoid more than 10 miles"],
            ],
          },
        ],
      },
      {
        title: "Weather, Communication & Boundaries",
        desc: "Last bits and we’re done.",
        groups: [
          {
            heading: "Weather",
            keys: [
              ["light_rain_ok", "✓ Light rain ok"],
              ["snow_ok", "✓ Snow ok"],
              ["heat_sensitive", "✓ Heat sensitive (avoid >80°F)"],
              ["avoid_rain", "✓ Avoid rain"],
              ["avoid_extreme_cold", "✓ Avoid extreme cold"],
            ],
          },
          {
            heading: "Communication",
            keys: [
              ["chat_only", "✓ In-app chat only"],
              ["share_calendar", "✓ Share calendar link"],
              ["fast_replies", "✓ Fast replies (<4h)"],
              ["avoid_voice_calls", "✓ Avoid voice calls"],
              ["avoid_off_platform", "✓ Avoid off-platform messaging"],
            ],
          },
          {
            heading: "Owner Comfort / Boundaries",
            keys: [
              ["neutral_ground_first", "✓ First meet on neutral ground"],
              ["both_owners_present", "✓ Both owners present"],
              ["no_shared_toys_first", "✓ No shared toys on first meet"],
              ["water_treats_ok", "✓ Water/treats okay"],
              ["avoid_home_first", "✓ Avoid home meet on first visit"],
              ["avoid_photos_people", "✓ Avoid photos/videos of people"],
            ],
          },
        ],
      },
    ],
    []
  );

  const [step, setStep] = useState(0);
  const isLast = step === slides.length - 1;

  const next = () => setStep((s) => Math.min(s + 1, slides.length - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const onFinish = async () => {
    try {
      const userId = Number(localStorage.getItem("userId") || 0);
      if (userId) {
        await fetch(`${API}/preferences_update.php`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, prefs }),
        }).catch(() => {});
      }
    } finally {
      // ensure protected route passes
      localStorage.setItem("loggedIn", "true");
      navigate("/createdog", { replace: true });
    }
  };

  const slide = slides[step];

  return (
    <div className="Container">
      {/* Header + stepper to match other pages */}
      <div className="hero-wrapper">
        <div className="page hero-center">
          <h1 className="hero-title">Set up your Profile</h1>
          <p className="hero-subtitle">Add your preferences so we can filter better matches.</p>

          <div className="stepper" aria-label="Setup progress">
            <div className="step-inactive">1</div>
            <span className="step-label">Create Account</span>
            <hr className="divider" />
            <div className="step-inactive">2</div>
            <span className="step-label">Profile Setup</span>
            <hr className="divider" />
            <div className="step-active" aria-current="step">3</div>
            <span className="step-label">Questions</span>
          </div>
        </div>
      </div>

      <div className="Card">
        <div className="form">
          {/* Progress dots with active + completed states */}
          <div className="progress-dots" role="tablist" aria-label="Question progress">
            {slides.map((_, i) => {
              const cls = i === step ? "dot active" : i < step ? "dot complete" : "dot";
              return <span key={i} className={cls} aria-hidden="true" />;
            })}
          </div>

          <h2 style={{ marginBottom: 4 }}>{slide.title}</h2>
          <p className="hero-subtitle" style={{ marginTop: 0 }}>{slide.desc}</p>

          {slide.groups.map((g, idx) => (
            <section key={idx} style={{ marginTop: 14 }}>
              <h3 style={{ margin: "10px 0 8px" }}>{g.heading}</h3>
              <div className="prefs-grid">
                {g.keys.map(([key, label]) => (
                  <Chip key={key} on={!!prefs[key]} onClick={() => toggle(key)}>
                    {label}
                  </Chip>
                ))}
              </div>
            </section>
          ))}

          <div className="actions" style={{ justifyContent: "space-between", marginTop: 16 }}>
            {/* Hide Back on the first slide */}
            {step > 0 ? (
              <button type="button" className="Button ghost" onClick={prev}>
                Back
              </button>
            ) : (
              <span />
            )}

            {isLast ? (
              <button className="Button" onClick={onFinish}>
                Save & Finish
              </button>
            ) : (
              <button className="Button" onClick={next}>
                Next
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Inline styles (so no separate CSS file needed) */}
      <style>{`
        /* Progress dots */
        .progress-dots {
          display: flex;
          gap: 8px;
          justify-content: center;
          margin: 6px 0 14px;
        }
        .dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: #e5e7eb;
          transition: background .2s ease, transform .2s ease, opacity .2s ease;
        }
        .dot.active { background: #3b82f6; transform: scale(1.15); }
        .dot.complete { background: #93c5fd; }

        /* Chips + grid */
        .prefs-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 12px;
          margin: 12px 0 20px;
        }
        .chip {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 10px 12px;
          border-radius: 999px;
          border: 1px solid #e5e7eb;
          background: #fff;
          cursor: pointer;
          font-size: 0.95rem;
          transition: transform .05s ease, box-shadow .15s ease, background .2s ease;
        }
        .chip:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(0,0,0,.06); }
        .chip.on { border-color: #34d399; background: #ecfdf5; }
      `}</style>
    </div>
  );
}
