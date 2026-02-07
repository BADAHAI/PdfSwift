/* tools.js — نسخة محسّنة بحماية DOM وفحوصات إضافية */

/* ============================
   مساعدة: اختيار العناصر بأمان
============================ */
function $(selector) {
  return document.querySelector(selector);
}
function $all(selector) {
  return Array.from(document.querySelectorAll(selector));
}
function onIfExists(id, event, handler) {
  const el = document.getElementById(id);
  if (el) el.addEventListener(event, handler);
  return el;
}

/* ============================
   التنقل بين الأدوات
============================ */
$all('.tool-btn[data-tool]').forEach(btn => {
  btn.addEventListener('click', () => {
    const tool = btn.dataset.tool;
    if (!tool) return;

    $all('.tool-selector, .section-title, main > p, .convert-hero')
      .forEach(el => el.style.display = 'none');

    $all('.tool-section').forEach(el => el.style.display = 'none');

    const section = document.getElementById(`tool-${tool}`);
    if (section) section.style.display = 'block';

    const backBtn = document.getElementById('back-to-tools');
    if (backBtn) backBtn.style.display = 'block';
  });
});

onIfExists('back-to-tools', 'click', () => {
  $all('.tool-section').forEach(el => el.style.display = 'none');
  const backBtn = document.getElementById('back-to-tools');
  if (backBtn) backBtn.style.display = 'none';

  $all('.tool-selector, .section-title, main > p, .convert-hero')
    .forEach(el => el.style.display = '');
});

/* ============================
   نافذة الأدوات الجديدة (مودال)
============================ */
function openModal(title, desc) {
  const titleEl = document.getElementById("modal-title");
  const descEl = document.getElementById("modal-desc");
  const modal = document.getElementById("modal");
  if (titleEl) titleEl.innerText = title;
  if (descEl) descEl.innerText = desc;
  if (modal) modal.style.display = "flex";
}

function closeModal() {
  const modal = document.getElementById("modal");
  if (modal) modal.style.display = "none";
}

/* ============================
   مساعدة: تنزيل Blob
============================ */
function downloadBlob(blob, filename) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    URL.revokeObjectURL(link.href);
    document.body.removeChild(link);
  }, 100);
}

/* ============================
   دمج ملفات PDF
============================ */
onIfExists("btn-merge", "click", async () => {
  const filesInput = document.getElementById("merge-files");
  const status = document.getElementById("merge-status");
  const files = filesInput ? filesInput.files : null;

  if (!files || !files.length) {
    if (status) { status.textContent = "الرجاء اختيار ملفات PDF"; status.className = "status error"; }
    return;
  }

  if (status) { status.textContent = "جاري الدمج..."; status.className = "status"; }

  try {
    const mergedPdf = await PDFLib.PDFDocument.create();

    for (let file of files) {
      const bytes = await file.arrayBuffer();
      const pdf = await PDFLib.PDFDocument.load(bytes);
      const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      pages.forEach(p => mergedPdf.addPage(p));
    }

    const mergedBytes = await mergedPdf.save();
    const blob = new Blob([mergedBytes], { type: "application/pdf" });
    downloadBlob(blob, "merged.pdf");

    if (status) { status.textContent = "تم الدمج بنجاح ✔️"; status.className = "status success"; }
  } catch (err) {
    if (status) { status.textContent = "حدث خطأ أثناء الدمج"; status.className = "status error"; }
    console.error("merge error:", err);
  }
});

/* ============================
   تدوير PDF
============================ */
onIfExists("btn-rotate", "click", async () => {
  const fileInput = document.getElementById("rotate-file");
  const degreeInput = document.getElementById("rotate-degree");
  const status = document.getElementById("rotate-status");
  const file = fileInput ? fileInput.files[0] : null;
  const degree = degreeInput ? parseInt(degreeInput.value, 10) : 0;

  if (!file) {
    if (status) { status.textContent = "الرجاء اختيار ملف PDF"; status.className = "status error"; }
    return;
  }

  if (status) { status.textContent = "جاري التدوير..."; status.className = "status"; }

  try {
    const bytes = await file.arrayBuffer();
    const pdfDoc = await PDFLib.PDFDocument.load(bytes);

    pdfDoc.getPages().forEach(page => {
      page.setRotation(PDFLib.degrees(degree || 0));
    });

    const newBytes = await pdfDoc.save();
    const blob = new Blob([newBytes], { type: "application/pdf" });
    downloadBlob(blob, "rotated.pdf");

    if (status) { status.textContent = "تم التدوير بنجاح ✔️"; status.className = "status success"; }
  } catch (err) {
    if (status) { status.textContent = "حدث خطأ أثناء التدوير"; status.className = "status error"; }
    console.error("rotate error:", err);
  }
});

/* ============================
   تقسيم PDF
============================ */
onIfExists("btn-split", "click", async () => {
  const fileInput = document.getElementById("split-file");
  const rangesInput = document.getElementById("split-ranges");
  const status = document.getElementById("split-status");
  const file = fileInput ? fileInput.files[0] : null;
  const ranges = rangesInput ? rangesInput.value : "";

  if (!file || !ranges.trim()) {
    if (status) { status.textContent = "الرجاء اختيار ملف وكتابة الصفحات"; status.className = "status error"; }
    return;
  }

  if (status) { status.textContent = "جاري استخراج الصفحات..."; status.className = "status"; }

  try {
    const bytes = await file.arrayBuffer();
    const pdfDoc = await PDFLib.PDFDocument.load(bytes);
    const totalPages = pdfDoc.getPageCount();

    const parts = ranges.split(",").map(p => p.trim()).filter(p => p.length);
    let counter = 1;

    for (let part of parts) {
      let start, end;
      if (part.includes("-")) {
        const [s, e] = part.split("-").map(n => parseInt(n.trim(), 10));
        start = isNaN(s) ? null : s - 1;
        end = isNaN(e) ? null : e - 1;
      } else {
        const n = parseInt(part, 10);
        start = isNaN(n) ? null : n - 1;
        end = start;
      }

      if (start === null || end === null || start < 0 || end < 0 || start >= totalPages || end >= totalPages) {
        // تجاهل الجزء غير الصحيح
        console.warn("Invalid split range:", part);
        continue;
      }

      // تصحيح إذا كان start > end
      if (start > end) [start, end] = [end, start];

      const newPdf = await PDFLib.PDFDocument.create();
      const indices = [];
      for (let i = start; i <= end; i++) indices.push(i);

      const pages = await newPdf.copyPages(pdfDoc, indices);
      pages.forEach(p => newPdf.addPage(p));

      const newBytes = await newPdf.save();
      const blob = new Blob([newBytes], { type: "application/pdf" });
      downloadBlob(blob, `pages-${counter}.pdf`);
      counter++;
    }

    if (status) { status.textContent = "تم استخراج الصفحات ✔️"; status.className = "status success"; }
  } catch (err) {
    if (status) { status.textContent = "حدث خطأ أثناء استخراج الصفحات"; status.className = "status error"; }
    console.error("split error:", err);
  }
});

/* ============================
   علامة مائية
============================ */
onIfExists("btn-watermark", "click", async () => {
  const fileInput = document.getElementById("watermark-file");
  const textInput = document.getElementById("watermark-text");
  const status = document.getElementById("watermark-status");
  const file = fileInput ? fileInput.files[0] : null;
  const text = textInput ? textInput.value : "";

  if (!file || !text.trim()) {
    if (status) { status.textContent = "الرجاء اختيار ملف وكتابة النص"; status.className = "status error"; }
    return;
  }

  if (status) { status.textContent = "جاري إضافة العلامة..."; status.className = "status"; }

  try {
    const bytes = await file.arrayBuffer();
    const pdfDoc = await PDFLib.PDFDocument.load(bytes);
    const pages = pdfDoc.getPages();
    const font = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);

    pages.forEach(page => {
      page.drawText(text, {
        x: 50,
        y: page.getHeight() / 2,
        size: 40,
        font,
        color: PDFLib.rgb(0.8, 0.1, 0.1),
        opacity: 0.25,
        rotate: PDFLib.degrees(30)
      });
    });

    const newBytes = await pdfDoc.save();
    const blob = new Blob([newBytes], { type: "application/pdf" });
    downloadBlob(blob, "watermarked.pdf");

    if (status) { status.textContent = "تمت إضافة العلامة ✔️"; status.className = "status success"; }
  } catch (err) {
    if (status) { status.textContent = "حدث خطأ أثناء إضافة العلامة"; status.className = "status error"; }
    console.error("watermark error:", err);
  }
});

/* ============================
   ضغط PDF (مستوى بسيط)
============================ */
onIfExists("btn-compress", "click", async () => {
  const fileInput = document.getElementById("compress-file");
  const status = document.getElementById("compress-status");
  const file = fileInput ? fileInput.files[0] : null;

  if (!file) {
    if (status) { status.textContent = "الرجاء اختيار ملف PDF"; status.className = "status error"; }
    return;
  }

  if (status) { status.textContent = "جاري الضغط (قد يستغرق بعض الوقت)..."; status.className = "status"; }

  try {
    const bytes = await file.arrayBuffer();
    const pdfDoc = await PDFLib.PDFDocument.load(bytes);
    const newBytes = await pdfDoc.save({ useObjectStreams: true });
    const blob = new Blob([newBytes], { type: "application/pdf" });
    downloadBlob(blob, "compressed.pdf");

    if (status) { status.textContent = "تم ضغط الملف ✔️ (ضغط بسيط)"; status.className = "status success"; }
  } catch (err) {
    if (status) { status.textContent = "حدث خطأ أثناء الضغط"; status.className = "status error"; }
    console.error("compress error:", err);
  }
});

/* ============================
   حماية PDF (ملاحظة)
============================ */
onIfExists("btn-protect", "click", async () => {
  const fileInput = document.getElementById("protect-file");
  const passwordInput = document.getElementById("protect-password");
  const status = document.getElementById("protect-status");
  const file = fileInput ? fileInput.files[0] : null;
  const password = passwordInput ? passwordInput.value : "";

  if (!file || !password.trim()) {
    if (status) { status.textContent = "الرجاء اختيار ملف وكتابة كلمة المرور"; status.className = "status error"; }
    return;
  }

  if (status) { status.textContent = "جاري تجهيز الملف للحماية..."; status.className = "status"; }

  try {
    const bytes = await file.arrayBuffer();
    const pdfDoc = await PDFLib.PDFDocument.load(bytes);
    const newBytes = await pdfDoc.save();
    const blob = new Blob([newBytes], { type: "application/pdf" });
    downloadBlob(blob, "protected-placeholder.pdf");

    if (status) {
      status.textContent = "تم تجهيز الملف، ويمكن لاحقًا ربطه بتشفير فعلي على السيرفر أو مكتبة متقدمة.";
      status.className = "status success";
    }
  } catch (err) {
    if (status) { status.textContent = "حدث خطأ أثناء الحماية"; status.className = "status error"; }
    console.error("protect error:", err);
  }
});

/* ============================
   إزالة كلمة المرور (ملاحظة)
============================ */
onIfExists("btn-remove-password", "click", async () => {
  const fileInput = document.getElementById("remove-file");
  const passwordInput = document.getElementById("remove-password");
  const status = document.getElementById("remove-status");
  const file = fileInput ? fileInput.files[0] : null;
  const password = passwordInput ? passwordInput.value : "";

  if (!file || !password.trim()) {
    if (status) { status.textContent = "الرجاء اختيار ملف وكتابة كلمة المرور الحالية"; status.className = "status error"; }
    return;
  }

  if (status) { status.textContent = "محاولة إزالة كلمة المرور..."; status.className = "status"; }

  try {
    const bytes = await file.arrayBuffer();
    const pdfDoc = await PDFLib.PDFDocument.load(bytes);
    const newBytes = await pdfDoc.save();
    const blob = new Blob([newBytes], { type: "application/pdf" });
    downloadBlob(blob, "unlocked-placeholder.pdf");

    if (status) {
      status.textContent = "تم حفظ نسخة جديدة، إزالة كلمة المرور الكاملة تتطلب تشفير متقدم لاحقًا.";
      status.className = "status success";
    }
  } catch (err) {
    if (status) { status.textContent = "تعذر إزالة كلمة المرور من هذا الملف (قد يكون مشفّرًا بالكامل)."; status.className = "status error"; }
    console.error("remove-password error:", err);
  }
});

/* ============================
   توقيع PDF
============================ */
onIfExists("btn-sign", "click", async () => {
  const fileInput = document.getElementById("sign-file");
  const imgInput = document.getElementById("sign-image");
  const status = document.getElementById("sign-status");
  const file = fileInput ? fileInput.files[0] : null;
  const imgFile = imgInput ? imgInput.files[0] : null;

  if (!file || !imgFile) {
    if (status) { status.textContent = "الرجاء اختيار ملف PDF وصورة التوقيع"; status.className = "status error"; }
    return;
  }

  if (status) { status.textContent = "جاري إضافة التوقيع..."; status.className = "status"; }

  try {
    const pdfBytes = await file.arrayBuffer();
    const pdfDoc = await PDFLib.PDFDocument.load(pdfBytes);

    const imgBytes = await imgFile.arrayBuffer();
    let signatureImage;
    if (imgFile.type.includes("png")) {
      signatureImage = await pdfDoc.embedPng(imgBytes);
    } else {
      signatureImage = await pdfDoc.embedJpg(imgBytes);
    }

    const pages = pdfDoc.getPages();
    const sigWidth = (signatureImage.width || 300) / 3;
    const sigHeight = (signatureImage.height || 100) / 3;

    pages.forEach(page => {
      const { width, height } = page.getSize();
      page.drawImage(signatureImage, {
        x: Math.max(20, width - sigWidth - 40),
        y: 40,
        width: sigWidth,
        height: sigHeight
      });
    });

    const newBytes = await pdfDoc.save();
    const blob = new Blob([newBytes], { type: "application/pdf" });
    downloadBlob(blob, "signed.pdf");

    if (status) { status.textContent = "تم إضافة التوقيع ✔️"; status.className = "status success"; }
  } catch (err) {
    if (status) { status.textContent = "حدث خطأ أثناء التوقيع"; status.className = "status error"; }
    console.error("sign error:", err);
  }
});

/* ============================
   ترتيب الصفحات
============================ */
onIfExists("btn-reorder", "click", async () => {
  const fileInput = document.getElementById("reorder-file");
  const orderInput = document.getElementById("reorder-order");
  const status = document.getElementById("reorder-status");
  const file = fileInput ? fileInput.files[0] : null;
  const orderStr = orderInput ? orderInput.value : "";

  if (!file || !orderStr.trim()) {
    if (status) { status.textContent = "الرجاء اختيار ملف وكتابة ترتيب الصفحات"; status.className = "status error"; }
    return;
  }

  if (status) { status.textContent = "جاري ترتيب الصفحات..."; status.className = "status"; }

  try {
    const bytes = await file.arrayBuffer();
    const pdfDoc = await PDFLib.PDFDocument.load(bytes);
    const totalPages = pdfDoc.getPageCount();
    const order = orderStr.split(",").map(n => parseInt(n.trim(), 10) - 1);

    if (order.some(n => isNaN(n) || n < 0 || n >= totalPages)) {
      if (status) { status.textContent = "ترتيب غير صالح، تأكد من الأرقام."; status.className = "status error"; }
      return;
    }

    const newPdf = await PDFLib.PDFDocument.create();
    const pages = await newPdf.copyPages(pdfDoc, order);
    pages.forEach(p => newPdf.addPage(p));

    const newBytes = await newPdf.save();
    const blob = new Blob([newBytes], { type: "application/pdf" });
    downloadBlob(blob, "reordered.pdf");

    if (status) { status.textContent = "تم ترتيب الصفحات ✔️"; status.className = "status success"; }
  } catch (err) {
    if (status) { status.textContent = "حدث خطأ أثناء ترتيب الصفحات"; status.className = "status error"; }
    console.error("reorder error:", err);
  }
});

/* ============================
   PDF → Images
============================ */
onIfExists("btn-pdf-to-images", "click", async () => {
  const fileInput = document.getElementById("pdf-to-images-file");
  const formatSelect = document.getElementById("pdf-image-format");
  const status = document.getElementById("pdf-to-images-status");
  const file = fileInput ? fileInput.files[0] : null;
  const format = formatSelect ? formatSelect.value : "png";

  if (!file) {
    if (status) { status.textContent = "الرجاء اختيار ملف PDF"; status.className = "status error"; }
    return;
  }

  if (typeof pdfjsLib === 'undefined') {
    if (status) { status.textContent = "مكتبة PDF.js غير محمّلة"; status.className = "status error"; }
    return;
  }

  if (status) { status.textContent = "جاري التحويل..."; status.className = "status"; }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2 });

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({ canvasContext: ctx, viewport }).promise;

      const imgData = canvas.toDataURL(`image/${format}`);
      const link = document.createElement("a");
      link.href = imgData;
      link.download = `page-${i}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    if (status) { status.textContent = "تم تحويل الصفحات إلى صور ✔️"; status.className = "status success"; }
  } catch (err) {
    if (status) { status.textContent = "حدث خطأ أثناء التحويل"; status.className = "status error"; }
    console.error("pdf-to-images error:", err);
  }
});

/* ============================
   Images → PDF
============================ */
onIfExists("btn-images-to-pdf", "click", async () => {
  const filesInput = document.getElementById("images-to-pdf-files");
  const status = document.getElementById("images-to-pdf-status");
  const files = filesInput ? filesInput.files : null;

  if (!files || !files.length) {
    if (status) { status.textContent = "الرجاء اختيار صور"; status.className = "status error"; }
    return;
  }

  if (status) { status.textContent = "جاري التحويل..."; status.className = "status"; }

  try {
    const pdfDoc = await PDFLib.PDFDocument.create();

    for (let file of files) {
      const imgBytes = await file.arrayBuffer();
      let img;
      if (file.type.includes("png")) {
        img = await pdfDoc.embedPng(imgBytes);
      } else {
        img = await pdfDoc.embedJpg(imgBytes);
      }

      const page = pdfDoc.addPage([img.width || 600, img.height || 800]);
      page.drawImage(img, { x: 0, y: 0, width: img.width || 600, height: img.height || 800 });
    }

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    downloadBlob(blob, "images.pdf");

    if (status) { status.textContent = "تم تحويل الصور إلى PDF ✔️"; status.className = "status success"; }
  } catch (err) {
    if (status) { status.textContent = "حدث خطأ أثناء التحويل"; status.className = "status error"; }
    console.error("images-to-pdf error:", err);
  }
});

/* ============================
   OCR – تحويل PDF إلى نص
============================ */
onIfExists("btn-ocr", "click", async () => {
  const fileInput = document.getElementById("ocr-file");
  const langSelect = document.getElementById("ocr-lang");
  const status = document.getElementById("ocr-status");
  const result = document.getElementById("ocr-result");
  const progressFill = document.getElementById("ocr-progress");
  const file = fileInput ? fileInput.files[0] : null;
  const lang = langSelect ? langSelect.value : 'eng';

  if (!file) {
    if (status) { status.textContent = "الرجاء اختيار ملف PDF"; status.className = "status error"; }
    return;
  }

  if (typeof Tesseract === 'undefined') {
    if (status) { status.textContent = "مكتبة Tesseract غير محمّلة"; status.className = "status error"; }
    return;
  }

  if (status) { status.textContent = "جاري قراءة الصفحات..."; status.className = "status"; }
  if (result) result.value = "";
  if (progressFill) progressFill.style.width = "0%";

  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = "";
    const totalPages = pdf.numPages;

    for (let i = 1; i <= totalPages; i++) {
      if (status) status.textContent = `جاري معالجة الصفحة ${i} من ${totalPages}...`;

      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2 });

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({ canvasContext: ctx, viewport }).promise;
      const dataUrl = canvas.toDataURL("image/png");

      const { data: { text } } = await Tesseract.recognize(dataUrl, lang, {
        logger: m => {
          if (m.status === "recognizing text" && m.progress && progressFill) {
            const base = ((i - 1) / totalPages) * 100;
            const local = m.progress * (100 / totalPages);
            const total = Math.min(100, base + local);
            progressFill.style.width = `${total}%`;
          }
        }
      });

      fullText += `\n\n===== صفحة ${i} =====\n\n` + (text || "");
      if (result) result.value = fullText;
    }

    if (progressFill) progressFill.style.width = "100%";
    if (status) { status.textContent = "تم استخراج النص ✔️"; status.className = "status success"; }
  } catch (err) {
    if (status) { status.textContent = "حدث خطأ أثناء استخراج النص (OCR)"; status.className = "status error"; }
    console.error("ocr error:", err);
  }
});
