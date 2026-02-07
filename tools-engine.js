/* ============================================================
   PdfSwift — Tools Engine
   هذا الملف مسؤول عن فتح الأدوات حسب اسم الأداة
   ويعمل مع GitHub Pages بدون أي مشاكل
============================================================ */

function openTool(tool) {

    switch (tool) {

        /* ============================
           أدوات PDF
        ============================ */
        case "mergepdf":
            window.location.href = "tools/mergepdf.html";
            break;

        case "compresspdf":
            window.location.href = "tools/compresspdf.html";
            break;

        case "splitpdf":
            window.location.href = "tools/splitpdf.html";
            break;

        case "pdf2img":
            window.location.href = "tools/pdf2img.html";
            break;

        case "img2pdf":
            window.location.href = "tools/img2pdf.html";
            break;


        /* ============================
           أدوات الصور
        ============================ */
        case "crop":
            window.location.href = "tools/crop.html";
            break;

        case "resize":
            window.location.href = "tools/resize.html";
            break;

        case "format":
            window.location.href = "tools/format.html";
            break;

        case "enhance":
            window.location.href = "tools/enhance.html";
            break;

        case "rotate":
            window.location.href = "tools/rotate.html";
            break;


        /* ============================
           أداة تجهيز صورة أبشر
        ============================ */
        case "absher":
            window.location.href = "tools/absher.html";
            break;


        /* ============================
           في حال تم تمرير اسم غير موجود
        ============================ */
        default:
            alert("الأداة غير موجودة أو لم يتم إضافتها بعد.");
            break;
    }
}
