document.addEventListener("DOMContentLoaded", async function () {
  const enableLoggingCheckbox = document.getElementById("enable-logging");
  const clearLogButton = document.getElementById("clear-log");
  const maxEntriesInput = document.getElementById("max-entries");
  const exportLogButton = document.getElementById("export-log");
  const logList = document.getElementById("log");

  await chrome.storage.local.get(
    ["loggingEnabled", "maxEntries", "requests"],
    function (data) {
      enableLoggingCheckbox.checked = data.loggingEnabled || false;
      maxEntriesInput.value = data.maxEntries || 0;
      createLogs(logList, data.requests);
    }
  );

  enableLoggingCheckbox.addEventListener("change", function () {
    chrome.storage.local.set({ loggingEnabled: this.checked });
  });

  clearLogButton.addEventListener("click", function () {
    chrome.storage.local.set({ requests: [] });
    logList.innerHTML = "";
  });

  maxEntriesInput.addEventListener("change", function () {
    const max = parseInt(this.value);

    chrome.storage.local.get("requests", function(data) {
      const truncatedRequests = max ? data.requests.slice(0, max) : data.requests;
      chrome.storage.local.set({requests: truncatedRequests, maxEntries: max});

      if(max && logList.children.length >= max) {
        logList.innerHTML = "";
        createLogs(logList, truncatedRequests)
      }
    })
  });

  exportLogButton.addEventListener("click", exportLog);
});

function createLogs(logList, logs) {
  if (logs) {
    logs.forEach((entry) => {
      const li = document.createElement("li");
      li.innerText = `${entry.method} ${entry.statusLine} ${entry.url}`;
      logList.append(li);
    });
  }
}

function updaetMaxEntries(logList) {
  const max = parseInt(this.value);
  chrome.storage.local.set({maxEntries: parseInt(this.value) });

  
  for (i = logList.children.length - 1; i > max; i--) {
    logList.removeChild(logList.children[i]);
  }

}

function exportLog() {
  chrome.storage.local.get("requests", function (data) {
    const logDataCsv = arrayToCsv(data.requests);
    const blob = new Blob([logDataCsv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    chrome.downloads.download({ url: url, filename: "http_log.csv" });

    URL.revokeObjectURL(url);
  });
}

function arrayToCsv(requests) {
  const headers = Object.keys(requests[0]);

  const headerRow = headers.join(",") + "\n";

  const rows = requests
    .map((obj) => {
      return headers
        .map((header) => {
          const value = obj[header];

          if (header === "responseHeaders") {
            return value
              .map((item) => JSON.stringify(item).replace(/,/g, ""))
              .join(";");
          }

          return value != null ? `"${value}"` : "";
        })
        .join(",");
    })
    .join("\n");

  return headerRow + rows;
}
