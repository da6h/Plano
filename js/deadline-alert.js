// ============================================================
// deadline-alert.js - تنبيهات المواعيد النهائية القريبة
// ============================================================

document.addEventListener("DOMContentLoaded", function () {
    checkDeadlines();
});

function checkDeadlines() {
    fetch("/api/tasks")
        .then(function (res) { return res.json(); })
        .then(function (data) {
            if (!data.success) return;

            var today = new Date();
            today.setHours(0, 0, 0, 0);

            var warnings = [];

            data.tasks.forEach(function (task) {
                if (!task.task_deadline || task.task_status === "done") return;

                var deadline = new Date(task.task_deadline);
                deadline.setHours(0, 0, 0, 0);

                var diffDays = Math.round((deadline - today) / (1000 * 60 * 60 * 24));

                if (diffDays < 0) {
                    warnings.push("⚠️ المهمة \"" + task.task_name + "\" تجاوزت موعدها النهائي!");
                } else if (diffDays === 0) {
                    warnings.push("🔔 المهمة \"" + task.task_name + "\" موعدها اليوم!");
                } else if (diffDays <= 2) {
                    warnings.push("⏰ المهمة \"" + task.task_name + "\" موعدها بعد " + diffDays + " يوم.");
                }
            });

            if (warnings.length > 0) {
                showDeadlineAlert(warnings);
            }
        })
        .catch(function () {
            console.log("تعذّر التحقق من المواعيد.");
        });
}

function showDeadlineAlert(warnings) {
    var existing = document.getElementById("deadline-alert-box");
    if (existing) existing.remove();

    var box = document.createElement("div");
    box.id = "deadline-alert-box";
    box.setAttribute("role", "alert");
    box.style.cssText =
        "background:#fff3cd;border:1px solid #ffc107;border-radius:8px;" +
        "padding:12px 16px;margin:12px auto;max-width:900px;font-size:0.95rem;" +
        "direction:rtl;text-align:right;";

    var title = document.createElement("strong");
    title.textContent = "تنبيهات المواعيد:";
    box.appendChild(title);

    var ul = document.createElement("ul");
    ul.style.margin = "6px 0 0 0";
    ul.style.listStyle = "none";
    ul.style.padding = "0";
    warnings.forEach(function (w) {
        var li = document.createElement("li");
        li.textContent = w;
        ul.appendChild(li);
    });
    box.appendChild(ul);

    var closeBtn = document.createElement("button");
    closeBtn.textContent = "✕";
    closeBtn.style.cssText = "float:left;background:none;border:none;cursor:pointer;font-size:1rem;";
    closeBtn.onclick = function () { box.remove(); };
    box.insertBefore(closeBtn, box.firstChild);

    var main = document.querySelector("main");
    if (main) {
        main.insertBefore(box, main.firstChild);
    }
}