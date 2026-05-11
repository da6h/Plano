// ============================================================
// server.js - السيرفر الرئيسي لمشروع Plano
// ============================================================

const express = require("express");
const mysql = require("mysql2");
const path = require("path");

const app = express();
const PORT = 3000;

// ============================================================
// Middleware
// ============================================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// تقديم الملفات الثابتة (HTML, CSS, JS, Media)
app.use(express.static(path.join(__dirname, "..", "html")));
app.use(express.static(path.join(__dirname, "..")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "html", "index.html"));
});

// ============================================================
// الاتصال بقاعدة البيانات
// ============================================================
const db = mysql.createConnection({
    host: "localhost",
    user: "root",         // ← غيّر إذا عندك يوزر مختلف
    password: "",         // ← ضع كلمة المرور إذا وجدت
    database: "plano_db"
});

db.connect(function (err) {
    if (err) {
        console.error("❌ فشل الاتصال بقاعدة البيانات:", err.message);
        process.exit(1);
    }
    console.log("✅ تم الاتصال بقاعدة البيانات بنجاح.");
});

// ============================================================
// دالة مساعدة: تنظيف النصوص من المحتوى الضار (XSS)
// ============================================================
function sanitize(str) {
    if (typeof str !== "string") return "";
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#x27;")
        .trim();
}

// ============================================================
// دالة مساعدة: التحقق من صحة بيانات المهمة (Backend Validation)
// ============================================================
function validateTask(data) {
    var errors = {};

    // اسم المهمة
    if (!data.task_name || data.task_name.trim() === "") {
        errors.task_name = "اسم المهمة مطلوب.";
    } else if (data.task_name.trim().length < 2) {
        errors.task_name = "اسم المهمة يجب أن يكون حرفين على الأقل.";
    } else if (data.task_name.trim().length > 80) {
        errors.task_name = "اسم المهمة لا يتجاوز 80 حرف.";
    } else if (!/^[\u0600-\u06FFa-zA-Z0-9\s\-_.,!؟?]+$/.test(data.task_name.trim())) {
        errors.task_name = "اسم المهمة يحتوي على رموز غير مسموحة.";
    }

    // الفئة (اختياري لكن نتحقق من القيم المسموحة)
    var allowedCategories = ["", "work", "home", "goals", "appointments", "university", "other"];
    if (data.task_category && !allowedCategories.includes(data.task_category)) {
        errors.task_category = "الفئة المختارة غير صالحة.";
    }

    // الموعد النهائي (اختياري)
    if (data.task_deadline && data.task_deadline !== "") {
        var dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(data.task_deadline)) {
            errors.task_deadline = "صيغة التاريخ غير صحيحة.";
        } else {
            var d = new Date(data.task_deadline);
            if (isNaN(d.getTime())) {
                errors.task_deadline = "التاريخ غير صالح.";
            }
        }
    }

    // الحالة
    var allowedStatuses = ["todo", "doing", "done"];
    if (data.task_status && !allowedStatuses.includes(data.task_status)) {
        errors.task_status = "الحالة المختارة غير صالحة.";
    }

    return errors;
}

// ============================================================
// دالة مساعدة: التحقق من بيانات فورم التواصل
// ============================================================
function validateContact(data) {
    var errors = {};

    // الاسم الأول
    if (!data.first_name || data.first_name.trim() === "") {
        errors.first_name = "الاسم الأول مطلوب.";
    } else if (data.first_name.trim().length < 2 || data.first_name.trim().length > 50) {
        errors.first_name = "الاسم الأول بين 2 و 50 حرف.";
    }

    // الاسم الأخير
    if (!data.last_name || data.last_name.trim() === "") {
        errors.last_name = "الاسم الأخير مطلوب.";
    } else if (data.last_name.trim().length < 2 || data.last_name.trim().length > 50) {
        errors.last_name = "الاسم الأخير بين 2 و 50 حرف.";
    }

    // الجنس
    var allowedGenders = ["male", "female"];
    if (!data.gender || !allowedGenders.includes(data.gender)) {
        errors.gender = "يرجى اختيار الجنس.";
    }

    // الجوال
    if (!data.mobile || data.mobile.trim() === "") {
        errors.mobile = "رقم الجوال مطلوب.";
    } else if (!/^05\d{8}$/.test(data.mobile.trim())) {
        errors.mobile = "رقم الجوال يجب أن يبدأ بـ 05 ويتكون من 10 أرقام.";
    }

    // تاريخ الميلاد
    if (!data.dob || data.dob.trim() === "") {
        errors.dob = "تاريخ الميلاد مطلوب.";
    } else {
        var dobDate = new Date(data.dob);
        var minDate = new Date("1900-01-01");
        var maxDate = new Date();
        maxDate.setFullYear(maxDate.getFullYear() - 10);
        if (isNaN(dobDate.getTime()) || dobDate < minDate || dobDate > maxDate) {
            errors.dob = "تاريخ الميلاد غير صحيح.";
        }
    }

    // البريد الإلكتروني
    if (!data.email || data.email.trim() === "") {
        errors.email = "البريد الإلكتروني مطلوب.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
        errors.email = "صيغة البريد الإلكتروني غير صحيحة.";
    } else if (data.email.trim().length > 100) {
        errors.email = "البريد الإلكتروني طويل جداً.";
    }

    // لغة التواصل
    var allowedLangs = ["arabic", "english", "french"];
    if (!data.language || !allowedLangs.includes(data.language)) {
        errors.language = "يرجى اختيار لغة التواصل.";
    }

    // الرسالة
    if (!data.message || data.message.trim() === "") {
        errors.message = "الرسالة مطلوبة.";
    } else if (data.message.trim().length < 10) {
        errors.message = "الرسالة يجب أن تكون 10 أحرف على الأقل.";
    } else if (data.message.trim().length > 1000) {
        errors.message = "الرسالة لا تتجاوز 1000 حرف.";
    }

    return errors;
}

// ============================================================
// API Routes - المهام (Tasks)
// ============================================================

// GET /api/tasks - جلب كل المهام
app.get("/api/tasks", function (req, res) {
    var sql = "SELECT * FROM tasks ORDER BY created_at DESC";
    db.query(sql, function (err, results) {
        if (err) {
            return res.status(500).json({ success: false, message: "خطأ في قاعدة البيانات." });
        }
        res.json({ success: true, tasks: results });
    });
});

// POST /api/tasks - إضافة مهمة جديدة
app.post("/api/tasks", function (req, res) {
    var data = req.body;

    // Backend Validation
    var errors = validateTask(data);
    if (Object.keys(errors).length > 0) {
        return res.status(400).json({ success: false, errors: errors });
    }

    // تنظيف المدخلات
    var cleanName = sanitize(data.task_name);
    var cleanCategory = sanitize(data.task_category || "");
    var cleanDeadline = (data.task_deadline && data.task_deadline !== "") ? data.task_deadline : null;
    var cleanStatus = data.task_status || "todo";

    var sql = "INSERT INTO tasks (task_name, task_category, task_deadline, task_status) VALUES (?, ?, ?, ?)";
    db.query(sql, [cleanName, cleanCategory, cleanDeadline, cleanStatus], function (err, result) {
        if (err) {
            return res.status(500).json({ success: false, message: "فشل حفظ المهمة." });
        }
        res.json({ success: true, message: "تمت إضافة المهمة بنجاح.", id: result.insertId });
    });
});

// PUT /api/tasks/:id/status - تغيير حالة مهمة
app.put("/api/tasks/:id/status", function (req, res) {
    var id = parseInt(req.params.id);
    var newStatus = req.body.task_status;

    if (isNaN(id) || id <= 0) {
        return res.status(400).json({ success: false, message: "معرّف المهمة غير صالح." });
    }

    var allowedStatuses = ["todo", "doing", "done"];
    if (!allowedStatuses.includes(newStatus)) {
        return res.status(400).json({ success: false, message: "الحالة غير صالحة." });
    }

    var sql = "UPDATE tasks SET task_status = ? WHERE id = ?";
    db.query(sql, [newStatus, id], function (err, result) {
        if (err) {
            return res.status(500).json({ success: false, message: "فشل تحديث الحالة." });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "المهمة غير موجودة." });
        }
        res.json({ success: true, message: "تم تحديث الحالة بنجاح." });
    });
});

// DELETE /api/tasks/:id - حذف مهمة
app.delete("/api/tasks/:id", function (req, res) {
    var id = parseInt(req.params.id);

    if (isNaN(id) || id <= 0) {
        return res.status(400).json({ success: false, message: "معرّف المهمة غير صالح." });
    }

    var sql = "DELETE FROM tasks WHERE id = ?";
    db.query(sql, [id], function (err, result) {
        if (err) {
            return res.status(500).json({ success: false, message: "فشل حذف المهمة." });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "المهمة غير موجودة." });
        }
        res.json({ success: true, message: "تم حذف المهمة بنجاح." });
    });
});

// ============================================================
// API Routes - التواصل (Contact)
// ============================================================

// POST /api/contact - إرسال رسالة تواصل
app.post("/api/contact", function (req, res) {
    var data = req.body;

    // Backend Validation
    var errors = validateContact(data);
    if (Object.keys(errors).length > 0) {
        return res.status(400).json({ success: false, errors: errors });
    }

    // تنظيف المدخلات
    var cleanFirst = sanitize(data.first_name);
    var cleanLast = sanitize(data.last_name);
    var cleanGender = sanitize(data.gender);
    var cleanMobile = sanitize(data.mobile);
    var cleanDob = data.dob;
    var cleanEmail = sanitize(data.email);
    var cleanLang = sanitize(data.language);
    var cleanMessage = sanitize(data.message);

    var sql = "INSERT INTO contacts (first_name, last_name, gender, mobile, dob, email, language, message) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    db.query(sql, [cleanFirst, cleanLast, cleanGender, cleanMobile, cleanDob, cleanEmail, cleanLang, cleanMessage], function (err) {
        if (err) {
            return res.status(500).json({ success: false, message: "فشل حفظ الرسالة." });
        }
        res.json({ success: true, message: "تم إرسال رسالتك بنجاح. سنتواصل معك قريباً!" });
    });
});

// GET /api/contact - عرض الرسائل (صفحة عرض البيانات)
app.get("/api/contact", function (req, res) {
    var sql = "SELECT * FROM contacts ORDER BY created_at DESC";
    db.query(sql, function (err, results) {
        if (err) {
            return res.status(500).json({ success: false, message: "خطأ في قاعدة البيانات." });
        }
        res.json({ success: true, contacts: results });
    });
});

// ============================================================
// تشغيل السيرفر
// ============================================================
app.listen(PORT, function () {
    console.log("🚀 السيرفر يعمل على: http://localhost:" + PORT);
});