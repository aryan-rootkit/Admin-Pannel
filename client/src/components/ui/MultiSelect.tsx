"use client";

import { useMemo } from "react";
import Select, { type MultiValue, type StylesConfig } from "react-select";

export type MultiSelectOption = { value: string; label: string };

type Props = {
  options: MultiSelectOption[];
  value: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  /** Render menu in a portal so it is not clipped inside modals */
  menuPortal?: boolean;
};

function idsToMultiValue(
  ids: string[],
  options: MultiSelectOption[]
): MultiValue<MultiSelectOption> {
  const byId = new Map(options.map((o) => [o.value, o]));
  return ids
    .map((id) => byId.get(id) ?? { value: id, label: id })
    .filter((o) => o.value);
}

const selectStyles: StylesConfig<MultiSelectOption, true> = {
  control: (base, state) => ({
    ...base,
    borderRadius: 8,
    padding: "2px 4px",
    minHeight: 42,
    borderColor: state.isFocused ? "var(--purity-accent)" : "var(--purity-border)",
    boxShadow: state.isFocused ? "0 0 0 2px rgba(79, 209, 197, 0.25)" : "none",
    backgroundColor: "var(--purity-card)",
    cursor: state.isDisabled ? "not-allowed" : "default",
  }),
  menu: (base) => ({
    ...base,
    borderRadius: 8,
    overflow: "hidden",
    border: "1px solid var(--purity-border)",
    zIndex: 20,
    backgroundColor: "var(--purity-card)",
  }),
  menuList: (base) => ({
    ...base,
    padding: 4,
  }),
  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
  multiValue: (base) => ({
    ...base,
    backgroundColor: "var(--purity-sidebar-active)",
    borderRadius: 6,
  }),
  multiValueLabel: (base) => ({
    ...base,
    color: "var(--purity-text)",
    fontSize: "0.875rem",
    fontWeight: 500,
  }),
  multiValueRemove: (base) => ({
    ...base,
    borderRadius: "0 6px 6px 0",
    ":hover": {
      backgroundColor: "rgba(45, 55, 72, 0.08)",
      color: "var(--purity-text)",
    },
  }),
  option: (base, state) => ({
    ...base,
    fontSize: "0.875rem",
    cursor: "pointer",
    borderRadius: 6,
    backgroundColor: state.isSelected
      ? "var(--purity-sidebar-active)"
      : state.isFocused
        ? "rgba(79, 209, 197, 0.12)"
        : "transparent",
    color: "var(--purity-text)",
  }),
  input: (base) => ({ ...base, color: "var(--purity-text)" }),
  placeholder: (base) => ({ ...base, color: "var(--purity-muted)" }),
  singleValue: (base) => ({ ...base, color: "var(--purity-text)" }),
  indicatorSeparator: () => ({ display: "none" }),
  dropdownIndicator: (base, state) => ({
    ...base,
    color: "var(--purity-muted)",
    padding: 6,
    transform: state.selectProps.menuIsOpen ? "rotate(180deg)" : undefined,
    transition: "transform 0.15s ease",
  }),
  clearIndicator: (base) => ({
    ...base,
    color: "var(--purity-muted)",
    ":hover": { color: "var(--purity-text)" },
  }),
};

export function MultiSelect({
  options,
  value,
  onChange,
  disabled,
  placeholder = "Select…",
  className = "",
  menuPortal = true,
}: Props) {
  const selected = useMemo(() => idsToMultiValue(value, options), [value, options]);

  return (
    <div className={className}>
      <Select<MultiSelectOption, true>
        isMulti
        isDisabled={disabled}
        options={options}
        value={selected}
        onChange={(next) => {
          onChange(next ? next.map((o) => o.value) : []);
        }}
        placeholder={placeholder}
        styles={selectStyles}
        classNamePrefix="purity-react-select"
        menuPortalTarget={menuPortal && typeof document !== "undefined" ? document.body : undefined}
        menuPosition={menuPortal ? "fixed" : "absolute"}
        closeMenuOnSelect={false}
        blurInputOnSelect={false}
        hideSelectedOptions={false}
        noOptionsMessage={() => "No options"}
      />
    </div>
  );
}
