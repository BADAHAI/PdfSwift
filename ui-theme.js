/* --------------------------------------------------
   UI-THEME.JS
   نظام الثيم + القائمة المنسدلة
   يعمل على كل صفحات PdfSwift
-------------------------------------------------- */

/* -------------------------------
   1) نظام الثيم (Light / Dark)
------------------------------- */

// استرجاع الثيم من التخزين
const savedTheme = localStorage.getItem("theme");

// تطبيق الثيم المحفوظ
if (savedTheme === "dark") {
    document.body.classList.add("dark-theme");
}

// زر التبديل
const themeToggle = document.getElementById("themeToggle");

if (themeToggle) {
    themeToggle.addEventListener("click", () => {
        document.body.classList.toggle("dark-theme");

        // حفظ الثيم
        if (document.body.classList.contains("dark-theme")) {
            localStorage.setItem("theme", "dark");
        } else {
            localStorage.setItem("theme", "light");
        }

        // تغيير الأيقونة
        updateThemeIcon();
    });

    // تحديث الأيقونة عند التحميل
    updateThemeIcon();
}

// تغيير أيقونة القمر/الشمس
function updateThemeIcon() {
    const icon = themeToggle.querySelector("i");

    if (!icon) return;

    if (document.body.classList.contains("dark-theme")) {
        icon.classList.remove("fa-moon");
        icon.classList.add("fa-sun");
    } else {
        icon.classList.remove("fa-sun");
        icon.classList.add("fa-moon");
    }
}

/* -------------------------------
   2) القائمة المنسدلة للجوال
------------------------------- */

const menuToggle = document.getElementById("menuToggle");
const navMenu = document.querySelector(".nav");

if (menuToggle && navMenu) {
    menuToggle.addEventListener("click", () => {
        navMenu.style.display =
            navMenu.style.display === "flex" ? "none" : "flex";
    });
}

// إغلاق القائمة عند الضغط خارجها
document.addEventListener("click", (e) => {
    if (
        navMenu &&
        menuToggle &&
        !navMenu.contains(e.target) &&
        !menuToggle.contains(e.target)
    ) {
        if (window.innerWidth < 900) {
            navMenu.style.display = "none";
        }
    }
});
