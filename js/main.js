// ============================================================
// main.js - ملف JavaScript العام للموقع
// ============================================================

document.addEventListener("DOMContentLoaded", function () {

    // تفعيل الرابط النشط في الـ nav تلقائياً
    highlightActiveNav();

});

// ============================================================
// تمييز الرابط النشط في شريط التنقل
// ============================================================
function highlightActiveNav() {
    var currentPage = window.location.pathname.split("/").pop();
    var navLinks = document.querySelectorAll("nav a");

    navLinks.forEach(function (link) {
        link.classList.remove("active");
        var linkPage = link.getAttribute("href").split("/").pop();
        if (linkPage === currentPage) {
            link.classList.add("active");
        }
    });
}