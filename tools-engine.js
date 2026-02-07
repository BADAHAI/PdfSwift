/* =========================================================
   PdfSwift — Tools Engine (Client-Side Only)
   All tools run locally on the user's device.
========================================================= */

/* فتح الأدوات داخل مودال */
function openTool(toolName) {
    const modal = document.createElement("div");
    modal.className = "modal open";

    if (toolName === "absher") {
        modal.innerHTML = `
            <div class="modal-content" style="max-width:600px;">
                <h3>تجهيز صورة أبشر</h3>

                <label>اختر نوع الوثيقة:</label>
                <select id="absherType" class="input-select">
                    <option value="id">هوية وطنية</option>
                    <option value="passport">جواز سفر</option>
                    <option value="iqama">إقامة</option>
                </select>

                <label style="margin-top:15px;">ارفع الصورة:</label>
                <input type="file" id="toolFile" accept="image/*" />

                <div id="previewArea" style="margin-top:20px; display:none;">
                    <h4>المعاينة:</h4>
                    <div style="display:flex; gap:10px;">
                        <div>
                            <p>قبل:</p>
                            <img id="beforePreview" style="width:250px; border-radius:10px;">
                        </div>
                        <div>
                            <p>بعد:</p>
                            <img id="afterPreview" style="width:250px; border-radius:10px;">
                        </div>
                    </div>
                </div>

                <div style="margin-top: 18px;">
                    <button class="btn btn-primary" onclick="runTool('absher')">تجهيز الصورة</button>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">إغلاق</button>
                </div>
            </div>
        `;
    } else {
        modal.innerHTML = `
            <div class="modal-content">
                <h3>أداة: ${getToolTitle(toolName)}</h3>
                <input type="file" id="toolFile" accept="image/*,.pdf" />
                <div style="margin-top: 18px;">
                    <button class="btn btn-primary" onclick="runTool('${toolName}')">تشغيل الأداة</button>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">إغلاق</button>
                </div>
            </div>
        `;
    }

    document.body.appendChild(modal);
}

/* أسماء الأدوات */
function getToolTitle(tool) {
    const titles = {
        absher: "تجهيز صورة أبشر",
        img2pdf: "تحويل صورة إلى PDF",
        pdf2img: "تحويل PDF إلى صور",
        compress: "ضغط الصور",
        crop: "قص الصور",
        rotate: "تدوير الصور"
    };
    return titles[tool] || "أداة غير معروفة";
}

/* تشغيل الأداة */
function runTool(toolName) {
    const fileInput = document.getElementById("toolFile");
    if (!fileInput.files.length) {
        alert("الرجاء اختيار ملف أولاً.");
        return;
    }

    const file = fileInput.files[0];

    switch (toolName) {
        case "absher":
            prepareAbsherPhoto(file);
            break;

        case "img2pdf":
            convertImageToPDF(file);
            break;

        case "pdf2img":
            convertPDFToImages(file);
            break;

        case "compress":
            compressImage(file);
            break;

        case "crop":
            cropImage(file);
            break;

        case "rotate":
            rotateImage(file);
            break;

        default:
            alert("الأداة غير معروفة.");
    }
}

/* =========================================================
   1) تجهيز صورة أبشر (نسخة Lite Pro)
========================================================= */

async function prepareAbsherPhoto(file) {
    const type = document.getElementById("absherType").value;

    const sizes = {
        id: { w: 600, h: 800 },
        passport: { w: 826, h: 1102 },
        iqama: { w: 600, h: 800 }
    };

    const target = sizes[type];

    // تحميل face-api
    await faceapi.nets.ssdMobilenetv1.loadFromUri("https://cdn.jsdelivr.net/npm/face-api.js/models");

    const img = new Image();
    img.src = URL.createObjectURL(file);

    img.onload = async () => {
        document.getElementById("previewArea").style.display = "block";
        document.getElementById("beforePreview").src = img.src;

        // كشف الوجه
        const detection = await faceapi.detectSingleFace(img);

        let cropX = 0, cropY = 0, cropW = img.width, cropH = img.height;

        if (detection) {
            const box = detection.box;
            cropX = Math.max(0, box.x - box.width * 0.5);
            cropY = Math.max(0, box.y - box.height * 0.8);
            cropW = box.width * 2;
            cropH = box.height * 2.5;
        }

        // تجهيز الكانفس
        const canvas = document.createElement("canvas");
        canvas.width = target.w;
        canvas.height = target.h;

        const ctx = canvas.getContext("2d");

        // خلفية بيضاء
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // قص الوجه
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = cropW;
        tempCanvas.height = cropH;
        tempCanvas.getContext("2d").drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

        // تحسين الإضاءة
        const imageData = tempCanvas.getContext("2d").getImageData(0, 0, cropW, cropH);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.min(255, data[i] * 1.1);     // R
            data[i+1] = Math.min(255, data[i+1] * 1.1); // G
            data[i+2] = Math.min(255, data[i+2] * 1.1); // B
        }

        tempCanvas.getContext("2d").putImageData(imageData, 0, 0);

        // تنعيم بسيط
        ctx.filter = "blur(1px)";

        // رسم الصورة داخل الإطار
        ctx.drawImage(
            tempCanvas,
            (canvas.width - cropW) / 2,
            (canvas.height - cropH) / 2,
            cropW,
            cropH
        );

        // إطار أبيض
        ctx.filter = "none";
        ctx.lineWidth = 8;
        ctx.strokeStyle = "#ffffff";
        ctx.strokeRect(0, 0, canvas.width, canvas.height);

        const finalImage = canvas.toDataURL("image/jpeg");
        document.getElementById("afterPreview").src = finalImage;

        // زر تنزيل
        const downloadBtn = document.createElement("a");
        downloadBtn.innerText = "تنزيل الصورة";
        downloadBtn.className = "btn btn-primary";
        downloadBtn.style.marginTop = "15px";
        downloadBtn.download = `absher-${type}.jpg`;
        downloadBtn.href = finalImage;

        document.querySelector(".modal-content").appendChild(downloadBtn);
    };
}

/* =========================================================
   2) تحويل صورة → PDF
========================================================= */

function convertImageToPDF(file) {
    const reader = new FileReader();
    reader.onload = function () {
        const img = new Image();
        img.src = reader.result;

        img.onload = () => {
            const pdf = new jspdf.jsPDF({
                orientation: img.width > img.height ? "l" : "p",
                unit: "px",
                format: [img.width, img.height]
            });

            pdf.addImage(img, "JPEG", 0, 0, img.width, img.height);
            pdf.save("converted.pdf");
        };
    };
    reader.readAsDataURL(file);
}

/* =========================================================
   3) تحويل PDF → صور
========================================================= */

function convertPDFToImages(file) {
    const reader = new FileReader();
    reader.onload = async function () {
        const pdf = await pdfjsLib.getDocument({ data: reader.result }).promise;

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 2 });

            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            canvas.width = viewport.width;
            canvas.height = viewport.height;

            await page.render({ canvasContext: ctx, viewport }).promise;

            downloadCanvas(canvas, `page-${i}.jpg`);
        }
    };
    reader.readAsArrayBuffer(file);
}

/* =========================================================
   4) ضغط الصور
========================================================= */

function compressImage(file) {
    const img = new Image();
    img.src = URL.createObjectURL(file);

    img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        const compressed = canvas.toDataURL("image/jpeg", 0.5);
        downloadBase64(compressed, "compressed.jpg");
    };
}

/* =========================================================
   5) قص الصور
========================================================= */

function cropImage(file) {
    const img = new Image();
    img.src = URL.createObjectURL(file);

    img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width * 0.8;
        canvas.height = img.height * 0.8;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, img.width * 0.1, img.height * 0.1, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);

        downloadCanvas(canvas, "cropped.jpg");
    };
}

/* =========================================================
   6) تدوير الصور
========================================================= */

function rotateImage(file) {
    const img = new Image();
    img.src = URL.createObjectURL(file);

    img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.height;
        canvas.height = img.width;

        const ctx = canvas.getContext("2d");

        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(Math.PI / 2);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);

        downloadCanvas(canvas, "rotated.jpg");
    };
}

/* =========================================================
   أدوات التحميل
========================================================= */

function downloadCanvas(canvas, filename) {
    const link = document.createElement("a");
    link.download = filename;
    link.href = canvas.toDataURL("image/jpeg");
    link.click();
}

function downloadBase64(data, filename) {
    const link = document.createElement("a");
    link.download = filename;
    link.href = data;
    link.click();
}
