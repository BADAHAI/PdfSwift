// =========================
// tools.js
// =========================

// مكتبة pdf-lib محلية مطلوبة لاحقًا
// يمكنك تحميل pdf-lib.min.js ووضعه في js/libs/

const toolCards = document.querySelectorAll(".tool-card");

// تهيئة الملفات لكل أداة
const toolFiles = {};

// ====================================
// Helper: اختيار ملف PDF
// ====================================
function selectFile(toolName, callback) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "application/pdf";
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    toolFiles[toolName] = file;
    callback(file);
  };
  input.click();
}

// ====================================
// Tool Functions
// ====================================
function mergePDF() {
  selectFile("merge", (file) => {
    alert(`تم اختيار ملف للدمج: ${file.name}\nستتم المعالجة لاحقًا`);
    // هنا يمكنك دمج عدة ملفات لاحقًا باستخدام pdf-lib
  });
}

function splitPDF() {
  selectFile("split", (file) => {
    alert(`تم اختيار ملف للتقسيم: ${file.name}\nستتم المعالجة لاحقًا`);
  });
}

function deletePages() {
  selectFile("delete", (file) => {
    alert(`تم اختيار ملف لحذف الصفحات: ${file.name}\nستتم المعالجة لاحقًا`);
  });
}

function reorderPages() {
  selectFile("reorder", (file) => {
    alert(`تم اختيار ملف لإعادة ترتيب الصفحات: ${file.name}\nستتم المعالجة لاحقًا`);
  });
}

function rotatePages() {
  selectFile("rotate", (file) => {
    alert(`تم اختيار ملف لتدوير الصفحات: ${file.name}\nستتم المعالجة لاحقًا`);
  });
}

function compressPDF() {
  selectFile("compress", (file) => {
    alert(`تم اختيار ملف للضغط: ${file.name}\nستتم المعالجة لاحقًا`);
  });
}

// ====================================
// Event Listeners لكل زر
// ====================================
toolCards.forEach((card) => {
  const button = card.querySelector("button");
  button.addEventListener("click", () => {
    const toolName = card.querySelector("h3").innerText;
    switch (toolName) {
      case "دمج ملفات PDF":
        mergePDF();
        break;
      case "تقسيم ملف PDF":
        splitPDF();
        break;
      case "حذف صفحات":
        deletePages();
        break;
      case "ترتيب الصفحات":
        reorderPages();
        break;
      case "تدوير الصفحات":
        rotatePages();
        break;
      case "ضغط PDF":
        compressPDF();
        break;
      default:
        alert("هذه الأداة غير مفعّلة بعد.");
    }
  });
});
