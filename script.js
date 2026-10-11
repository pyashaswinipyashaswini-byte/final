/* =========================================================
   LABSECURE ACCESS VERIFICATION SYSTEM
   Main: Hash Table with Separate Chaining
   Integrated: Arrays, Stacks, Queues, Linked Lists,
               Searching, Sorting and Trees
   ========================================================= */

"use strict";

const TABLE_SIZE = 7;

let researchers = [
  { id: "R-101", name: "Maya Chen",    zone: "Genomics",      revoked: false },
  { id: "R-104", name: "Arjun Rao",    zone: "Wet Lab",       revoked: false },
  { id: "R-102", name: "Nina Patel",   zone: "Cold Storage",  revoked: false },
  { id: "R-103", name: "Daniel Kim",   zone: "Biosecurity",   revoked: true  },
  { id: "R-105", name: "Sara Thomas",  zone: "Genomics",      revoked: false }
];

// Module 1: Array-based hash table
let hashTable = Array.from({ length: TABLE_SIZE }, () => []);

// Module 1: Stack
let actionStack = [];

// Module 2: FIFO request queue
let requestQueue = [];
let nextRequestId = 1;

// Module 2: Singly linked-list activity history
let activityHead = null;
let activityTail = null;
let activityCount = 0;

// Session statistics
let approvedCount = 0;
let deniedCount = 0;

const $ = id => document.getElementById(id);

/* ---------- Safe HTML rendering ---------- */

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function initials(name) {
  return name.split(/\s+/).filter(Boolean)
    .slice(0, 2).map(part => part[0].toUpperCase()).join("");
}

function now() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

/* ---------- HASH TABLE ---------- */

// Sum the character codes of the ID, then use modulo 7.
// This is an educational hash function, not a security hash.
function hashFunction(id) {
  let sum = 0;
  for (const char of id.toUpperCase()) {
    sum += char.charCodeAt(0);
  }
  return sum % TABLE_SIZE;
}

// Build the bucket array. Multiple records may share one bucket.
function rebuildHashTable() {
  hashTable = Array.from({ length: TABLE_SIZE }, () => []);

  for (const researcher of researchers) {
    const index = hashFunction(researcher.id);
    hashTable[index].push(researcher);
  }
}

// Find by ID using the hash index and then compare IDs in that bucket.
function findResearcher(id) {
  const normalizedId = id.trim().toUpperCase();
  const index = hashFunction(normalizedId);
  const chain = hashTable[index];

  const position = chain.findIndex(
    researcher => researcher.id === normalizedId
  );

  return {
    index,
    chainLength: chain.length,
    position,
    researcher: position >= 0 ? chain[position] : null
  };
}

function collisionCount() {
  return hashTable.reduce(
    (total, bucket) => total + Math.max(0, bucket.length - 1),
    0
  );
}

/* ---------- LINKED-LIST ACTIVITY HISTORY ---------- */

function addActivity(type, message) {
  const node = {
    type,
    message,
    time: new Date(),
    next: null
  };

  if (activityTail) {
    activityTail.next = node;
  } else {
    activityHead = node;
  }

  activityTail = node;
  activityCount++;

  // The linked list grows dynamically for this demonstration.
  renderActivity();
}

// Traverse from the head to the end of the linked list.
function getActivityArray() {
  const entries = [];
  let current = activityHead;

  while (current !== null) {
    entries.push(current);
    current = current.next;
  }

  return entries.reverse();
}

function renderActivity() {
  const entries = getActivityArray();

  $("activityList").innerHTML = entries.length
    ? entries.map(entry => `
      <div class="activity-item">
        <div class="activity-mark">${activitySymbol(entry.type)}</div>
        <div class="activity-copy">
          <strong>${escapeHTML(entry.type)}</strong>
          <p>${escapeHTML(entry.message)}</p>
        </div>
        <time>${escapeHTML(entry.time.toLocaleTimeString([], {
          hour: "2-digit", minute: "2-digit"
        }))}</time>
      </div>
    `).join("")
    : '<p class="helper">No activity recorded yet.</p>';
}

function activitySymbol(type) {
  if (type.includes("GRANTED")) return "✓";
  if (type.includes("DENIED") || type.includes("REVOKED")) return "!";
  if (type.includes("ADDED")) return "+";
  if (type.includes("REQUEST")) return "↔";
  return "•";
}

/* ---------- STACK ---------- */

function pushAction(message) {
  actionStack.push({
    message,
    time: now()
  });

  renderStack();
  updateStats();
}

function renderStack() {
  const entries = actionStack.slice().reverse();

  $("stackList").innerHTML = entries.length
    ? entries.slice(0, 8).map((entry, index) => `
      <div class="stack-item ${index === 0 ? "top" : ""}">
        <div>
          <strong>${escapeHTML(entry.message)}</strong>
          <small>${escapeHTML(entry.time)}</small>
        </div>
        <span class="stack-label">${index === 0 ? "TOP" : "ACTION"}</span>
      </div>
    `).join("")
    : '<p class="helper">No actions in the stack.</p>';
}

/* ---------- RESEARCHER DIRECTORY ---------- */

function renderResearchers() {
  const query = $("searchInput").value.trim().toLowerCase();
  const status = $("statusFilter").value;
  const sortBy = $("sortBy").value;

  let visible = researchers.filter(researcher => {
    const matchesQuery =
      researcher.id.toLowerCase().includes(query) ||
      researcher.name.toLowerCase().includes(query) ||
      researcher.zone.toLowerCase().includes(query);

    const currentStatus = researcher.revoked ? "Revoked" : "Active";
    const matchesStatus = status === "all" || currentStatus === status;

    return matchesQuery && matchesStatus;
  });

  // Module 3: Sorting.
  visible.sort((a, b) => sortBy === "name"
    ? a.name.localeCompare(b.name)
    : a.id.localeCompare(b.id)
  );

  $("researcherRows").innerHTML = visible.length
    ? visible.map(researcher => `
      <tr>
        <td>
          <div class="person">
            <div class="initials">${escapeHTML(initials(researcher.name))}</div>
            <div>
              <strong>${escapeHTML(researcher.name)}</strong>
              <small>Research personnel</small>
            </div>
          </div>
        </td>
        <td><span class="id-tag">${escapeHTML(researcher.id)}</span></td>
        <td>${escapeHTML(researcher.zone)}</td>
        <td>
          <span class="status ${researcher.revoked ? "revoked" : "active"}">
            ${researcher.revoked ? "Revoked" : "Active"}
          </span>
        </td>
        <td>
          <button class="icon-button" data-toggle="${escapeHTML(researcher.id)}"
            title="${researcher.revoked ? "Restore access" : "Revoke access"}">
            ${researcher.revoked ? "↻" : "•••"}
          </button>
        </td>
      </tr>
    `).join("")
    : '<tr><td colspan="5">No matching researchers found.</td></tr>';

  updateStats();
}

$("researcherRows").addEventListener("click", event => {
  const button = event.target.closest("[data-toggle]");
  if (!button) return;

  const id = button.dataset.toggle;
  const found = findResearcher(id);
  if (!found.researcher) return;

  found.researcher.revoked = !found.researcher.revoked;

  const message = `${id} ${found.researcher.revoked
    ? "access revoked"
    : "access restored"} in the simulation`;

  pushAction(message);
  addActivity(
    found.researcher.revoked ? "ACCESS REVOKED" : "ACCESS RESTORED",
    message
  );

  renderResearchers();
  renderHashBuckets();
  toast(message);
});

$("searchInput").addEventListener("input", renderResearchers);
$("statusFilter").addEventListener("change", renderResearchers);
$("sortBy").addEventListener("change", renderResearchers);

/* Exact ID searches go directly through the hash table. */
$("searchInput").addEventListener("change", () => {
  const value = $("searchInput").value.trim();
  if (/^R-\d+$/i.test(value)) {
    const found = findResearcher(value);
    $("directoryMessage").textContent = found.researcher
      ? `Hash lookup: ${value.toUpperCase()} found in bucket ${found.index}.`
      : `Hash lookup: ${value.toUpperCase()} was not found in bucket ${found.index}.`;
  } else {
    $("directoryMessage").textContent =
      "Name and partial searches filter the directory; exact IDs use hashing.";
  }
});

/* ---------- ADD RESEARCHER ---------- */

$("showAdd").onclick = () => {
  $("addForm").classList.toggle("hidden");
};

$("cancelAdd").onclick = () => {
  $("addForm").reset();
  $("addForm").classList.add("hidden");
};

$("addForm").addEventListener("submit", event => {
  event.preventDefault();

  const id = $("newId").value.trim().toUpperCase();
  const name = $("newName").value.trim();
  const zone = $("newZone").value;

  if (!/^R-\d{3,}$/.test(id)) {
    toast("Use a researcher ID such as R-106.");
    return;
  }

  if (!name) {
    toast("Enter the researcher's name.");
    return;
  }

  if (findResearcher(id).researcher) {
    toast("That researcher ID already exists.");
    return;
  }

  const researcher = { id, name, zone, revoked: false };
  researchers.push(researcher);

  rebuildHashTable();

  const index = hashFunction(id);
  const message = `${id} added to bucket ${index}`;

  pushAction(message);
  addActivity("RESEARCHER ADDED", `${name} (${id}) registered for ${zone}.`);

  $("addForm").reset();
  $("addForm").classList.add("hidden");

  renderResearchers();
  renderHashBuckets();
  renderRequesterOptions();
  toast(message);
});

/* ---------- HASH TABLE VISUALIZER ---------- */

function renderHashBuckets(highlightIndex = -1) {
  $("hashBuckets").innerHTML = hashTable.map((bucket, index) => `
    <div class="bucket ${index === highlightIndex ? "highlight" : ""}">
      <div class="bucket-title">BUCKET ${index}</div>
      ${bucket.length
        ? bucket.map((researcher, position) => `
          <div class="bucket-node">
            ${escapeHTML(researcher.id)}
            <small>${escapeHTML(researcher.name)}${position < bucket.length - 1 ? " →" : ""}</small>
          </div>
        `).join("")
        : '<div class="empty-bucket">Empty</div>'}
    </div>
  `).join("");
}

$("findHash").onclick = () => {
  const id = $("hashSearch").value.trim().toUpperCase();

  if (!id) {
    toast("Enter a researcher ID.");
    return;
  }

  const found = findResearcher(id);

  $("hashResult").textContent = found.researcher
    ? `FOUND: ${found.researcher.name} (${found.researcher.id}). Hash index: ${found.index}. Chain position: ${found.position + 1}. Bucket records: ${found.chainLength}.`
    : `NOT FOUND: ${id}. Hash index: ${found.index}. Bucket records checked: ${found.chainLength}.`;

  renderHashBuckets(found.index);
  $("directoryMessage").textContent = found.researcher
    ? `Hash lookup located ${id} in bucket ${found.index}.`
    : `No record matched ${id} in bucket ${found.index}.`;
};

$("showBuckets").onclick = () => {
  $("hashResult").textContent =
    `Hash table contains ${TABLE_SIZE} buckets and ${researchers.length} researcher records. Collision count: ${collisionCount()}.`;
  renderHashBuckets();
};

/* ---------- FIFO ACCESS REQUEST QUEUE ---------- */

function renderRequesterOptions() {
  const previous = $("requester").value;

  $("requester").innerHTML = researchers.map(researcher => `
    <option value="${escapeHTML(researcher.id)}">
      ${escapeHTML(researcher.name)} (${escapeHTML(researcher.id)})
    </option>
  `).join("");

  if (researchers.some(r => r.id === previous)) {
    $("requester").value = previous;
  }
}

function renderQueue() {
  $("queueList").innerHTML = requestQueue.length
    ? requestQueue.map((request, index) => `
      <div class="queue-item">
        <div>
          <strong>${escapeHTML(request.id)} · ${escapeHTML(request.name)}</strong>
          <small>Requested area: ${escapeHTML(request.zone)}</small>
        </div>
        <span class="queue-number">${index === 0 ? "NEXT" : `#${index + 1}`}</span>
      </div>
    `).join("")
    : '<p class="helper">No pending access requests.</p>';

  $("queueCount").textContent = `${requestQueue.length} pending`;
  $("queueBadge").textContent = requestQueue.length;
  $("pendingRequests").textContent = requestQueue.length;
}

$("requestForm").addEventListener("submit", event => {
  event.preventDefault();

  const id = $("requester").value;
  const zone = $("requestedZone").value;
  const found = findResearcher(id);

  if (!found.researcher) {
    toast("Researcher not found.");
    return;
  }

  const request = {
    requestId: nextRequestId++,
    id,
    name: found.researcher.name,
    zone,
    submittedAt: now()
  };

  requestQueue.push(request);

  addActivity(
    "REQUEST SUBMITTED",
    `${request.name} (${id}) requested access to ${zone}.`
  );

  renderQueue();
  toast("Request added to the FIFO queue.");
});

$("processNext").onclick = () => {
  if (!requestQueue.length) {
    toast("The request queue is empty.");
    return;
  }

  // FIFO: remove the oldest request.
  const request = requestQueue.shift();
  const found = findResearcher(request.id);

  const allowed = Boolean(
    found.researcher &&
    !found.researcher.revoked &&
    found.researcher.zone === request.zone
  );

  if (allowed) {
    approvedCount++;
  } else {
    deniedCount++;
  }

  const outcome = allowed ? "ACCESS GRANTED" : "ACCESS DENIED";

  const reason = !found.researcher
    ? "Researcher record not found."
    : found.researcher.revoked
      ? "Researcher access has been revoked."
      : found.researcher.zone !== request.zone
        ? `No permission for ${request.zone}.`
        : `Permission for ${request.zone} verified in the simulation.`;

  pushAction(`${outcome}: ${request.id} → ${request.zone}`);

  addActivity(
    outcome,
    `${request.name} (${request.id}) → ${request.zone}. ${reason}`
  );

  renderQueue();
  renderStats();
  toast(`${outcome}: ${request.name}. ${reason}`);
};

/* ---------- TREE: LABORATORY HIERARCHY ---------- */

const zoneTree = {
  name: "Research Facility",
  children: [
    {
      name: "Genomics",
      children: [{ name: "DNA Analysis", children: [] }]
    },
    {
      name: "Wet Lab",
      children: [{ name: "Sample Preparation", children: [] }]
    },
    {
      name: "Cold Storage",
      children: []
    },
    {
      name: "Biosecurity",
      children: [{ name: "Restricted Chamber", children: [] }]
    }
  ]
};

function findZoneNode(node, name, parent = "None", depth = 0) {
  if (node.name === name) return { node, parent, depth };

  for (const child of node.children) {
    const result = findZoneNode(child, name, node.name, depth + 1);
    if (result) return result;
  }

  return null;
}

function renderTree(node, container, parent = null, depth = 0) {
  if (depth === 0) {
    const rootRow = document.createElement("div");
    rootRow.className = "tree-row";
    container.appendChild(rootRow);
    renderTreeNode(node, rootRow, parent, depth, container);
    return;
  }

  const line = document.createElement("div");
  line.className = "tree-line";
  container.appendChild(line);

  const row = document.createElement("div");
  row.className = "tree-row";
  container.appendChild(row);

  renderTreeNode(node, row, parent, depth, container);
}

function renderTreeNode(node, row, parent, depth, container) {
  const button = document.createElement("button");
  button.className = "tree-node";
  button.textContent = node.name;

  button.onclick = () => {
    container.querySelectorAll(".tree-node")
      .forEach(item => item.classList.remove("selected"));

    button.classList.add("selected");

    const info = findZoneNode(zoneTree, node.name);
    $("zoneInfo").textContent =
      `Zone: ${node.name} · Parent: ${info.parent} · ` +
      `Depth: ${info.depth} · Direct subzones: ${node.children.length}`;
  };

  row.appendChild(button);

  if (node.children.length) {
    node.children.forEach(child =>
      renderTree(child, container, node.name, depth + 1)
    );
  }
}

renderTree(zoneTree, $("zoneTree"));

/* ---------- ACCESS CHECK VIA HASH TABLE ---------- */

$("zoneTree").addEventListener("click", event => {
  const button = event.target.closest(".tree-node");
  if (!button) return;

  const zone = button.textContent;
  const options = [...$("requestedZone").options];

  if (options.some(option => option.value === zone)) {
    $("requestedZone").value = zone;
  }
});

/* ---------- STATISTICS ---------- */

function renderStats() {
  $("totalResearchers").textContent = researchers.length;
  $("pendingRequests").textContent = requestQueue.length;
  $("approvedToday").textContent = approvedCount;
  $("actionCount").textContent = actionStack.length;
}

function updateStats() {
  renderStats();
}

/* ---------- CSV AUDIT EXPORT: EXTRA FEATURE ---------- */

$("exportCsv").onclick = () => {
  const entries = getActivityArray();

  if (!entries.length) {
    toast("No activity available to export.");
    return;
  }

  const escapeCSV = value =>
    '"' + String(value).replace(/"/g, '""') + '"';

  const rows = [
    ["Event", "Description", "Timestamp"],
    ...entries.map(entry => [
      entry.type,
      entry.message,
      entry.time.toISOString()
    ])
  ];

  const csv = rows.map(row => row.map(escapeCSV).join(",")).join("\r\n");
  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "LabSecure_Audit_Log.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);

  toast("Audit CSV export started.");
};

/* ---------- STACK POP ---------- */

$("undoAction").onclick = () => {
  if (!actionStack.length) {
    toast("The action stack is empty.");
    return;
  }

  const removed = actionStack.pop();
  renderStack();
  renderStats();

  // Deliberately retain the linked-list audit record.
  addActivity(
    "STACK POP",
    `Removed demonstration stack entry: ${removed.message}. Access permissions were not changed.`
  );

  toast("Latest stack entry removed.");
};

/* ---------- NOTIFICATIONS ---------- */

let toastTimeout;

function toast(message) {
  const element = $("toast");
  element.textContent = message;
  element.classList.add("show");

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    element.classList.remove("show");
  }, 3000);
}

/* ---------- INITIALIZE ---------- */

rebuildHashTable();
renderResearchers();
renderHashBuckets();
renderQueue();
renderStack();
renderActivity();
renderRequesterOptions();
renderStats();

addActivity(
  "SYSTEM INITIALIZED",
  `LabSecure started with ${researchers.length} sample researcher records and ${TABLE_SIZE} hash buckets.`
);