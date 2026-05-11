// ============================================================
// validation.js - التحقق من صحة المدخلات في الفرونت إند
// ============================================================

// ============================================================
// التحقق من فورم المهمة (dashboard)
// ============================================================
function validateTaskForm() {
    var isValid = true;
    clearErrors();

    // اسم المهمة
    var nameInput = document.getElementById("task-name");
    if (nameInput) {
        var name = nameInput.value.trim();

        if (name === "") {
            showError("task-name-error", "اسم المهمة مطلوب.");
            isValid = false;
        } else if (name.length < 2) {
            showError("task-name-error", "اسم المهمة يجب أن يكون حرفين على الأقل.");
            isValid = false;
        } else if (name.length > 80) {
            showError("task-name-error", "اسم المهمة لا يتجاوز 80 حرف.");
            isValid = false;
        } else if (!/^[\u0600-\u06FFa-zA-Z0-9\s\-_.,!؟?]+$/.test(name)) {
            showError("task-name-error", "اسم المهمة يحتوي على رموز غير مسموحة.");
            isValid = false;
        }
    }

    // الموعد النهائي (إن وُجد)
    var deadlineInput = document.getElementById("task-deadline");
    if (deadlineInput && deadlineInput.value !== "") {
        var today = new Date();
        today.setHours(0, 0, 0, 0);
        var selected = new Date(deadlineInput.value);

        if (isNaN(selected.getTime())) {
            showError("task-deadline-error", "تاريخ غير صحيح.");
            isValid = false;
        } else if (selected < today) {
            showError("task-deadline-error", "لا يمكن اختيار تاريخ في الماضي.");
            isValid = false;
        }
    }

    return isValid;
}

// ============================================================
// التحقق من فورم التواصل (contact-us)
// ============================================================
function validateContactForm() {
    var isValid = true;
    clearErrors();

    // الاسم الأول
    var firstName = getVal("first-name");
    if (firstName === "") {
        showError("first-name-error", "الاسم الأول مطلوب.");
        isValid = false;
    } else if (firstName.length < 2 || firstName.length > 50) {
        showError("first-name-error", "الاسم بين 2 و 50 حرف.");
        isValid = false;
    }

    // الاسم الأخير
    var lastName = getVal("last-name");
    if (lastName === "") {
        showError("last-name-error", "الاسم الأخير مطلوب.");
        isValid = false;
    } else if (lastName.length < 2 || lastName.length > 50) {
        showError("last-name-error", "الاسم بين 2 و 50 حرف.");
        isValid = false;
    }

    // الجنس
    var gender = getVal("gender");
    if (gender === "") {
        showError("gender-error", "يرجى اختيار الجنس.");
        isValid = false;
    }

    // الجوال
    var mobile = getVal("mobile");
    if (mobile === "") {
        showError("mobile-error", "رقم الجوال مطلوب.");
        isValid = false;
    } else if (!/^05\d{8}$/.test(mobile)) {
        showError("mobile-error", "رقم الجوال يجب أن يبدأ بـ 05 ويتكون من 10 أرقام.");
        isValid = false;
    }

    // تاريخ الميلاد
    var dob = getVal("dob");
    if (dob === "") {
        showError("dob-error", "تاريخ الميلاد مطلوب.");
        isValid = false;
    } else {
        var dobDate = new Date(dob);
        var minDate = new Date("1900-01-01");
        var maxDate = new Date();
        maxDate.setFullYear(maxDate.getFullYear() - 10);

        if (dobDate < minDate || dobDate > maxDate) {
            showError("dob-error", "تاريخ الميلاد غير صحيح.");
            isValid = false;
        }
    }

    // البريد الإلكتروني
    var email = getVal("email");
    if (email === "") {
        showError("email-error", "البريد الإلكتروني مطلوب.");
        isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showError("email-error", "صيغة البريد الإلكتروني غير صحيحة.");
        isValid = false;
    }

    // لغة التواصل
    var lang = getVal("language");
    if (lang === "") {
        showError("language-error", "يرجى اختيار لغة التواصل.");
        isValid = false;
    }

    // الرسالة
    var message = getVal("message");
    if (message === "") {
        showError("message-error", "الرسالة مطلوبة.");
        isValid = false;
    } else if (message.length < 10) {
        showError("message-error", "الرسالة يجب أن تكون 10 أحرف على الأقل.");
        isValid = false;
    } else if (message.length > 1000) {
        showError("message-error", "الرسالة لا تتجاوز 1000 حرف.");
        isValid = false;
    }

    return isValid;
}

// ============================================================
// دوال مساعدة
// ============================================================
function showError(elementId, message) {
    var el = document.getElementById(elementId);
    if (el) {
        el.textContent = message;
    }
}

function clearErrors() {
    var errors = document.querySelectorAll(".error-msg");
    errors.forEach(function (el) {
        el.textContent = "";
    });
}

function getVal(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : "";
}