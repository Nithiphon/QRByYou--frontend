// Backend URL configuration
const USE_LOCAL_BACKEND = false;
const BACKEND_BASE = (USE_LOCAL_BACKEND && (location.hostname === 'localhost' || location.hostname === '127.0.0.1'))
  ? 'http://localhost:5000'
  : 'https://qrbyyou-backend-2.onrender.com';

// Debug function
async function checkBackendStatus() {
  try {
    const res = await fetch(`${BACKEND_BASE}/health`);
    if (res.ok) {
      console.log('✅ Backend connected:', BACKEND_BASE);
      return true;
    } else {
      console.error('❌ Backend error:', res.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Backend connection failed:', error.message);
    return false;
  }
}

// Auto check on load
document.addEventListener('DOMContentLoaded', () => {
  checkBackendStatus();
  setupTabs();
  setupColorInputs();
});

// Tab functionality
function setupTabs() {
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active class from all tabs and content
      document.querySelectorAll('.tab').forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      
      // Add active class to clicked tab and its content
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      const contentId = tab.getAttribute('aria-controls');
      document.getElementById(contentId).classList.add('active');
    });
  });
}

// Color input preview
function setupColorInputs() {
  // Tab 1 colors
  setupColorInput('fg-color', 'color-label');
  setupColorInput('bg-color', 'color-label-bg');
  
  // Tab 2 colors
  setupColorInput('fg-color-file', 'color-label-file');
  setupColorInput('bg-color-file', 'color-label-file-bg');
}

function setupColorInput(inputId, labelClass) {
  const input = document.getElementById(inputId);
  if (!input) return;
  
  const label = input.parentElement.querySelector('.' + labelClass);
  if (!label) return;
  
  function updatePreview(color) {
    const colorName = getColorName(color);
    label.textContent = colorName || color;
  }

  input.addEventListener('input', (e) => updatePreview(e.target.value));
  input.addEventListener('change', (e) => updatePreview(e.target.value));
}

function getColorName(hex) {
  const colors = {
    '#000000': 'สีดำ',
    '#ffffff': 'สีขาว',
    '#ff0000': 'สีแดง',
    '#00ff00': 'สีเขียว',
    '#0000ff': 'สีน้ำเงิน',
    '#ffff00': 'สีเหลือง',
    '#ff00ff': 'สีม่วง',
    '#00ffff': 'สีฟ้า',
    '#ffa500': 'สีส้ม'
  };
  return colors[hex.toLowerCase()] || '';
}

// Loading state helper
function setLoading(btnId, isLoading, text) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  
  if (isLoading) {
    btn.dataset.orig = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `
      <svg class="spinner" viewBox="0 0 24 24" width="24" height="24">
        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="3"/>
      </svg>
      ${text || 'กำลังดำเนินการ...'}
    `;
  } else {
    btn.disabled = false;
    if (btn.dataset.orig) btn.innerHTML = btn.dataset.orig;
  }
}

let centerImageBase64 = null;
let centerImageBase64_2 = null;

function previewCenterImage() {
  const fileInput = document.getElementById('center-image-file');
  const preview = document.getElementById('center-image-preview');
  const previewImg = document.getElementById('preview-img');

  if (fileInput.files && fileInput.files[0]) {
    const reader = new FileReader();
    reader.onload = function(e) {
      previewImg.src = e.target.result;
      preview.hidden = false;
      centerImageBase64 = e.target.result;
    };
    reader.readAsDataURL(fileInput.files[0]);
  }
}

function removeCenterImage() {
  const fileInput = document.getElementById('center-image-file');
  const preview = document.getElementById('center-image-preview');
  fileInput.value = '';
  preview.hidden = true;
  centerImageBase64 = null;
}

function previewCenterImage2() {
  const fileInput = document.getElementById('center-image-file-2');
  const preview = document.getElementById('center-image-preview-2');
  const previewImg = document.getElementById('preview-img-2');

  if (fileInput.files && fileInput.files[0]) {
    const reader = new FileReader();
    reader.onload = function(e) {
      previewImg.src = e.target.result;
      preview.hidden = false;
      centerImageBase64_2 = e.target.result;
    };
    reader.readAsDataURL(fileInput.files[0]);
  }
}

function removeCenterImage2() {
  const fileInput = document.getElementById('center-image-file-2');
  const preview = document.getElementById('center-image-preview-2');
  fileInput.value = '';
  preview.hidden = true;
  centerImageBase64_2 = null;
}

async function generateQR() {
  const text = document.getElementById('text').value.trim();
  const fg = document.getElementById('fg-color').value;
  const bg = document.getElementById('bg-color').value;
  const size = document.getElementById('qr-size').value;

  if (!text) {
    alert('กรุณากรอกข้อความหรือลิงก์ก่อนครับ');
    return;
  }

  setLoading('generate-btn', true, 'กำลังสร้าง QR Code...');
  document.getElementById('result').innerHTML = '';

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
        <div class="qr-result">
          <img id="qr" src="${url}" alt="QR Code">
          <div class="actions-group">
            <button class="btn btn-primary" onclick="downloadQR('${url}', 'qrcode-text')">
              <svg class="icon" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
              </svg>
              ดาวน์โหลด QR Code
            </button>
          </div>
        </div>
      `;
    } else {
      const err = await res.json();
      alert('❌ ' + (err.error || 'ไม่สามารถสร้าง QR Code ได้'));
    }
  } catch (e) {
    alert('เกิดข้อผิดพลาด: ' + e.message);
  } finally {
    setLoading('generate-btn', false);
  }
}

async function uploadAndGenerate() {
  const fileInput = document.getElementById('file');
  const info = document.getElementById('file-info');

  if (!fileInput.files || fileInput.files.length === 0) {
    alert('กรุณาเลือกไฟล์ก่อน');
    return;
  }

  setLoading('upload-btn', true, 'กำลังอัปโหลด...');
  info.textContent = 'กำลังอัปโหลดไฟล์...';
  info.style.background = 'var(--secondary)';
  info.style.color = 'var(--text-secondary)';
  document.getElementById('result').innerHTML = '';

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
      setLoading('upload-btn', false);
      return;
    }

    const fileUrl = BACKEND_BASE + uploadData.url;
    info.textContent = `✅ อัปโหลดสำเร็จ: ${uploadData.filename}`;
    info.style.background = '#e8f5e9';
    info.style.color = '#2e7d32';

    const fg = document.getElementById('fg-color-file').value;
    const bg = document.getElementById('bg-color-file').value;
    const size = document.getElementById('qr-size-file').value;

    const qrRes = await fetch(`${BACKEND_BASE}/generate-file-qr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        file_url: fileUrl,
        fg, 
        bg,
        size: parseInt(size),
        center_image: centerImageBase64_2
      })
    });

    if (qrRes.ok) {
      const blob = await qrRes.blob();
      const url = URL.createObjectURL(blob);
      document.getElementById('result').innerHTML = `
        <div class="qr-result">
          <img id="qr" src="${url}" alt="QR Code">
          <div class="actions-group">
            <button class="btn btn-primary" onclick="downloadQR('${url}', 'qrcode-file')">
              <svg class="icon" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
              </svg>
              ดาวน์โหลด QR Code
            </button>
            <button class="btn btn-secondary" onclick="copyText('${fileUrl}')">
              <svg class="icon" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
              </svg>
              คัดลอกลิงก์
            </button>
          </div>
        </div>
      `;
    } else {
      const err = await qrRes.json();
      alert('❌ ' + (err.error || 'สร้าง QR Code ไม่สำเร็จ'));
    }
  } catch (e) {
    alert('เกิดข้อผิดพลาด: ' + e.message);
    info.textContent = '';
  } finally {
    setLoading('upload-btn', false);
  }
}

function downloadQR(url, filename = 'qrcode') {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename + '.png';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    alert('✅ คัดลอกลิงก์แล้ว');
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    alert('✅ คัดลอกลิงก์แล้ว');
  }
}