const currency = (value) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value) || 0);

const formSchema = [
  ["projectName", "Project Name"],
  ["billingName", "Billing Name"],
  ["clientName", "Client Name"],
  ["siteLocation", "Site Location"],
  ["gstNo", "GST Number"],
  ["contactPerson", "Contact Person"],
  ["contactNumber", "Contact Number"],
  ["status", "Status", "select", ["running", "completed", "dispute"]],
  ["phase", "Current Phase", "select", ["planning", "execution", "testing", "handover"]],
  ["projectValue", "Project Value", "number"],
  ["officialReceived", "Official Money Received", "number"],
  ["cashReceived", "Cash Payment Received", "number"],
  ["completedPercent", "Work Completed (%)", "number"],
  ["expectedDate", "Expected Date", "date"],
  ["remark", "Remark", "textarea"],
  ["projectDetails", "Project Details", "textarea"],
];

let projects = [
  {
    id: crypto.randomUUID(),
    projectName: "Northern Heights Plant Upgrade",
    billingName: "NSE-BILL-PLANT-011",
    clientName: "Apex Industrial Components",
    siteLocation: "Surat, Gujarat",
    gstNo: "24AAECN7788M1ZU",
    contactPerson: "Rakesh Patel",
    contactNumber: "+91-9876543210",
    status: "running",
    phase: "execution",
    projectValue: 12500000,
    officialReceived: 7200000,
    cashReceived: 1400000,
    completedPercent: 62,
    expectedDate: "2026-02-20",
    remark: "Material dispatch in progress",
    projectDetails: "Automation panel replacement, cable routing and testing."
  },
  {
    id: crypto.randomUUID(),
    projectName: "Metro Pumping Station Retrofit",
    billingName: "NSE-BILL-MPS-021",
    clientName: "City Water Board",
    siteLocation: "Vadodara, Gujarat",
    gstNo: "24AACCM2219M1ZD",
    contactPerson: "Karan Shah",
    contactNumber: "+91-9797979797",
    status: "dispute",
    phase: "testing",
    projectValue: 8400000,
    officialReceived: 4500000,
    cashReceived: 600000,
    completedPercent: 75,
    expectedDate: "2026-01-05",
    remark: "Commercial clearance under review",
    projectDetails: "PLC and SCADA migration with compliance validations."
  },
  {
    id: crypto.randomUUID(),
    projectName: "Solar Grid Commissioning Block-C",
    billingName: "NSE-BILL-SOLAR-018",
    clientName: "SunBridge Energy",
    siteLocation: "Rajkot, Gujarat",
    gstNo: "24AAPCS4444M1ZH",
    contactPerson: "Priya Mehta",
    contactNumber: "+91-9012345678",
    status: "completed",
    phase: "handover",
    projectValue: 5300000,
    officialReceived: 5000000,
    cashReceived: 200000,
    completedPercent: 100,
    expectedDate: "2025-11-10",
    remark: "Final sign-off done",
    projectDetails: "Substation integration and load balancing completed."
  }
];

let selectedProjectId = null;
let editingProjectId = null;
let statusChart;
let moneyChart;

const tableBody = document.getElementById("projectTableBody");
const detailPanel = document.getElementById("detailPanel");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const phaseFilter = document.getElementById("phaseFilter");
const addProjectBtn = document.getElementById("addProjectBtn");
const kpiGrid = document.getElementById("kpiGrid");
const projectDialog = document.getElementById("projectDialog");
const projectForm = document.getElementById("projectForm");
const formFields = document.getElementById("formFields");
const dialogTitle = document.getElementById("dialogTitle");
const chartWarning = document.createElement("p");
chartWarning.className = "placeholder";
chartWarning.textContent = "Charts unavailable (Chart.js failed to load), but all dashboard buttons and project details still work.";

const calculatePending = (p) => Math.max(0, Number(p.projectValue) - Number(p.officialReceived) - Number(p.cashReceived));

function buildForm() {
  formFields.innerHTML = formSchema.map(([key, label, type = "text", options]) => {
    if (type === "select") {
      return `<label>${label}<select name="${key}" required>${options
        .map((opt) => `<option value="${opt}">${opt}</option>`)
        .join("")}</select></label>`;
    }
    if (type === "textarea") {
      return `<label>${label}<textarea name="${key}" rows="2" required></textarea></label>`;
    }
    return `<label>${label}<input name="${key}" type="${type}" required /></label>`;
  }).join("");
}

function getFilteredProjects() {
  const term = searchInput.value.trim().toLowerCase();
  return projects.filter((project) => {
    const matchesSearch = !term || [
      project.projectName,
      project.billingName,
      project.clientName,
      project.siteLocation,
      project.contactPerson
    ].some((v) => v.toLowerCase().includes(term));
    const matchesStatus = statusFilter.value === "all" || project.status === statusFilter.value;
    const matchesPhase = phaseFilter.value === "all" || project.phase === phaseFilter.value;
    return matchesSearch && matchesStatus && matchesPhase;
  });
}

function renderKPIs(list) {
  const totalValue = list.reduce((sum, p) => sum + Number(p.projectValue), 0);
  const official = list.reduce((sum, p) => sum + Number(p.officialReceived), 0);
  const cash = list.reduce((sum, p) => sum + Number(p.cashReceived), 0);
  const pending = list.reduce((sum, p) => sum + calculatePending(p), 0);
  const avgCompletion = list.length ? Math.round(list.reduce((sum, p) => sum + Number(p.completedPercent), 0) / list.length) : 0;

  kpiGrid.innerHTML = `
    <article class="kpi"><h3>Total Value</h3><strong>${currency(totalValue)}</strong></article>
    <article class="kpi"><h3>Official Received</h3><strong>${currency(official)}</strong></article>
    <article class="kpi"><h3>Cash Received</h3><strong>${currency(cash)}</strong></article>
    <article class="kpi"><h3>Pending Amount</h3><strong>${currency(pending)}</strong></article>
    <article class="kpi"><h3>Average Completion</h3><strong>${avgCompletion}%</strong></article>
    <article class="kpi"><h3>Project Count</h3><strong>${list.length}</strong></article>
  `;
}

function renderTable() {
  const list = getFilteredProjects();
  renderKPIs(list);

  tableBody.innerHTML = list.map((project) => `
    <tr data-project-id="${project.id}" class="project-row">
      <td>
        <strong>${project.projectName}</strong>
        <div>${project.billingName}</div>
      </td>
      <td><span class="status-pill status-${project.status}"><i class="fa-solid fa-circle"></i> ${project.status}</span></td>
      <td>${project.phase}</td>
      <td>${currency(project.projectValue)}</td>
      <td>${currency(project.officialReceived)}</td>
      <td>${currency(project.cashReceived)}</td>
      <td>${currency(calculatePending(project))}</td>
      <td>${project.expectedDate}</td>
      <td>
        <button type="button" class="ghost-btn" data-action="view" data-id="${project.id}" title="View"><i class="fa-solid fa-eye"></i></button>
        <button type="button" class="ghost-btn" data-action="edit" data-id="${project.id}" title="Edit"><i class="fa-solid fa-pen"></i></button>
      </td>
    </tr>
  `).join("");

  if (!selectedProjectId && list.length) {
    selectedProjectId = list[0].id;
  }
  if (selectedProjectId && !list.some((p) => p.id === selectedProjectId)) {
    selectedProjectId = list[0]?.id ?? null;
  }
  renderDetails(selectedProjectId);
  renderCharts(list);
}

function renderDetails(projectId) {
  const project = projects.find((p) => p.id === projectId);
  if (!project) {
    detailPanel.innerHTML = `<h2><i class="fa-solid fa-circle-info"></i> Project Details</h2><p class="placeholder">No project selected.</p>`;
    return;
  }
  selectedProjectId = projectId;

  const phases = ["planning", "execution", "testing", "handover"];
  const activeIndex = phases.indexOf(project.phase);

  detailPanel.innerHTML = `
    <div class="panel-head">
      <h2>${project.projectName}</h2>
      <button class="primary-btn" id="exportProjectBtn"><i class="fa-solid fa-file-pdf"></i> Export PDF</button>
    </div>
    <p><strong>Billing:</strong> ${project.billingName}</p>
    <div class="detail-card">
      <section class="detail-group">
        <h4>Client Details</h4>
        <p><strong>Client:</strong> ${project.clientName}</p>
        <p><strong>Site:</strong> ${project.siteLocation}</p>
        <p><strong>Contact:</strong> ${project.contactPerson} (${project.contactNumber})</p>
        <p><strong>GST:</strong> ${project.gstNo}</p>
      </section>
      <section class="detail-group">
        <h4>Financial Overview</h4>
        <p><strong>Project Value:</strong> ${currency(project.projectValue)}</p>
        <p><strong>Official Received:</strong> ${currency(project.officialReceived)}</p>
        <p><strong>Cash Received:</strong> ${currency(project.cashReceived)}</p>
        <p><strong>Pending Amount:</strong> ${currency(calculatePending(project))}</p>
        <p><strong>Formula:</strong> Total Value - Money Received - Cash Received = Pending Amount</p>
      </section>
      <section class="detail-group">
        <h4>Progress & Timeline</h4>
        <p><strong>Status:</strong> ${project.status}</p>
        <p><strong>Work Completed:</strong> ${project.completedPercent}%</p>
        <p><strong>Expected Date:</strong> ${project.expectedDate}</p>
        <div class="phase-line">
          ${phases.map((phase, index) => `<div class="phase-item ${index <= activeIndex ? "active" : ""}">${phase}</div>`).join("")}
        </div>
      </section>
      <section class="detail-group">
        <h4>Project Notes</h4>
        <p>${project.projectDetails}</p>
        <p><strong>Remark:</strong> ${project.remark}</p>
      </section>
    </div>
  `;

  document.getElementById("exportProjectBtn").addEventListener("click", () => exportProjectPDF(project));
}

function renderCharts(list) {
  const chartCtor = window.Chart;
  if (!chartCtor) {
    statusChart?.destroy?.();
    moneyChart?.destroy?.();
    const statusCanvas = document.getElementById("statusChart");
    const moneyCanvas = document.getElementById("moneyChart");
    statusCanvas.style.display = "none";
    moneyCanvas.style.display = "none";
    if (!statusCanvas.parentElement.querySelector(".placeholder")) {
      statusCanvas.parentElement.append(chartWarning.cloneNode(true));
      moneyCanvas.parentElement.append(chartWarning.cloneNode(true));
    }
    return;
  }

  const statusData = ["running", "completed", "dispute"].map(
    (status) => list.filter((project) => project.status === status).length
  );

  const totals = {
    value: list.reduce((sum, p) => sum + Number(p.projectValue), 0),
    official: list.reduce((sum, p) => sum + Number(p.officialReceived), 0),
    cash: list.reduce((sum, p) => sum + Number(p.cashReceived), 0),
    pending: list.reduce((sum, p) => sum + calculatePending(p), 0)
  };

  statusChart?.destroy();
  moneyChart?.destroy();

  statusChart = new chartCtor(document.getElementById("statusChart"), {
    type: "doughnut",
    data: {
      labels: ["Running", "Completed", "Dispute"],
      datasets: [{ data: statusData, backgroundColor: ["#f59e0b", "#0ea56a", "#e11d48"] }]
    },
    options: { plugins: { legend: { position: "bottom" } } }
  });

  moneyChart = new chartCtor(document.getElementById("moneyChart"), {
    type: "bar",
    data: {
      labels: ["Project Value", "Official Received", "Cash Received", "Pending"],
      datasets: [{
        data: [totals.value, totals.official, totals.cash, totals.pending],
        backgroundColor: ["#2563eb", "#14b8a6", "#8b5cf6", "#f97316"],
        borderRadius: 8
      }]
    },
    options: { plugins: { legend: { display: false } } }
  });
}

function exportProjectPDF(project) {
  const popup = window.open("", "_blank");
  if (!popup) return;
  popup.document.write(`
    <html><head><title>${project.projectName}</title>
    <style>body{font-family:Arial;padding:20px}h1{margin-bottom:0}small{color:#666}table{width:100%;border-collapse:collapse;margin-top:10px}td{border:1px solid #ddd;padding:8px}</style>
    </head><body>
      <h1>${project.projectName}</h1>
      <small>${project.billingName}</small>
      <table>
        <tr><td>Client</td><td>${project.clientName}</td></tr>
        <tr><td>Contact</td><td>${project.contactPerson} (${project.contactNumber})</td></tr>
        <tr><td>GST</td><td>${project.gstNo}</td></tr>
        <tr><td>Total Value</td><td>${currency(project.projectValue)}</td></tr>
        <tr><td>Official Received</td><td>${currency(project.officialReceived)}</td></tr>
        <tr><td>Cash Received</td><td>${currency(project.cashReceived)}</td></tr>
        <tr><td>Pending</td><td>${currency(calculatePending(project))}</td></tr>
        <tr><td>Status</td><td>${project.status}</td></tr>
        <tr><td>Phase</td><td>${project.phase}</td></tr>
        <tr><td>Completion</td><td>${project.completedPercent}%</td></tr>
        <tr><td>Remark</td><td>${project.remark}</td></tr>
      </table>
      <p><b>Formula:</b> Total Value - Money Received - Cash Received = Pending Amount</p>
      <p>Developed by Abhishek Jariwala</p>
    </body></html>
  `);
  popup.document.close();
  popup.focus();
  popup.print();
}

function exportDashboardPDF() {
  window.print();
}

function openDialog(mode, project = null) {
  editingProjectId = mode === "edit" ? project.id : null;
  dialogTitle.textContent = mode === "edit" ? "Edit Project" : "Add Project";

  formSchema.forEach(([key, , type]) => {
    const field = projectForm.elements[key];
    field.value = project?.[key] ?? (type === "number" ? 0 : "");
  });

  if (typeof projectDialog.showModal === "function") {
    projectDialog.showModal();
    return;
  }
  projectDialog.setAttribute("open", "open");
}

function closeDialog() {
  if (typeof projectDialog.close === "function") {
    projectDialog.close();
  } else {
    projectDialog.removeAttribute("open");
  }
}

function upsertProject(formData) {
  const data = Object.fromEntries(formData.entries());
  const projectRecord = {
    ...data,
    projectValue: Number(data.projectValue),
    officialReceived: Number(data.officialReceived),
    cashReceived: Number(data.cashReceived),
    completedPercent: Number(data.completedPercent)
  };

  if (editingProjectId) {
    projects = projects.map((p) => (p.id === editingProjectId ? { ...p, ...projectRecord } : p));
    selectedProjectId = editingProjectId;
  } else {
    const newProject = { id: crypto.randomUUID(), ...projectRecord };
    projects.unshift(newProject);
    selectedProjectId = newProject.id;
  }
  renderTable();
}

[searchInput, statusFilter, phaseFilter].forEach((el) => el.addEventListener("input", renderTable));
[statusFilter, phaseFilter].forEach((el) => el.addEventListener("change", renderTable));

addProjectBtn.addEventListener("click", () => openDialog("add"));
document.getElementById("cancelDialog").addEventListener("click", closeDialog);
document.getElementById("closeDialog").addEventListener("click", closeDialog);
document.getElementById("exportDashboardBtn").addEventListener("click", exportDashboardPDF);

projectForm.addEventListener("submit", (event) => {
  event.preventDefault();
  upsertProject(new FormData(projectForm));
  closeDialog();
});

tableBody.addEventListener("click", (event) => {
  const actionBtn = event.target.closest("button[data-action]");
  if (actionBtn) {
    const { id, action } = actionBtn.dataset;
    const project = projects.find((p) => p.id === id);
    if (!project) return;
    if (action === "view") renderDetails(id);
    if (action === "edit") openDialog("edit", project);
    return;
  }

  const row = event.target.closest("tr[data-project-id]");
  if (row) {
    renderDetails(row.dataset.projectId);
  }
});

buildForm();
renderTable();