/* ============================================================
   تحميل نماذج face-api لكشف الوجه
============================================================ */
Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri("https://cdn.jsdelivr.net/npm/face-api.js/models"),
]).then(() => console.log("Face API Loaded"));

let cropper = null;

/* ============================================================
   فتح المودال + إعادة تهيئة الأدوات
============================================================ */
function openModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;

  modal.style.display = "flex";

  // إعادة تهيئة كل أداة عند فتح المودال
  if (id === "absher-modal") resetAbsherTool();
  if (id === "remove-bg-modal") resetRemoveBG();
  if (id === "enhance-modal") resetEnhance();
  if (id === "compress-modal") resetCompress();
  if (id === "convert-modal") resetConvert();
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.style.display = "none";
}

/* ============================================================
   إعادة تهيئة أداة أبشر
============================================================ */
function resetAbsherTool() {
  const img = document.getElementById("image-preview");
  img.src = "";
  img.style.display = "none";

  document.getElementById("result-preview").innerHTML = "";
  document.getElementById("status").textContent = "";

  if (cropper) {
    cropper.destroy();
    cropper = null;
  }
}

/* ============================================================
   رفع صورة أبشر + تشغيل Cropper
============================================================ */
document.getElementById("upload-image").addEventListener("change", function () {
  const file = this.files[0];
  if (!file) return;

  const img = document.getElementById("image-preview");
  img.src = URL.createObjectURL(file);
  img.style.display = "block";

  if (cropper) cropper.destroy();

  // تأخير بسيط حتى يظهر المودال
  setTimeout(() => {
    cropper = new Cropper(img, {
      viewMode: 1,
      aspectRatio: 1,
      autoCropArea: 1,
      movable: true,
      zoomable: true,
      scalable: true,
      rotatable: true,
      background: false,
    });

    detectFace();
  }, 200);
});

/* ============================================================
   كشف الوجه تلقائيًا
============================================================ */
async function detectFace() {
  const img = document.getElementById("image-preview");
  if (!img.src) return;

  const detection = await faceapi.detectSingleFace(
    img,
    new faceapi.TinyFaceDetectorOptions()
  );

  if (!detection) return;

  const box = detection.box;

  cropper.setCropBoxData({
    left: box.x,
    top: box.y,
    width: box.width,
    height: box.height,
  });
}

/* ============================================================
   إظهار حقول المقاس المخصص
============================================================ */
document.getElementById("preset-size").addEventListener("change", function () {
  const custom = this.value === "custom";
  document.getElementById("custom-width").style.display = custom ? "block" : "none";
  document.getElementById("custom-height").style.display = custom ? "block" : "none";
});

/* ============================================================
   إظهار لون الخلفية المخصص
============================================================ */
document.getElementById("background").addEventListener("change", function () {
  document.getElementById("custom-bg").style.display =
    this.value === "custom" ? "block" : "none";
});

/* ============================================================
   زر تعديل الصورة لأبشر
============================================================ */
document.getElementById("process-btn").addEventListener("click", async () => {
  const status = document.getElementById("status");
  status.textContent = "جاري معالجة الصورة...";
  status.className = "status";

  if (!cropper) {
    status.textContent = "الرجاء رفع صورة أولاً";
    status.className = "status error";
    return;
  }

  let width, height;
  const preset = document.getElementById("preset-size").value;

  if (preset === "custom") {
    width = parseInt(document.getElementById("custom-width").value);
    height = parseInt(document.getElementById("custom-height").value);
  } else {
    const [w, h] = preset.split("x");
    width = parseInt(w);
    height = parseInt(h);
  }

  let bg = "white";
  const bgType = document.getElementById("background").value;
  if (bgType === "transparent") bg = null;
  if (bgType === "custom") bg = document.getElementById("custom-bg").value;

  const dpi = parseInt(document.getElementById("dpi").value);
  const maxKB = parseInt(document.getElementById("max-size").value);
  const format = document.getElementById("format").value;

  const croppedCanvas = cropper.getCroppedCanvas({
    width,
    height,
    fillColor: bg || "white",
  });

  let quality = 0.92;
  let output;

  do {
    output = croppedCanvas.toDataURL(`image/${format}`, quality);
    const sizeKB = Math.round((output.length * 3) / 4 / 1024);
    if (sizeKB <= maxKB) break;
    quality -= 0.05;
  } while (quality > 0.1);

  document.getElementById("result-preview").innerHTML = `
    <h3>الصورة النهائية:</h3>
    <img src="${output}">
    <br><br>
    <a href="${output}" download="absher-photo.${format}" class="action-btn">تحميل الصورة</a>
  `;

  status.textContent = "تم تجهيز الصورة ✔️";
  status.className = "status success";
});

/* ============================================================
   إعادة تهيئة أداة إزالة الخلفية
============================================================ */
function resetRemoveBG() {
  document.getElementById("remove-bg-input").value = "";
  document.getElementById("remove-bg-status").textContent = "";
  document.getElementById("remove-bg-preview").innerHTML = "";
}

/* ============================================================
   إزالة الخلفية
============================================================ */
document.getElementById("remove-bg-btn").addEventListener("click", async () => {
  const file = document.getElementById("remove-bg-input").files[0];
  const status = document.getElementById("remove-bg-status");

  if (!file) {
    status.textContent = "الرجاء اختيار صورة";
    status.className = "status error";
    return;
  }

  status.textContent = "جاري إزالة الخلفية...";
  status.className = "status";

  const img = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    if (data[i] > 240 && data[i + 1] > 240 && data[i + 2] > 240) {
      data[i + 3] = 0;
    }
  }

  ctx.putImageData(imageData, 0, 0);

  const output = canvas.toDataURL("image/png");

  document.getElementById("remove-bg-preview").innerHTML = `
    <img src="${output}">
    <br><br>
    <a href="${output}" download="no-bg.png" class="action-btn">تحميل الصورة</a>
  `;

  status.textContent = "تمت إزالة الخلفية ✔️";
  status.className = "status success";
});

/* ============================================================
   إعادة تهيئة أداة تحسين الجودة
============================================================ */
function resetEnhance() {
  document.getElementById("enhance-input").value = "";
  document.getElementById("enhance-status").textContent = "";
  document.getElementById("enhance-preview").innerHTML = "";
}

/* ============================================================
   تحسين الجودة
============================================================ */
document.getElementById("enhance-btn").addEventListener("click", async () => {
  const file = document.getElementById("enhance-input").files[0];
  const status = document.getElementById("enhance-status");

  if (!file) {
    status.textContent = "الرجاء اختيار صورة";
    status.className = "status error";
    return;
  }

  status.textContent = "جاري تحسين الجودة...";
  status.className = "status";

  const img = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");

  ctx.filter = "contrast(115%) brightness(110%) saturate(120%)";
  ctx.drawImage(img, 0, 0);

  const output = canvas.toDataURL("image/jpeg", 0.92);

  document.getElementById("enhance-preview").innerHTML = `
    <img src="${output}">
    <br><br>
    <a href="${output}" download="enhanced.jpg" class="action-btn">تحميل الصورة</a>
  `;

  status.textContent = "تم تحسين الجودة ✔️";
  status.className = "status success";
});

/* ============================================================
   إعادة تهيئة أداة الضغط
============================================================ */
function resetCompress() {
  document.getElementById("compress-input").value = "";
  document.getElementById("compress-status").textContent = "";
  document.getElementById("compress-preview").innerHTML = "";
}

/* ============================================================
   ضغط الصور
============================================================ */
document.getElementById("compress-btn").addEventListener("click", async () => {
  const file = document.getElementById("compress-input").files[0];
  const maxKB = parseInt(document.getElementById("compress-size").value);
  const status = document.getElementById("compress-status");

  if (!file) {
    status.textContent = "الرجاء اختيار صورة";
    status.className = "status error";
    return;
  }

  status.textContent = "جاري الضغط...";
  status.className = "status";

  const img = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);

  let quality = 0.92;
  let output;

  do {
    output = canvas.toDataURL("image/jpeg", quality);
    const sizeKB = Math.round((output.length * 3) / 4 / 1024);
    if (sizeKB <= maxKB) break;
    quality -= 0.05;
  } while (quality > 0.1);

  document.getElementById("compress-preview").innerHTML = `
    <img src="${output}">
    <br><br>
    <a href="${output}" download="compressed.jpg" class="action-btn">تحميل الصورة</a>
  `;

  status.textContent = "تم ضغط الصورة ✔️";
  status.className = "status success";
});

/* ============================================================
   إعادة تهيئة أداة التحويل
============================================================ */
function resetConvert() {
  document.getElementById("convert-input").value = "";
  document.getElementById("convert-status").textContent = "";
  document.getElementById("convert-preview").innerHTML = "";
}

/* ============================================================
   تحويل الصور
============================================================ */
document.getElementById("convert-btn").addEventListener("click", async () => {
  const file = document.getElementById("convert-input").files[0];
  const format = document.getElementById("convert-format").value;
  const status = document.getElementById("convert-status");

  if (!file) {
    status.textContent = "الرجاء اختيار صورة";
    status.className = "status error";
    return;
  }

  status.textContent = "جاري التحويل...";
  status.className = "status";

  const img = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);

  const output = canvas.toDataURL(`image/${format}`, 0.92);

  document.getElementById("convert-preview").innerHTML = `
    <img src="${output}">
    <br><br>
    <a href="${output}" download="converted.${format}" class="action-btn">تحميل الصورة</a>
  `;

  status.textContent = "تم تحويل الصورة ✔️";
  status.className = "status success";
});
