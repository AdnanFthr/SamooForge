/**
 * CREATE PD LOGIC - Frontend Handler
 * Lokasi: /frontend/Logic/create-pd.js
 */

(function() {
    'use strict';

    // State
    let selectedFiles = [];
    let selectedRequest = null;

    // DOM Elements
    const form = document.getElementById('createPdForm');
    const descriptionInput = document.getElementById('description');
    const nominalInput = document.getElementById('nominal');
    const charCount = document.getElementById('char-count');
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('attachment');
    const fileListContainer = document.getElementById('file-list-container');
    const fileList = document.getElementById('file-list');
    const uploadPlaceholder = document.getElementById('upload-placeholder');
    const clearAllBtn = document.getElementById('clear-all-files');
    const requestSearch = document.getElementById('request-search');
    const requestListContainer = document.getElementById('request-list-container');
    const requestList = document.getElementById('request-list');
    const selectedRequestContainer = document.getElementById('selected-request-container');

    // Init
    document.addEventListener('DOMContentLoaded', function() {
        initEventListeners();
        loadUserInfo();
        updateSummary();
    });

    // Event Listeners
    function initEventListeners() {
        if (form) form.addEventListener('submit', handleFormSubmit);

        if (descriptionInput) {
            descriptionInput.addEventListener('input', function() {
                const count = this.value.length;
                charCount.textContent = count;
                if (count > 2000) {
                    this.value = this.value.substring(0, 2000);
                    charCount.textContent = 2000;
                }
            });
        }

        if (nominalInput) {
            nominalInput.addEventListener('input', function() {
                let value = this.value.replace(/[^\d]/g, '');
                value = value.replace(/^0+/, '');
                this.value = value;
                updateSummary();
            });
        }

        if (dropZone && fileInput) {
            dropZone.addEventListener('click', (e) => {
                if (e.target !== fileInput) fileInput.click();
            });

            fileInput.addEventListener('change', () => handleFiles(fileInput.files));

            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropZone.classList.add('drag-over');
            });

            dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));

            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.classList.remove('drag-over');
                handleFiles(e.dataTransfer.files);
            });
        }

        if (clearAllBtn) clearAllBtn.addEventListener('click', clearAllFiles);

        if (requestSearch) {
            requestSearch.addEventListener('input', debounce(() => {
                if (requestSearch.value.length >= 3) searchApprovedRequests();
            }, 500));

            requestSearch.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    searchApprovedRequests();
                }
            });
        }
    }

    // User Info
    function loadUserInfo() {
        const session = JSON.parse(sessionStorage.getItem('sas_user_session') || '{}');
        const displayUserName = document.getElementById('display-user-name');
        const displayDepartment = document.getElementById('display-department');
        
        if (displayUserName && session.nama_lengkap) displayUserName.textContent = session.nama_lengkap;
        if (displayDepartment && session.departemen) displayDepartment.textContent = session.departemen;
    }

    // Format Number
    function formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }

    // File Handling
    function handleFiles(files) {
        const maxFiles = 10;
        const maxSize = 5 * 1024 * 1024;

        Array.from(files).forEach(file => {
            if (selectedFiles.length >= maxFiles) {
                showError('Maksimal ' + maxFiles + ' file yang diizinkan');
                return;
            }

            const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
            if (!allowedTypes.includes(file.type)) {
                showError('File ' + file.name + ' tidak didukung. Hanya PDF, JPG, PNG yang diizinkan.');
                return;
            }

            const currentTotalSize = selectedFiles.reduce((sum, f) => sum + f.size, 0);
            if (currentTotalSize + file.size > maxSize) {
                showError('Total ukuran file melebihi 5MB');
                return;
            }

            selectedFiles.push(file);
        });

        updateFileList();
        updateFileLimit();
        updateSummary();
    }

    function updateFileList() {
        if (selectedFiles.length === 0) {
            fileListContainer.style.display = 'none';
            uploadPlaceholder.style.display = 'flex';
            return;
        }

        fileListContainer.style.display = 'block';
        uploadPlaceholder.style.display = 'none';

        fileList.innerHTML = selectedFiles.map((file, index) => `
            <div class="file-item">
                <div class="file-info">
                    <span class="file-icon">${file.type === 'application/pdf' ? '📄' : '🖼️'}</span>
                    <div class="file-details">
                        <span class="file-name">${escapeHtml(file.name)}</span>
                        <span class="file-size">${formatFileSize(file.size)}</span>
                    </div>
                </div>
                <button type="button" class="btn-remove-file" onclick="removeFile(${index})" title="Hapus">✕</button>
            </div>
        `).join('');
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function updateFileLimit() {
        const limitEl = document.getElementById('file-limit');
        const totalSize = selectedFiles.reduce((sum, f) => sum + f.size, 0);
        limitEl.textContent = `${selectedFiles.length}/10 file • ${formatFileSize(totalSize)}/5MB`;
    }

    window.removeFile = function(index) {
        selectedFiles.splice(index, 1);
        updateFileList();
        updateFileLimit();
        updateSummary();
    };

    function clearAllFiles() {
        selectedFiles = [];
        updateFileList();
        updateFileLimit();
        updateSummary();
        if (fileInput) fileInput.value = '';
    }

    // Search Approved Requests
    window.searchApprovedRequests = async function() {
        const searchTerm = requestSearch.value.trim();
        
        try {
            requestList.innerHTML = '<div class="request-list-loading">Mencari...</div>';
            requestListContainer.style.display = 'block';

            const response = await fetch(`${API_REQUEST_URL}?status=Approved&search=${encodeURIComponent(searchTerm)}&limit=10`);
            const result = await response.json();

            if (result.status === 'success' && result.data?.length > 0) {
                renderRequestList(result.data);
            } else {
                requestList.innerHTML = '<div class="request-list-empty">Tidak ada request approved ditemukan</div>';
            }
        } catch (error) {
            requestList.innerHTML = '<div class="request-list-error">Gagal memuat data</div>';
        }
    };

    function renderRequestList(requests) {
        requestList.innerHTML = requests.map(req => `
            <div class="request-list-item" onclick="selectRequest(${req.id}, '${escapeHtml(req.request_no)}', '${escapeHtml(req.request_type)}', '${escapeHtml(req.description || '-')}')">
                <div class="request-item-header">
                    <span class="request-item-no">${escapeHtml(req.request_no)}</span>
                    <span class="request-item-type">${req.request_type}</span>
                </div>
                <div class="request-item-desc">${escapeHtml(req.description || 'Tidak ada deskripsi')}</div>
                <div class="request-item-meta">
                    <span>👤 ${escapeHtml(req.user_name)}</span>
                    <span>📅 ${formatDate(req.created_at)}</span>
                </div>
            </div>
        `).join('');
    }

    window.selectRequest = function(id, requestNo, requestType, description) {
        selectedRequest = { id, requestNo, requestType, description };
        
        document.getElementById('selected-request-no').textContent = requestNo;
        document.getElementById('selected-request-type').textContent = requestType;
        document.getElementById('selected-request-desc').textContent = description;
        document.getElementById('selected_request_id').value = id;
        
        selectedRequestContainer.style.display = 'block';
        requestListContainer.style.display = 'none';
        requestSearch.value = '';
        
        updateSummary();
    };

    window.removeSelectedRequest = function() {
        selectedRequest = null;
        document.getElementById('selected_request_id').value = '';
        selectedRequestContainer.style.display = 'none';
        updateSummary();
    };

    window.closeRequestList = function() {
        requestListContainer.style.display = 'none';
    };

    // Summary
    function updateSummary() {
        const nominalValue = nominalInput?.value.replace(/[^\d]/g, '') || '';
        const summaryNominal = document.getElementById('summary-nominal');
        const refRow = document.getElementById('summary-request-ref-row');
        const refValue = document.getElementById('summary-request-ref');
        const filesEl = document.getElementById('summary-files');
        const sizeEl = document.getElementById('summary-size');

        if (summaryNominal) {
            summaryNominal.textContent = nominalValue ? 'Rp ' + formatNumber(parseInt(nominalValue)) : 'Rp 0';
        }

        if (selectedRequest) {
            if (refRow) refRow.style.display = 'flex';
            if (refValue) refValue.textContent = selectedRequest.requestNo;
        } else {
            if (refRow) refRow.style.display = 'none';
        }

        if (filesEl) {
            filesEl.textContent = selectedFiles.length + ' file' + (selectedFiles.length !== 1 ? 's' : '');
        }

        if (sizeEl) {
            const totalSize = selectedFiles.reduce((sum, f) => sum + f.size, 0);
            sizeEl.textContent = formatFileSize(totalSize);
        }
    }

    // Form Submit
    function handleFormSubmit(e) {
        e.preventDefault();
        
        const description = descriptionInput.value.trim();
        const nominal = nominalInput.value.replace(/[^\d]/g, '');

        if (description.length < 10) {
            showError('Deskripsi minimal 10 karakter');
            return;
        }

        if (!nominal || parseInt(nominal) <= 0) {
            showError('Nominal harus lebih dari 0');
            return;
        }

        showConfirmModal();
    }

    function showConfirmModal() {
        const nominal = nominalInput.value.replace(/[^\d]/g, '');
        
        document.getElementById('confirm-nominal').textContent = 'Rp ' + formatNumber(parseInt(nominal));
        document.getElementById('confirm-desc-preview').textContent = descriptionInput.value.substring(0, 100) + (descriptionInput.value.length > 100 ? '...' : '');
        document.getElementById('confirm-files').textContent = selectedFiles.length + ' file' + (selectedFiles.length !== 1 ? 's' : '');
        
        const refRow = document.getElementById('confirm-request-ref-row');
        if (selectedRequest) {
            refRow.style.display = 'block';
            document.getElementById('confirm-request-ref').textContent = selectedRequest.requestNo;
        } else {
            refRow.style.display = 'none';
        }

        document.getElementById('confirmSubmitModal').style.display = 'flex';
    }

    window.closeConfirmSubmit = function() {
        document.getElementById('confirmSubmitModal').style.display = 'none';
    };

    window.confirmSubmit = async function() {
        closeConfirmSubmit();
        
        const btnSubmit = document.getElementById('btn-submit');
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = '⏳ Memproses...';

        try {
            const formData = new FormData();
            formData.append('description', descriptionInput.value.trim());
            formData.append('nominal', nominalInput.value.replace(/[^\d]/g, ''));
            
            if (selectedRequest) {
                formData.append('reference_request_id', selectedRequest.id);
            }

            selectedFiles.forEach(file => formData.append('attachments[]', file));

            const response = await fetch(API_BASE_URL, { method: 'POST', body: formData });
            const result = await response.json();

            if (result.status === 'success') {
                showSuccessModal(result.data.pd_no);
            } else {
                showError(result.message || 'Gagal membuat pengajuan dana');
            }
        } catch (error) {
            showError('Terjadi kesalahan saat submit. Silakan coba lagi.');
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = '🚀 Submit Pengajuan Dana';
        }
    };

    // Modals
    function showSuccessModal(pdNo) {
        document.getElementById('success-pd-no').textContent = pdNo;
        document.getElementById('successModal').style.display = 'flex';
    }

    window.closeSuccessModal = function() {
        document.getElementById('successModal').style.display = 'none';
    };

    window.goToList = function() {
        window.location.href = 'list-pd.html';
    };

    window.createAnother = function() {
        form.reset();
        selectedFiles = [];
        removeSelectedRequest();
        updateFileList();
        updateFileLimit();
        charCount.textContent = '0';
        updateSummary();
        closeSuccessModal();
    };

    function showError(message) {
        document.getElementById('error-message').textContent = message;
        document.getElementById('errorModal').style.display = 'flex';
    }

    window.closeErrorModal = function() {
        document.getElementById('errorModal').style.display = 'none';
    };

    window.cancelCreate = function() {
        if (confirm('Apakah Anda yakin ingin membatalkan? Data yang sudah diisi akan hilang.')) {
            window.location.href = 'list-pd.html';
        }
    };

    // Utilities
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    }

})();