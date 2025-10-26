const BACKEND_BASE = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
  ? 'http://localhost:5000'
  : 'https://qrcode-backend-2xh4.onrender.com';

let centerImageBase64 = null;

function previewCenterImage() {
  const fileInput = document.getElementById('center-image-file');
  const preview = document.getElementById('center-image-preview');
  const previewImg = document.getElementById('preview-img');

  if (fileInput.files && fileInput.files[0]) {
    const reader = new FileReader();
    reader.onload = function(e) {
      previewImg.src = e.target.result;
      preview.style.display = 'block';
      centerImageBase64 = e.target.result;
    };
    reader.readAsDataURL(fileInput.files[0]);
  }
}

function removeCenterImage() {
  const fileInput = document.getElementById('center-image-file');
  const preview = document.getElementById('center-image-preview');
  fileInput.value = '';
  preview.style.display = 'none';
  centerImageBase64 = null;
}

async function generateQR() {
  const text = document.getElementById('text').value.trim();
  const fg = document.getElementById('fg-color').value;
  const bg = document.getElementById('bg-color').value;
  const size = document.getElementById('qr-size').value;

  if (!text) {
    alert('กรุณากรอกข้อความหรือลิงก์ก่อนครับ!');
    return;
  }

  try {
    const res = await fetch(`${BACKEND_BASE}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        text, 
        fg, 
        bg, 
        size: parseInt(size),
        center_image: centerImageBase64
      })
    });

    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      document.getElementById('result').innerHTML = `
        <h3 style="margin: 16px 0; color: #1976d2;">✨ QR Code ของคุณพร้อมแล้ว!</h3>
        <img id="qr" src="${url}" alt="QR Code">
        <br>
        <button class="download-btn" onclick="downloadQR('${url}')">
          ⬇️ ดาวน์โหลด QR Code
        </button>
      `;
    } else {
      const err = await res.json();
      alert('❌ ' + (err.error || 'ไม่สามารถสร้าง QR ได้'));
    }
  } catch (e) {
    alert('เกิดข้อผิดพลาด: ' + e.message);
  }
}

function downloadQR(url) {
  const a = document.createElement('a');
  a.href = url;
  a.download = 'qrcode.png';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

async function uploadAndGenerate() {
  const fileInput = document.getElementById('file');
  const info = document.getElementById('file-info');
  info.textContent = 'กำลังอัปโหลด...';

  if (!fileInput.files || fileInput.files.length === 0) {
    alert('กรุณาเลือกไฟล์ก่อน');
    info.textContent = '';
    return;
  }

  const fd = new FormData();
  fd.append('file', fileInput.files[0]);

  try {
    const uploadRes = await fetch(`${BACKEND_BASE}/upload`, {
      method: 'POST',
      body: fd
    });

    const uploadData = await uploadRes.json();
    if (!uploadRes.ok) {
      alert('❌ ' + (uploadData.error || 'อัปโหลดไฟล์ไม่สำเร็จ'));
      info.textContent = '';
      return;
    }

    const fileUrl = BACKEND_BASE + uploadData.url;
    info.textContent = `✅ อัปโหลดสำเร็จ: ${uploadData.filename}`;

    const fg = document.getElementById('fg-color').value;
    const bg = document.getElementById('bg-color').value;
    const size = document.getElementById('qr-size').value;

    const qrRes = await fetch(`${BACKEND_BASE}/generate-file-qr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        file_url: fileUrl,
        fg: fg,
        bg: bg,
        size: parseInt(size),
        center_image: centerImageBase64
      })
    });

    if (qrRes.ok) {
      const blob = await qrRes.blob();
      const url = URL.createObjectURL(blob);
      document.getElementById('result').innerHTML = `
        <h3 style="margin: 16px 0; color: #1976d2;">✨ QR Code ของไฟล์พร้อมแล้ว!</h3>
        <img id="qr" src="${url}" alt="QR Code">
        <div class="row">
          <button class="download-btn" onclick="downloadQR('${url}')">⬇️ ดาวน์โหลด QR Code</button>
          <button style="background:#9c27b0;color:#fff;border:none;padding:14px 16px;border-radius:10px;cursor:pointer;" onclick="copyText('${fileUrl}')">🔗 คัดลอกลิงก์</button>
          <a href="${fileUrl}" target="_blank" style="display:inline-block;padding:14px 16px;background:#00897b;color:#fff;border-radius:10px;text-decoration:none;">👁️ เปิดไฟล์</a>
        </div>
      `;
    } else {
      const err = await qrRes.json();
      alert('❌ ' + (err.error || 'สร้าง QR ของไฟล์ไม่สำเร็จ'));
    }
  } catch (e) {
    alert('เกิดข้อผิดพลาด: ' + e.message);
    info.textContent = '';
  }
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    alert('คัดลอกลิงก์แล้ว');
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    alert('คัดลอกลิงก์แล้ว');
  }
}

