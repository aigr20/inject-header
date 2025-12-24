import type { Rule } from "./types";

chrome.storage.sync.onChanged.addListener((changes) => {
  if ("rules" in changes) {
    updateRules(changes.rules.newValue);
  }
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ rules: [] });
});

function updateRules(rules: Rule[]): void {
  chrome.declarativeNetRequest.getDynamicRules({}, (current) => doUpdateRules(current, rules));
}

function doUpdateRules(
  currentRules: chrome.declarativeNetRequest.Rule[],
  setNewRules: Rule[],
): void {
  const ruleIds = currentRules.map((rule) => rule.id);
  let id = 1;
  const createRules: chrome.declarativeNetRequest.Rule[] = setNewRules
    .filter((rule) => rule.enabled)
    .map(
      (rule): chrome.declarativeNetRequest.Rule => ({
        id: id++,
        condition: {
          resourceTypes: [
            "csp_report",
            "font",
            "image",
            "main_frame",
            "media",
            "object",
            "ping",
            "script",
            "stylesheet",
            "sub_frame",
            "websocket",
            "xmlhttprequest",
            "other",
          ],
        },
        action: {
          type: "modifyHeaders",
          requestHeaders: [{ header: rule.header, value: rule.value, operation: "set" }],
        },
      }),
    );
  chrome.declarativeNetRequest.updateDynamicRules(
    {
      addRules: createRules,
      removeRuleIds: ruleIds,
    },
    () => {},
  );
}
