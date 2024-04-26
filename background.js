chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason !== "install") return;
  await chrome.storage.local.set({
    loggingEnabled: true,
    log: [],
    maxEntries: 0,
  });
});

chrome.webRequest.onCompleted.addListener(
  async function (details) {
    await chrome.storage.local.get(
      ["requests", "maxEntries", "loggingEnabled"],
      function (data) {
        if (!data.loggingEnabled) return;

        let requests = data.requests || [];
        if (data.maxEntries && requests.length >= data.maxEntries)
          requests.pop();
        requests.unshift(details);

        chrome.storage.local.set({ requests: requests });
      }
    );
  },
  { urls: ["<all_urls>"] },
  ["responseHeaders"]
);
