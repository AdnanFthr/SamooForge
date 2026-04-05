/**
 * CREATE REQUEST LOGIC - Items Table Version with Master-Detail Structure
 * Compatible with request_items table structure
 */

let selectedFiles = [];
const MAX_FILES = 10;
const MAX_TOTAL_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
const MAX_ITEMS = 25;

let isSubmitting = false;
let isEditMode = false;
let editRequestId = null;
let editRequestData = null;
let itemRows = [];

// Master data cache
let masterData = {
    fieldRigNames: [],
    locationCodes: []
};

function getSession() {
    return JSON.parse(sessionStorage.getItem('sas_user_session') || '{}');
}

// ============================================
// MASTER DATA LOADING
// ============================================

async function loadFieldRigNames() {
    try {
        const response = await fetch(`${API_BASE_URL}/field-rig-names`);
        const result = await response.json();
        
        if (result.status === 'success') {
            masterData.fieldRigNames = result.data;
            populateFieldRigDropdown();
        }
    } catch (error) {
        console.error('Error loading field/rig names:', error);
    }
}

async function loadLocationCodes() {
    try {
        const response = await fetch(`${API_BASE_URL}/location-codes`);
        const result = await response.json();
        
        if (result.status === 'success') {
            masterData.locationCodes = result.data;
            populateLocationDropdown();
        }
    } catch (error) {
        console.error('Error loading location codes:', error);
    }
}

function populateFieldRigDropdown() {
    const select = document.getElementById('field_rig_name');
    if (!select) return;
    
    const firstOption = select.options[0];
    select.innerHTML = '';
    select.appendChild(firstOption);
    
    masterData.fieldRigNames.forEach(item => {
        const option = document.createElement('option');
        option.value = item.name;
        option.textContent = item.name;
        select.appendChild(option);
    });
}

function populateLocationDropdown() {
    const select = document.getElementById('location_code');
    if (!select) return;
    
    const firstOption = select.options[0];
    select.innerHTML = '';
    select.appendChild(firstOption);
    
    masterData.locationCodes.forEach(item => {
        const option = document.createElement('option');
        option.value = item.code;
        option.textContent = item.code;
        select.appendChild(option);
    });
}

// ============================================
// ITEMS TABLE FUNCTIONS
// ============================================

function initItemsTable() {
    if (itemRows.length === 0) {
        addItemRow();
    }
    updateItemsCounter();
}

function addItemRow(data = null) {
    if (itemRows.length >= MAX_ITEMS) {
        showError(`Maksimal ${MAX_ITEMS} baris item`);
        return;
    }
    
    const rowId = Date.now() + Math.random();
    const rowData = data || {
        id: rowId,
        item_no: itemRows.length + 1,
        full_description: '',
        unit: '',
        qty_requested: '',
        qty_approved: '',
        qty_supplied: '',
        qty_outstanding: ''
    };
    
    if (!data) {
        rowData.item_no = itemRows.length + 1;
        itemRows.push(rowData);
    } else {
        itemRows.push(rowData);
    }
    
    renderItemsTable();
    updateItemsCounter();
}

function removeItemRow(index) {
    if (itemRows.length <= 1) {
        showError('Minimal harus ada 1 baris item');
        return;
    }
    
    itemRows.splice(index, 1);
    reorderItemNumbers();
    renderItemsTable();
    updateItemsCounter();
}

function reorderItemNumbers() {
    itemRows.forEach((row, index) => {
        row.item_no = index + 1;
    });
}

function renderItemsTable() {
    const tbody = document.getElementById('items-tbody');
    if (!tbody) return;
    
    if (itemRows.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8">
                    <div class="items-empty-state">
                        <div class="empty-icon">📋</div>
                        <p>Belum ada item. Klik "Tambah Baris" untuk menambah.</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = itemRows.map((row, index) => `
        <tr data-index="${index}">
            <td class="col-no">
                <div class="row-number">${row.item_no}</div>
            </td>
            <td class="col-desc">
                <input type="text" 
                       class="item-input desc-input" 
                       placeholder="Deskripsi lengkap item..."
                       value="${escapeHtml(row.full_description)}"
                       onchange="updateItemData(${index}, 'full_description', this.value)"
                       onblur="updateItemData(${index}, 'full_description', this.value)">
            </td>
            <td class="col-unit">
                <input type="text" 
                       class="item-input unit-input" 
                       placeholder="Unit"
                       value="${escapeHtml(row.unit)}"
                       onchange="updateItemData(${index}, 'unit', this.value)"
                       onblur="updateItemData(${index}, 'unit', this.value)">
            </td>
            <td class="col-qty" colspan="4">
                <div class="qty-cells">
                    <input type="number" 
                           class="qty-input" 
                           placeholder="0"
                           min="0"
                           step="1"
                           value="${row.qty_requested}"
                           onchange="updateItemData(${index}, 'qty_requested', this.value)"
                           onblur="updateItemData(${index}, 'qty_requested', this.value)"
                           title="Requested">
                    <input type="number" 
                           class="qty-input" 
                           placeholder="0"
                           min="0"
                           step="1"
                           value="${row.qty_approved}"
                           onchange="updateItemData(${index}, 'qty_approved', this.value)"
                           onblur="updateItemData(${index}, 'qty_approved', this.value)"
                           title="Approved" readonly>
                    <input type="number" 
                           class="qty-input" 
                           placeholder="0"
                           min="0"
                           step="1"
                           value="${row.qty_supplied}"
                           onchange="updateItemData(${index}, 'qty_supplied', this.value)"
                           onblur="updateItemData(${index}, 'qty_supplied', this.value)"
                           title="Supplied" readonly>
                    <input type="number" 
                           class="qty-input" 
                           placeholder="0"
                           min="0"
                           step="1"
                           value="${row.qty_outstanding}"
                           onchange="updateItemData(${index}, 'qty_outstanding', this.value)"
                           onblur="updateItemData(${index}, 'qty_outstanding', this.value)"
                           title="Outstanding" readonly>
                </div>
            </td>
            <td class="col-action">
                <button type="button" 
                        class="btn-delete-row" 
                        onclick="removeItemRow(${index})"
                        title="Hapus baris"
                        ${itemRows.length <= 1 ? 'disabled' : ''}>
                    🗑️
                </button>
            </td>
        </tr>
    `).join('');
    
    updateAddButtonState();
}

function updateItemData(index, field, value) {
    if (itemRows[index]) {
        // For quantity fields, ensure integer or null/empty
        if (field.startsWith('qty_')) {
            // Allow empty string (will be sent as null)
            if (value === '' || value === null || value === undefined) {
                itemRows[index][field] = '';
            } else {
                const intValue = parseInt(value);
                itemRows[index][field] = isNaN(intValue) ? '' : intValue;
            }
        } else {
            itemRows[index][field] = value;
        }
    }
}

function updateItemsCounter() {
    const countEl = document.getElementById('items-count');
    const hintEl = document.getElementById('items-hint');
    const summaryItems = document.getElementById('summary-items');
    
    const count = itemRows.length;
    
    if (countEl) countEl.textContent = count;
    if (summaryItems) summaryItems.textContent = `${count} baris`;
    
    if (countEl) {
        if (count >= MAX_ITEMS) {
            countEl.parentElement.classList.add('warning');
        } else {
            countEl.parentElement.classList.remove('warning');
        }
    }
    
    if (hintEl) {
        if (count >= MAX_ITEMS) {
            hintEl.textContent = 'Batas maksimal tercapai';
            hintEl.style.color = '#dc2626';
        } else {
            hintEl.textContent = `Minimal 1 baris, maksimal ${MAX_ITEMS} baris`;
            hintEl.style.color = '#64748b';
        }
    }
}

function updateAddButtonState() {
    const btn = document.getElementById('btn-add-item');
    if (btn) {
        btn.disabled = itemRows.length >= MAX_ITEMS;
    }
}

function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ============================================
// FORM INITIALIZATION
// ============================================

function initForm() {
    const session = getSession();
    
    const userNameEl = document.getElementById('display-user-name');
    const deptEl = document.getElementById('display-department');
    
    if (userNameEl) userNameEl.textContent = session.nama_lengkap || '-';
    if (deptEl) deptEl.textContent = session.departemen || '-';
    
    // Reset item rows
    itemRows = [];
    
    loadFieldRigNames();
    loadLocationCodes();
    
    initItemsTable();
    setupTypeSelector();
    setupRequestInfoListeners();
    setupFileUpload();
    setupNotesCounter();
    setupSubmit();
    updateSummary();
}

function initEditForm() {
    console.log('Initializing edit form');
    
    const session = getSession();
    
    const userNameEl = document.getElementById('display-user-name');
    const deptEl = document.getElementById('display-department');
    const headerTitle = document.querySelector('.header-left h1');
    
    if (userNameEl) userNameEl.textContent = session.nama_lengkap || '-';
    if (deptEl) deptEl.textContent = session.departemen || '-';
    if (headerTitle) headerTitle.textContent = 'Edit Request - Returned';
    
    showReturnInfoCard();
    lockRequestType();
    
    // Reset item rows
    itemRows = [];
    
    Promise.all([loadFieldRigNames(), loadLocationCodes()]).then(() => {
        fillEditFormData();
    });
    
    setupTypeSelector();
    setupRequestInfoListeners();
    setupFileUpload();
    setupNotesCounter();
    setupSubmit();
    updateSummary();
    
    const submitBtn = document.getElementById('btn-submit');
    const cancelBtn = document.querySelector('.btn-secondary');
    
    if (submitBtn) submitBtn.textContent = '🚀 Resubmit Request';
    if (cancelBtn) cancelBtn.textContent = '❌ Batal Edit';
}

function fillEditFormData() {
    // Fill dropdowns
    const fieldRigSelect = document.getElementById('field_rig_name');
    const locationSelect = document.getElementById('location_code');
    const freightSelect = document.getElementById('freight_by');
    
    if (fieldRigSelect && editRequestData.field_rig_name) {
        fieldRigSelect.value = editRequestData.field_rig_name;
    }
    if (locationSelect && editRequestData.location_code) {
        locationSelect.value = editRequestData.location_code;
    }
    if (freightSelect && editRequestData.freight_by) {
        freightSelect.value = editRequestData.freight_by;
    }
    
    // Fill general notes (dari kolom general_notes, bukan description lama)
    const notesEl = document.getElementById('general_notes');
    const notesCount = document.getElementById('notes-count');
    
    // Gunakan general_notes jika ada, fallback ke description untuk backward compatibility
    const notesValue = editRequestData.general_notes || editRequestData.description || '';
    if (notesEl) notesEl.value = notesValue;
    if (notesCount) notesCount.textContent = notesValue.length;
    
    // Load items dari editRequestData.items (array dari tabel request_items)
    if (editRequestData.items && editRequestData.items.length > 0) {
        editRequestData.items.forEach(item => {
            addItemRow({
                id: item.id || Date.now() + Math.random(),
                item_no: item.item_no,
                full_description: item.full_description || '',
                unit: item.unit || '',
                qty_requested: item.qty_requested || '',
                qty_approved: item.qty_approved || '',
                qty_supplied: item.qty_supplied || '',
                qty_outstanding: item.qty_outstanding || ''
            });
        });
    } else {
        // Jika tidak ada items, add empty row
        addItemRow();
    }
    
    // Update summary
    const summaryType = document.getElementById('summary-type');
    const summaryRequestNo = document.getElementById('summary-request-no');
    const summaryRequestNoRow = document.getElementById('summary-request-no-row');
    
    if (summaryType) summaryType.textContent = editRequestData.request_type === 'MR' ? 'Material Request' : 'Field Request';
    if (summaryRequestNo) summaryRequestNo.textContent = editRequestData.request_no;
    if (summaryRequestNoRow) summaryRequestNoRow.style.display = 'flex';
    
    updateSummary();
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupRequestInfoListeners() {
    const fieldRigSelect = document.getElementById('field_rig_name');
    const locationSelect = document.getElementById('location_code');
    const freightSelect = document.getElementById('freight_by');
    
    [fieldRigSelect, locationSelect, freightSelect].forEach(select => {
        if (select) {
            select.addEventListener('change', updateSummary);
        }
    });
}

function setupNotesCounter() {
    const textarea = document.getElementById('general_notes');
    const counter = document.getElementById('notes-count');
    
    if (!textarea || !counter) return;
    
    textarea.addEventListener('input', () => {
        let len = textarea.value.length;
        if (len > 255) {
            textarea.value = textarea.value.substring(0, 255);
            len = 255;
        }
        counter.textContent = len;
    });
}

// ============================================
// VALIDATION & SUBMIT
// ============================================

function validateItems() {
    if (itemRows.length === 0) {
        return { valid: false, message: 'Minimal harus ada 1 baris item' };
    }
    
    if (itemRows.length > MAX_ITEMS) {
        return { valid: false, message: `Maksimal ${MAX_ITEMS} baris item untuk format PDF` };
    }
    
    // Check if at least one item has description
    const hasDescription = itemRows.some(row => row.full_description && row.full_description.trim() !== '');
    if (!hasDescription) {
        return { valid: false, message: 'Minimal 1 item harus memiliki deskripsi' };
    }
    
    return { valid: true };
}

function setupSubmit() {
    const form = document.getElementById('createRequestForm');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (isSubmitting) return;
        
        const session = getSession();
        const typeInput = document.querySelector('input[name="request_type"]:checked');
        
        // Get field values
        const fieldRigName = document.getElementById('field_rig_name')?.value;
        const locationCode = document.getElementById('location_code')?.value;
        const freightBy = document.getElementById('freight_by')?.value;
        const generalNotes = document.getElementById('general_notes')?.value?.trim();
        
        if (!session.id) {
            showError('Sesi berakhir, silakan login ulang');
            return;
        }
        
        if (!typeInput) {
            showError('Pilih tipe request (MR atau FR)');
            return;
        }
        
        if (!fieldRigName) {
            showError('Field/Rig Name wajib dipilih');
            document.getElementById('field_rig_name')?.focus();
            return;
        }
        
        if (!locationCode) {
            showError('Location Code wajib dipilih');
            document.getElementById('location_code')?.focus();
            return;
        }
        
        if (!freightBy) {
            showError('Freight By wajib dipilih');
            document.getElementById('freight_by')?.focus();
            return;
        }
        
        // Validate items
        const itemValidation = validateItems();
        if (!itemValidation.valid) {
            showError(itemValidation.message);
            return;
        }
        
        showConfirmSubmit(typeInput.value, fieldRigName, locationCode, freightBy, generalNotes);
    });
}

function showConfirmSubmit(type, fieldRigName, locationCode, freightBy, generalNotes) {
    const typeLabel = type === 'MR' ? 'Material Request (MR)' : 'Field Request (FR)';
    const fileCount = selectedFiles.length;
    
    const confirmSummary = document.getElementById('confirm-summary');
    if (confirmSummary) {
        confirmSummary.innerHTML = `
            <p><strong>Tipe:</strong> <span>${typeLabel}</span></p>
            <p><strong>Field/Rig:</strong> <span>${fieldRigName || '-'}</span></p>
            <p><strong>Location:</strong> <span>${locationCode || '-'}</span></p>
            <p><strong>Freight:</strong> <span>${freightBy || '-'}</span></p>
            <p><strong>Items:</strong> <span>${itemRows.length} baris</span></p>
            <p><strong>Catatan:</strong> <span>${generalNotes ? generalNotes.substring(0, 50) + (generalNotes.length > 50 ? '...' : '') : '-'}</span></p>
            <p><strong>File:</strong> <span>${fileCount} file${fileCount !== 1 ? 's' : ''} (${formatFileSize(getTotalSize())})</span></p>
        `;
    }
    
    const titleEl = document.querySelector('#confirmSubmitModal .modal-header h3');
    if (titleEl) {
        titleEl.innerHTML = isEditMode ? '◆ Konfirmasi Resubmit' : '◆ Konfirmasi Submit';
    }
    
    const modal = document.getElementById('confirmSubmitModal');
    if (modal) modal.style.display = 'flex';
}

async function confirmSubmit() {
    closeConfirmSubmit();
    
    if (isSubmitting) return;
    isSubmitting = true;
    
    const session = getSession();
    const typeInput = document.querySelector('input[name="request_type"]:checked');
    const fieldRigEl = document.getElementById('field_rig_name');
    const locationEl = document.getElementById('location_code');
    const freightEl = document.getElementById('freight_by');
    const notesEl = document.getElementById('general_notes');
    const btn = document.getElementById('btn-submit');
    
    if (!typeInput || !fieldRigEl || !locationEl || !freightEl) {
        showError('Form tidak lengkap');
        isSubmitting = false;
        return;
    }
    
    const type = typeInput.value;
    const fieldRigName = fieldRigEl.value;
    const locationCode = locationEl.value;
    const freightBy = freightEl.value;
    const generalNotes = notesEl ? notesEl.value.trim() : '';
    
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Mengirim...';
    }
    
    try {
        const formData = new FormData();
        formData.append('request_type', type);
        formData.append('user_id', session.id);
        formData.append('user_name', session.nama_lengkap);
        formData.append('department', session.departemen);
        formData.append('field_rig_name', fieldRigName);
        formData.append('location_code', locationCode);
        formData.append('freight_by', freightBy);
        formData.append('general_notes', generalNotes);
        
        // Add items as JSON string - dengan quantity nullable
        const itemsData = itemRows.map(row => ({
            item_no: row.item_no,
            full_description: row.full_description,
            unit: row.unit,
            qty_requested: row.qty_requested === '' ? null : parseInt(row.qty_requested),
            qty_approved: null,  // Selalu null saat create
            qty_supplied: null,  // Selalu null saat create
            qty_outstanding: null  // Selalu null saat create
        }));
        formData.append('items', JSON.stringify(itemsData));
        
        selectedFiles.forEach((file) => {
            formData.append('attachment[]', file);
        });
        
        let url, successTitle, successMsg, successSubMsg, btnAgainText;
        
        if (isEditMode) {
            url = `${API_BASE_URL}/update-request`;
            formData.append('id', editRequestId);
            successTitle = '✅ Berhasil Resubmit';
            successMsg = 'Request berhasil diperbarui';
            successSubMsg = 'Request telah diajukan kembali dan menunggu approval';
            btnAgainText = 'Edit Lain';
        } else {
            url = `${API_BASE_URL}/create-request`;
            successTitle = '✅ Berhasil Dibuat';
            successMsg = 'Request berhasil dibuat';
            successSubMsg = 'Menunggu approval dari Approver SCM';
            btnAgainText = 'Buat Lagi';
        }
        
        const res = await fetch(url, {
            method: 'POST',
            body: formData
        });
        
        const result = await res.json();
        
        if (result.status === 'success') {
            showSuccessModal(result.data?.request_no, successTitle, successMsg, successSubMsg, btnAgainText);
        } else {
            showError(result.message || 'Gagal memproses request');
        }
    } catch (err) {
        console.error('Submit error:', err);
        showError('Error: ' + err.message);
    } finally {
        isSubmitting = false;
        if (btn) {
            btn.disabled = false;
            btn.textContent = isEditMode ? '🚀 Resubmit Request' : '🚀 Submit Request';
        }
    }
}

// ============================================
// SUMMARY UPDATE
// ============================================

function updateSummary() {
    const count = selectedFiles.length;
    const totalSize = getTotalSize();
    
    const summaryFiles = document.getElementById('summary-files');
    const summarySize = document.getElementById('summary-size');
    
    if (summaryFiles) summaryFiles.textContent = `${count} file${count !== 1 ? 's' : ''}`;
    if (summarySize) summarySize.textContent = formatFileSize(totalSize);
    
    const summaryFieldRig = document.getElementById('summary-field-rig');
    const summaryLocation = document.getElementById('summary-location');
    const summaryFreight = document.getElementById('summary-freight');
    
    const fieldRigValue = document.getElementById('field_rig_name')?.value;
    const locationValue = document.getElementById('location_code')?.value;
    const freightValue = document.getElementById('freight_by')?.value;
    
    if (summaryFieldRig) summaryFieldRig.textContent = fieldRigValue || '-';
    if (summaryLocation) summaryLocation.textContent = locationValue || '-';
    if (summaryFreight) summaryFreight.textContent = freightValue || '-';
    
    updateFileLimit();
}

// ============================================
// RESET FORM
// ============================================

function resetForm() {
    const form = document.getElementById('createRequestForm');
    if (form) form.reset();
    
    // Reset dropdowns
    const fieldRigSelect = document.getElementById('field_rig_name');
    const locationSelect = document.getElementById('location_code');
    const freightSelect = document.getElementById('freight_by');
    
    if (fieldRigSelect) fieldRigSelect.selectedIndex = 0;
    if (locationSelect) locationSelect.selectedIndex = 0;
    if (freightSelect) freightSelect.selectedIndex = 0;
    
    // Reset items
    itemRows = [];
    addItemRow();
    
    // Reset files
    selectedFiles = [];
    updateFileList();
    
    // Reset counters
    const notesCount = document.getElementById('notes-count');
    if (notesCount) notesCount.textContent = '0';
    
    updateSummary();
}

// ============================================
// EDIT MODE FUNCTIONS
// ============================================

function checkEditMode() {
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('edit');
    
    if (editId) {
        isEditMode = true;
        editRequestId = editId;
        loadRequestData(editId);
    } else {
        initForm();
    }
}

async function loadRequestData(id) {
    console.log('Loading request data for ID:', id);
    
    try {
        const url = `${API_BASE_URL}/get-request/${id}`;
        const response = await fetch(url);
        const result = await response.json();
        
        if (result.status === 'success') {
            editRequestData = result.data;
            
            if (editRequestData.status !== 'Returned') {
                showError('Hanya request dengan status Returned yang dapat diedit');
                setTimeout(() => {
                    window.location.href = 'list-request.html';
                }, 2000);
                return;
            }
            
            const session = getSession();
            if (editRequestData.user_id != session.id) {
                showError('Anda tidak memiliki akses untuk mengedit request ini');
                setTimeout(() => {
                    window.location.href = 'list-request.html';
                }, 2000);
                return;
            }
            
            initEditForm();
        } else {
            showError('Gagal memuat data request: ' + (result.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error loading request:', error);
        showError('Error memuat data request: ' + error.message);
    }
}

function showReturnInfoCard() {
    let returnInfoCard = document.getElementById('return-info-card');
    
    if (!returnInfoCard) {
        const sidebar = document.querySelector('.request-sidebar');
        const firstCard = sidebar?.querySelector('.info-card');
        
        if (!sidebar || !firstCard) return;
        
        returnInfoCard = document.createElement('div');
        returnInfoCard.id = 'return-info-card';
        returnInfoCard.className = 'info-card return-info';
        
        firstCard.parentNode.insertBefore(returnInfoCard, firstCard.nextSibling);
    }
    
    returnInfoCard.innerHTML = `
        <h4>⚠️ Informasi Return</h4>
        <div class="return-details">
            <div class="return-row">
                <span class="return-label">Status:</span>
                <span class="return-value status-returned">Returned</span>
            </div>
            <div class="return-row">
                <span class="return-label">Tanggal Return:</span>
                <span class="return-value">${formatDate(editRequestData.approval_date)}</span>
            </div>
            <div class="return-row">
                <span class="return-label">Approver:</span>
                <span class="return-value">${editRequestData.approver_name || '-'}</span>
            </div>
            <div class="return-remark">
                <span class="return-label">Remark:</span>
                <p class="remark-text">${editRequestData.approver_remark || 'Tidak ada remark'}</p>
            </div>
        </div>
    `;
    
    returnInfoCard.style.display = 'block';
}

function lockRequestType() {
    const typeInputs = document.querySelectorAll('input[name="request_type"]');
    
    typeInputs.forEach(input => {
        input.disabled = true;
        if (input.value === editRequestData.request_type) {
            input.checked = true;
        }
    });
    
    const typeSelector = document.querySelector('.type-selector-inline');
    if (typeSelector) typeSelector.classList.add('type-locked');
}

function setupTypeSelector() {
    const typeInputs = document.querySelectorAll('input[name="request_type"]');
    
    typeInputs.forEach(input => {
        input.addEventListener('change', () => {
            if (!isEditMode) {
                const type = input.value;
                const summaryType = document.getElementById('summary-type');
                if (summaryType) {
                    summaryType.textContent = type === 'MR' ? 'Material Request' : 'Field Request';
                }
            }
        });
    });
}

// ============================================
// FILE UPLOAD FUNCTIONS
// ============================================

function setupFileUpload() {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('attachment');
    const clearAllBtn = document.getElementById('clear-all-files');
    
    if (dropZone) {
        dropZone.addEventListener('click', () => fileInput?.click());
        
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });
        
        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('drag-over');
        });
        
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            if (e.dataTransfer.files.length > 0) {
                handleFiles(Array.from(e.dataTransfer.files));
            }
        });
    }
    
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleFiles(Array.from(e.target.files));
            }
        });
    }
    
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', () => {
            selectedFiles = [];
            updateFileList();
            updateSummary();
        });
    }
}

function handleFiles(newFiles) {
    const validFiles = [];
    let totalSize = getTotalSize();
    
    for (const file of newFiles) {
        if (selectedFiles.length + validFiles.length >= MAX_FILES) {
            alert(`Maksimal ${MAX_FILES} file`);
            break;
        }
        
        if (!ALLOWED_TYPES.includes(file.type)) {
            continue;
        }
        
        if (selectedFiles.some(f => f.name === file.name && f.size === file.size)) {
            continue;
        }
        
        if (totalSize + file.size > MAX_TOTAL_SIZE) {
            alert('Total ukuran file melebihi 5MB');
            break;
        }
        
        validFiles.push(file);
        totalSize += file.size;
    }
    
    selectedFiles = [...selectedFiles, ...validFiles];
    updateFileList();
    updateSummary();
}

function getTotalSize() {
    return selectedFiles.reduce((total, file) => total + file.size, 0);
}

function updateFileList() {
    const container = document.getElementById('file-list-container');
    const list = document.getElementById('file-list');
    const placeholder = document.getElementById('upload-placeholder');
    
    if (!container || !list || !placeholder) return;
    
    if (selectedFiles.length === 0) {
        container.style.display = 'none';
        placeholder.style.display = 'block';
        return;
    }
    
    placeholder.style.display = 'none';
    container.style.display = 'block';
    
    list.innerHTML = selectedFiles.map((file, index) => `
        <div class="file-item">
            <div class="file-item-info">
                <span class="file-item-icon">${getFileIcon(file.type)}</span>
                <div class="file-item-details">
                    <span class="file-item-name" title="${file.name}">${file.name}</span>
                    <span class="file-item-size">${formatFileSize(file.size)}</span>
                </div>
            </div>
            <button type="button" class="btn-remove-file-item" onclick="removeFile(${index})" title="Hapus">✕</button>
        </div>
    `).join('');
    
    updateFileLimit();
}

function getFileIcon(type) {
    if (type === 'application/pdf') return '📄';
    return '🖼️';
}

function removeFile(index) {
    selectedFiles.splice(index, 1);
    updateFileList();
    updateSummary();
}

function updateFileLimit() {
    const count = selectedFiles.length;
    const totalSize = getTotalSize();
    const limitEl = document.getElementById('file-limit');
    
    if (!limitEl) return;
    
    limitEl.textContent = `${count}/10 file • ${formatFileSize(totalSize)}/5.00 MB`;
    
    if (count >= MAX_FILES || totalSize >= MAX_TOTAL_SIZE * 0.9) {
        limitEl.style.color = '#dc2626';
    } else {
        limitEl.style.color = '#64748b';
    }
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 KB';
    const kb = bytes / 1024;
    if (kb < 1024) return kb.toFixed(1) + ' KB';
    return (kb / 1024).toFixed(2) + ' MB';
}

// ============================================
// MODAL FUNCTIONS
// ============================================

function showSuccessModal(requestNo, title, message, submessage, btnAgainText) {
    const modal = document.getElementById('successModal');
    const titleEl = document.getElementById('success-title');
    const messageEl = document.getElementById('success-message');
    const requestNoEl = document.getElementById('success-request-no');
    const submessageEl = document.getElementById('success-submessage');
    const btnAgain = document.getElementById('success-btn-again');
    
    if (!modal) {
        alert(message + '\nNomor: ' + requestNo);
        window.location.href = 'list-request.html';
        return;
    }
    
    if (titleEl) titleEl.textContent = title;
    if (messageEl) messageEl.textContent = message;
    if (requestNoEl) requestNoEl.textContent = requestNo || '-';
    if (submessageEl) submessageEl.textContent = submessage;
    if (btnAgain) btnAgain.textContent = btnAgainText;
    
    if (isEditMode && btnAgain) {
        btnAgain.style.display = 'none';
    } else if (btnAgain) {
        btnAgain.style.display = 'inline-block';
    }
    
    modal.style.display = 'flex';
}

function showError(msg) {
    const errorMessage = document.getElementById('error-message');
    const modal = document.getElementById('errorModal');
    
    if (errorMessage) errorMessage.textContent = msg;
    if (modal) modal.style.display = 'flex';
}

function closeConfirmSubmit() {
    const modal = document.getElementById('confirmSubmitModal');
    if (modal) modal.style.display = 'none';
}

function closeErrorModal() {
    const modal = document.getElementById('errorModal');
    if (modal) modal.style.display = 'none';
}

function closeSuccessModal() {
    const modal = document.getElementById('successModal');
    if (modal) modal.style.display = 'none';
}

function goToList() {
    window.location.href = 'list-request.html';
}

function createAnother() {
    closeSuccessModal();
    if (isEditMode) {
        window.location.href = 'list-request.html';
    } else {
        resetForm();
    }
}

function cancelCreate() {
    if (confirm('Yakin membatalkan? Semua data akan hilang.')) {
        window.location.href = 'list-request.html';
    }
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// ============================================
// GLOBAL EXPORTS
// ============================================
window.addItemRow = addItemRow;
window.removeItemRow = removeItemRow;
window.updateItemData = updateItemData;
window.removeFile = removeFile;
window.closeConfirmSubmit = closeConfirmSubmit;
window.confirmSubmit = confirmSubmit;
window.closeErrorModal = closeErrorModal;
window.closeSuccessModal = closeSuccessModal;
window.goToList = goToList;
window.createAnother = createAnother;
window.cancelCreate = cancelCreate;

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        if (typeof API_BASE_URL === 'undefined') {
            console.error('API_BASE_URL not defined');
            showError('Konfigurasi error: API_BASE_URL tidak ditemukan');
            return;
        }
        checkEditMode();
    }, 100);
});