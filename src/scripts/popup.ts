import type { Rule } from "./types";

let rowIndex = 0;

document.addEventListener("DOMContentLoaded", () => {
  const headerForm = document.querySelector<HTMLFormElement>("#header-form");
  const formTable = headerForm?.querySelector("table");
  const newRowBtn = document.querySelector<HTMLButtonElement>("#add-row");
  if (!headerForm || !newRowBtn || !formTable) {
    return;
  }

  headerForm.addEventListener("submit", (event) => {
    event.preventDefault();
    onFormSubmit(new FormData(headerForm));
  });
  newRowBtn.addEventListener("click", () => {
    formTable.tBodies.item(0)?.append(createRuleRow(null));
  });

  getStoredRuleConfig().then((rules) => {
    for (const rule of rules) {
      formTable.tBodies.item(0)?.append(createRuleRow(rule));
    }
    formTable.tBodies.item(0)?.append(createRuleRow(null));
  });
});

function createRuleRow(rule: Rule | null): Element {
  const row = document.createElement("tr");
  const headerEnabled = createCheckbox("enabled", rule?.enabled ?? true);
  const headerName = createInputForRule(rule, "header");
  const headerValue = createInputForRule(rule, "value");
  const headerNote = createInputForRule(rule, "note");

  row.append(
    ...[headerEnabled, headerName, headerValue, headerNote].map((node) => {
      const td = document.createElement("td");
      td.classList.add("form-cell");
      td.append(node);
      return td;
    }),
  );
  rowIndex++;
  return row;
}

function createInputForRule(
  rule: Rule | null,
  forField: keyof Omit<Rule, "enabled"> | null,
): HTMLInputElement {
  const input = document.createElement("input");
  input.type = "text";
  input.value = forField ? (rule?.[forField] ?? "") : "";
  input.name = `${forField}-${rowIndex}`;

  return input;
}

function createCheckbox(name: string, checked: boolean): Element {
  const container = document.createElement("div");
  container.classList.add("checkbox-container");
  const input = document.createElement("input");
  const checkmark = document.createElement("span");
  checkmark.classList.add("checkmark");
  input.type = "checkbox";
  input.checked = checked;
  input.name = `${name}-${rowIndex}`;

  checkmark.addEventListener("click", () => (input.checked = !input.checked));

  container.append(input, checkmark);

  return container;
}

function onFormSubmit(data: FormData): void {
  const rules: Rule[] = [];

  let maxIndex = -1;
  for (const key of data.keys()) {
    const match = /-(\d+)$/.exec(key);
    if (match) {
      maxIndex = Math.max(maxIndex, Number.parseInt(match[1]));
    }
  }

  for (let i = 0; i <= maxIndex; i++) {
    const enabled = data.has(`enabled-${i}`);
    const header = data.get(`header-${i}`) ?? "";
    const value = data.get(`value-${i}`) ?? "";
    const note = data.get(`note-${i}`) ?? "";

    if (!header && !value && !note && !enabled) {
      continue;
    }
    if (!formEntryIsString(header) || !formEntryIsString(value) || !formEntryIsString(note)) {
      throw new Error("A value was not a string for some reason");
    }
    rules.push({ enabled, header, value, note });
  }

  chrome.storage.sync.set({ rules });
}

function formEntryIsString(entry: FormDataEntryValue): entry is string {
  return typeof entry === "string";
}

async function getStoredRuleConfig(): Promise<Rule[]> {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get("rules", (result) => {
      if (!("rules" in result)) {
        return reject(new Error("No rules array in storage"));
      }

      resolve(result.rules);
    });
  });
}
