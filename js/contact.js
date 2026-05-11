// ============================================================
// contact.js - إرسال بيانات فورم التواصل إلى الباك إند
// ============================================================

document.addEventListener("DOMContentLoaded", function () {

    // عداد الأحرف في الرسالة
    var messageField = document.getElementById("message");
    var charCount = document.getElementById("message-count");
    if (messageField && charCount) {
        messageField.addEventListener("input", function () {
            charCount.textContent = messageField.value.length + " / 500";
        });
    }

    // الفورم
    var form = document.getElementById("contact-form");
    if (form) {
        form.addEventListener("submit", function (e) {
            e.preventDefault();
            submitContact();
        });
    }
});

// ============================================================
// إرسال البيانات للسيرفر
// ============================================================
function submitContact() {
    var data = {
        first_name: document.getElementById("first-name").value.trim(),
        last_name: document.getElementById("last-name").value.trim(),
        gender: document.querySelector("input[name='gender']:checked")
            ? document.querySelector("input[name='gender']:checked").value
            : "",
        mobile: document.getElementById("mobile").value.trim(),
        dob: document.getElementById("dob").value,
        email: document.getElementById("email").value.trim(),
        language: document.getElementById("language").value,
        message: document.getElementById("message").value.trim()
    };

    fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    })
        .then(function (res) { return res.json(); })
        .then(function (result) {
            if (result.success) {
                // إظهار رسالة النجاح
                var successMsg = document.getElementById("success-msg");
                if (successMsg) {
                    successMsg.removeAttribute("hidden");
                }
                // تفريغ الفورم
                document.getElementById("contact-form").reset();
                document.getElementById("message-count").textContent = "0 / 500";
            } else {
                // إظهار أخطاء الباك إند
                showBackendErrors(result.errors);
            }
        })
        .catch(function () {
            alert("حدث خطأ في الاتصال بالسيرفر.");
        });
}

// ============================================================
// عرض أخطاء الباك إند
// ============================================================
function showBackendErrors(errors) {
    if (!errors) return;
    var fields = ["first_name", "last_name", "gender", "mobile", "dob", "email", "language", "message"];
    fields.forEach(function (field) {
        if (errors[field]) {
            var el = document.getElementById(field.replace("_", "-") + "-error");
            if (el) el.textContent = errors[field];
        }
    });
}
