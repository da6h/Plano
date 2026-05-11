// ============================================================
// kanban.js - إدارة المهام في لوحة Kanban
// ============================================================

document.addEventListener("DOMContentLoaded", function () {
    loadTasks();

const form = document.getElementById("task-form");
    if (form) {
        form.addEventListener("submit", function (e) {
            e.preventDefault();
            if (validateTaskForm()) {
                submitTask();
            }
        });
    }
});

function submitTask() {
    const name     = document.getElementById("task-name").value.trim();
    const category = document.getElementById("task-category").value;
    const deadline = document.getElementById("task-deadline").value;

    fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            task_name: name,
            task_category: category,
            task_deadline: deadline || null,
            task_status: "todo"
        })
    })
    .then(function (res) { return res.json(); })
    .then(function (data) {
        if (data.success) {
            document.getElementById("task-form").reset();
            clearErrors();
            loadTasks();
        } else {
            showServerErrors(data.errors);
        }
    })
    .catch(function () { alert("حدث خطأ في الاتصال بالسيرفر."); });
}

function loadTasks() {
    fetch("/api/tasks")
        .then(function (res) { return res.json(); })
        .then(function (data) {
            if (data.success) {
                renderTasks(data.tasks);
                checkDeadlines(data.tasks);
            }
        })
        .catch(function () { console.error("تعذّر تحميل المهام."); });
}

function renderTasks(tasks) {
    var lists = {
        todo:  document.getElementById("list-todo"),
        doing: document.getElementById("list-doing"),
        done:  document.getElementById("list-done")
    };

    Object.keys(lists).forEach(function (key) { lists[key].innerHTML = ""; });

    var counts = { todo: 0, doing: 0, done: 0 };

    tasks.forEach(function (task) {
        var status = task.task_status;
        if (!lists[status]) return;
        counts[status]++;

        var li = document.createElement("li");
        li.className = "task-card";
        li.setAttribute("data-id", task.id);

        var categoryInfo = getCategoryInfo(task.task_category);
        var deadlineText = task.task_deadline
            ? "<span class='task-date'><span class='date-icon'>📅</span>" + formatDate(task.task_deadline) + "</span>"
            : "";

        // أزرار دوائر بأيقونة فقط + tooltip
        var actionBtns = "";
        if (status === "todo") {
            actionBtns =
                "<button class='action-btn btn-doing' onclick='changeStatus(" + task.id + ", \"doing\")' title='جارية'>←</button>" +
                "<button class='action-btn btn-done'  onclick='changeStatus(" + task.id + ", \"done\")'  title='مكتملة'>✔</button>";
        } else if (status === "doing") {
            actionBtns =
                "<button class='action-btn btn-todo'  onclick='changeStatus(" + task.id + ", \"todo\")'  title='لم تبدأ'>→</button>" +
                "<button class='action-btn btn-done'  onclick='changeStatus(" + task.id + ", \"done\")'  title='مكتملة'>←</button>";
        } else {
            actionBtns =
                "<button class='action-btn btn-doing' onclick='changeStatus(" + task.id + ", \"doing\")' title='جارية'>→</button>";
        }

        li.innerHTML =
            "<div class='task-card-top'>" +
                "<span class='task-card-title'>" + escapeHtml(task.task_name) + "</span>" +
                "<button class='task-delete-btn' onclick='deleteTask(" + task.id + ")' title='حذف'>✕</button>" +
            "</div>" +
            "<div class='task-card-meta'>" +
                (categoryInfo ? "<span class='task-badge " + categoryInfo.cls + "'>" + categoryInfo.icon + " " + categoryInfo.label + "</span>" : "") +
                deadlineText +
            "</div>" +
            "<div class='task-card-actions'>" + actionBtns + "</div>";

        lists[status].appendChild(li);
    });

    Object.keys(lists).forEach(function (key) {
        if (counts[key] === 0) {
            var empty = document.createElement("li");
            empty.className = "empty-state";
            empty.innerHTML = "<span>لا توجد مهام بعد</span>";
            lists[key].appendChild(empty);
        }
    });

    updateStats(counts, tasks.length);
}

// ============================================================
// الديدلاين ألارم — بانر عريض أعلى الصفحة
// ============================================================
function checkDeadlines(tasks) {
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var warnings = [];

    tasks.forEach(function (task) {
        if (!task.task_deadline || task.task_status === "done") return;
        var deadline = new Date(task.task_deadline);
        deadline.setHours(0, 0, 0, 0);
        var diffDays = Math.round((deadline - today) / (1000 * 60 * 60 * 24));

        if (diffDays < 0)       warnings.push({ icon: "⚠️", text: "المهمة \"" + task.task_name + "\" تجاوزت موعدها النهائي!" });
        else if (diffDays === 0) warnings.push({ icon: "🔔", text: "المهمة \"" + task.task_name + "\" موعدها اليوم!" });
        else if (diffDays <= 2)  warnings.push({ icon: "⏰", text: "المهمة \"" + task.task_name + "\" موعدها بعد " + diffDays + " يوم." });
    });

    var existing = document.getElementById("deadline-alert-box");
    if (existing) existing.remove();
    if (warnings.length > 0) showDeadlineAlert(warnings);
}

function showDeadlineAlert(warnings) {
    var box = document.createElement("div");
    box.id = "deadline-alert-box";
    box.setAttribute("role", "alert");
    box.style.cssText =
        "background:#fff8ec;" +
        "border:1px solid #f0c56a;" +
        "border-right:4px solid #e8a020;" +
        "border-radius:14px;" +
        "padding:0.85rem 1.25rem;" +
        "margin-bottom:1rem;" +
        "display:flex;" +
        "flex-direction:column;" +
        "gap:0.4rem;" +
        "animation:fadeUp 0.3s ease forwards;";

    var header = document.createElement("div");
    header.style.cssText = "display:flex;align-items:center;justify-content:space-between;margin-bottom:0.2rem;";

    var title = document.createElement("strong");
    title.style.cssText = "color:#854F0B;font-size:0.87rem;font-family:var(--font-main);";
    title.textContent = "تنبيهات المواعيد";
    header.appendChild(title);

    var closeBtn = document.createElement("button");
    closeBtn.textContent = "✕";
    closeBtn.style.cssText =
        "background:none;border:none;cursor:pointer;color:#854F0B;" +
        "font-size:0.8rem;width:22px;height:22px;border-radius:50%;" +
        "display:flex;align-items:center;justify-content:center;" +
        "border:1px solid #f0c56a;font-family:var(--font-main);";
    closeBtn.onclick = function () { box.remove(); };
    header.appendChild(closeBtn);
    box.appendChild(header);

    warnings.forEach(function (w) {
        var row = document.createElement("div");
        row.style.cssText =
            "display:flex;align-items:center;gap:0.5rem;" +
            "padding:0.35rem 0.65rem;" +
            "border-radius:8px;" +
            "background:rgba(255,255,255,0.55);" +
            "color:#7a4e10;" +
            "font-size:0.83rem;" +
            "font-weight:600;" +
            "font-family:var(--font-main);";
        row.innerHTML = "<span style='font-size:0.9rem'>" + w.icon + "</span><span>" + w.text + "</span>";
        box.appendChild(row);
    });

    var main = document.querySelector("main");
    if (main) main.insertBefore(box, main.firstChild);
}

// ============================================================
// تغيير حالة / حذف
// ============================================================
function changeStatus(id, newStatus) {
    fetch("/api/tasks/" + id + "/status", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task_status: newStatus })
    })
    .then(function (res) { return res.json(); })
    .then(function (data) { if (data.success) loadTasks(); })
    .catch(function () { alert("تعذّر تغيير الحالة."); });
}

function deleteTask(id) {
    if (!confirm("هل تريد حذف هذه المهمة؟")) return;
    fetch("/api/tasks/" + id, { method: "DELETE" })
        .then(function (res) { return res.json(); })
        .then(function (data) { if (data.success) loadTasks(); })
        .catch(function () { alert("تعذّر حذف المهمة."); });
}

// ============================================================
// إحصائيات وشريط التقدم
// ============================================================
function updateStats(counts, total) {
    document.getElementById("stat-total").textContent  = total;
    document.getElementById("stat-todo").textContent   = counts.todo;
    document.getElementById("stat-doing").textContent  = counts.doing;
    document.getElementById("stat-done").textContent   = counts.done;
    document.getElementById("count-todo").textContent  = counts.todo;
    document.getElementById("count-doing").textContent = counts.doing;
    document.getElementById("count-done").textContent  = counts.done;

    var percent = total > 0 ? Math.round((counts.done / total) * 100) : 0;
    document.getElementById("progress-bar").value = percent;
    document.getElementById("progress-percent").textContent = percent + "%";
}

// ============================================================
// دوال مساعدة
// ============================================================
function getCategoryInfo(cat) {
    var map = {
        work:         { label: "شغل",    icon: "💼", cls: "badge-work"  },
        home:         { label: "بيت",    icon: "🏠", cls: "badge-home"  },
        goals:        { label: "أهداف",  icon: "⭐", cls: "badge-goals" },
        appointments: { label: "مواعيد", icon: "📅", cls: "badge-appt"  },
        university:   { label: "جامعة",  icon: "🎓", cls: "badge-uni"   },
        other:        { label: "أخرى",   icon: "📌", cls: "badge-other" }
    };
    return map[cat] || null;
}

function formatDate(dateStr) {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("ar-SA");
}

function escapeHtml(text) {
    var div = document.createElement("div");
    div.appendChild(document.createTextNode(text));
    return div.innerHTML;
}

function showServerErrors(errors) {
    if (errors && errors.task_name) {
        document.getElementById("task-name-error").textContent = errors.task_name;
    }
}

function clearErrors() {
    document.querySelectorAll(".error-msg").forEach(function (el) { el.textContent = ""; });
}