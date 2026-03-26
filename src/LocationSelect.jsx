import { useMemo, useState } from "react";
import Select from "react-select";
import { Country, State, City } from "country-state-city";

export default function LocationSelect({ value, onChange, disabled }) {
  // Parse existing value like "Buffalo, NY, United States"
  const [selection, setSelection] = useState(() => {
    if (!value) return { country: null, state: null, city: null };
    const parts = value.split(",").map(s => s.trim());
    return { country: null, state: null, city: parts[0] || null };
  });

  const countries = useMemo(
    () =>
      Country.getAllCountries().map(c => ({
        value: c.isoCode,
        label: c.name,
      })),
    []
  );

  const states = useMemo(() => {
    if (!selection.country) return [];
    const list = State.getStatesOfCountry(selection.country.value);
    // Some countries don’t have states; return empty -> we’ll go straight to cities-by-country
    return list.map(s => ({ value: s.isoCode, label: s.name }));
  }, [selection.country]);

  const cities = useMemo(() => {
    if (!selection.country) return [];
    if (states.length && selection.state) {
      return City.getCitiesOfState(selection.country.value, selection.state.value)
        .map(ci => ({ value: ci.name, label: ci.name }));
    }
    // Countries with no states: list all country cities
    if (!states.length) {
      return City.getCitiesOfCountry(selection.country.value)
        .map(ci => ({ value: ci.name, label: ci.name }));
    }
    return [];
  }, [selection.country, selection.state, states.length]);

  const handleCountry = (opt) => {
    const next = { country: opt, state: null, city: null };
    setSelection(next);
    // If the user only picks a country, still propagate a readable value
    onChange?.(compose(next));
  };

  const handleState = (opt) => {
    const next = { ...selection, state: opt, city: null };
    setSelection(next);
    onChange?.(compose(next));
  };

  const handleCity = (opt) => {
    const next = { ...selection, city: opt?.label ?? null };
    setSelection(next);
    onChange?.(compose(next));
  };

  const compose = (sel) => {
    const countryLabel = sel.country?.label ?? "";
    const stateLabel = sel.state?.label ?? "";
    const cityLabel = sel.city ?? "";
    // Build "City, State, Country" (skip empties)
    return [cityLabel, stateLabel, countryLabel].filter(Boolean).join(", ");
  };

  // react-select styles (subtle, accessible)
  const styles = {
    control: (base) => ({ ...base, minHeight: 44, borderRadius: 12 }),
    menu: (base) => ({ ...base, zIndex: 9999 }),
  };

  return (
    <div className="location-select">
      <label className="field-label">Location</label>
      <div className="location-grid">
        <Select
          inputId="country"
          isDisabled={disabled}
          styles={styles}
          placeholder="Country"
          options={countries}
          value={selection.country}
          onChange={handleCountry}
          isClearable
        />
        <Select
          inputId="state"
          isDisabled={disabled || !selection.country || states.length === 0}
          styles={styles}
          placeholder={states.length ? "State / Region" : "—"}
          options={states}
          value={selection.state}
          onChange={handleState}
          isClearable
        />
        <Select
          inputId="city"
          isDisabled={disabled || !selection.country || (states.length && !selection.state)}
          styles={styles}
          placeholder="City"
          options={cities}
          value={selection.city ? { value: selection.city, label: selection.city } : null}
          onChange={handleCity}
          isClearable
          // Large lists → let users type to filter
          filterOption={(opt, input) =>
            opt.label.toLowerCase().includes(input.toLowerCase())
          }
          noOptionsMessage={() => "Type to search cities"}
        />
      </div>
    </div>
  );
}
