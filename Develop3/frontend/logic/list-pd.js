/**
 * LIST PD LOGIC - Frontend Handler
 * Lokasi: /frontend/Logic/list-pd.js
 */

(function() {
    'use strict';

    // State management
    let pdData = [];
    let currentPage = 1;
    let itemsPerPage = 10;
    let currentSort = { field: 'created_at', direction: 'desc' };
    let currentFilters = {
        search: '',
        status: '',
        reference: ''
    };
    let currentDetailId = null;
    let currentAttachments = [];
    let currentAttachmentIndex = 0;

    // DOM Elements
    const tableBody = document.getElementById('pd-table-body');
    const paginationContainer = document.getElementById('pagination-container');
    const filterSearch = document.getElementById('filter-search');
    const filterStatus = document.getElementById('filter-status');
    const filterReference = document.getElementById('filter-reference');
    const btnCari = document.getElementById('btn-cari');

    // ==========================================
    // INITIALIZATION
    // ==========================================

    document.addEventListener('DOMContentLoaded', function() {
        initializeEventListeners();
        loadPdData();
    });

    function initializeEventListeners() {
        if (btnCari) {
            btnCari.addEventListener('click', applyFilters);
        }

        if (filterSearch) {
            filterSearch.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    applyFilters();
                }
            });
        }

        if (filterStatus) {
            filterStatus.addEventListener('change', applyFilters);
        }
        if (filterReference) {
            filterReference.addEventListener('change', applyFilters);
        }
    }

    // ==========================================
    // DATA LOADING
    // ==========================================

    async function loadPdData() {
        showLoading();

        try {
            const params = new URLSearchParams({
                page: currentPage,
                limit: itemsPerPage,
                sort: currentSort.field,
                direction: currentSort.direction,
                ...currentFilters
            });

            const response = await fetch(`${API_BASE_URL}?${params}`);
            const result = await response.json();

            if (result.status === 'success') {
                pdData = result.data.items || [];
                const totalItems = result.data.total || 0;
                renderTable();
                renderPagination(totalItems);
            } else {
                showAlert('Gagal memuat data: ' + result.message);
            }
        } catch (error) {
            console.error('Error loading PD data:', error);
            showAlert('Terjadi kesalahan saat memuat data');
        }
    }

    function showLoading() {
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 40px;">
                        <div class="loading-spinner"></div>
                        <p>Memuat data...</p>
                    </td>
                </tr>
            `;
        }
    }

    // ==========================================
    // TABLE RENDERING
    // ==========================================

    function renderTable() {
        if (!tableBody) return;

        if (pdData.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 40px; color: #999;">
                        Tidak ada data pengajuan dana
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = pdData.map(pd => `
            <tr>
                <td>
                    <span class="pd-no">${escapeHtml(pd.pd_no)}</span>
                    ${pd.reference_request_no ? `<span class="ref-badge" title="Referensi: ${escapeHtml(pd.reference_request_no)}">📎</span>` : ''}
                </td>
                <td>${escapeHtml(pd.user_name)}</td>
                <td class="nominal-cell">${formatCurrency(pd.nominal)}</td>
                <td>${formatDate(pd.created_at)}</td>
                <td>${renderStatusBadge(pd.status)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-mini btn-view" onclick="viewDetail(${pd.id})" title="Detail">
                            👁️
                        </button>
                        ${pd.attachment_count > 0 ? `
                            <button class="btn-mini btn-attachment" onclick="viewAttachments(${pd.id})" title="Lampiran (${pd.attachment_count})">
                                📎
                            </button>
                        ` : ''}
                        ${canApprove(pd) ? `
                            <button class="btn-mini btn-approve" onclick="openApproval(${pd.id})" title="Approval">
                                ✓
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `).join('');
    }

    function renderStatusBadge(status) {
        const statusClasses = {
            'Waiting': 'status-waiting',
            'Approved': 'status-approved',
            'Returned': 'status-returned',
            'Rejected': 'status-rejected'
        };
        
        const statusIcons = {
            'Waiting': '⏳',
            'Approved': '✅',
            'Returned': '🔄',
            'Rejected': '❌'
        };

        return `<span class="status-badge ${statusClasses[status] || ''}">${statusIcons[status] || ''} ${status}</span>`;
    }

    function canApprove(pd) {
        const session = JSON.parse(sessionStorage.getItem('sas_user_session') || '{}');
        return pd.status === 'Waiting' && (session.id_role === '03' || session.id_role === '01');
    }

    // ==========================================
    // PAGINATION
    // ==========================================

    function renderPagination(totalItems) {
        if (!paginationContainer) return;

        const totalPages = Math.ceil(totalItems / itemsPerPage);
        
        if (totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }

        let html = '<div class="pagination">';
        
        html += `<button class="page-btn ${currentPage === 1 ? 'disabled' : ''}" onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>← Prev</button>`;
        
        const maxVisible = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let endPage = Math.min(totalPages, startPage + maxVisible - 1);
        
        if (endPage - startPage < maxVisible - 1) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }

        if (startPage > 1) {
            html += `<button class="page-btn" onclick="changePage(1)">1</button>`;
            if (startPage > 2) html += `<span class="page-ellipsis">...</span>`;
        }

        for (let i = startPage; i <= endPage; i++) {
            html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) html += `<span class="page-ellipsis">...</span>`;
            html += `<button class="page-btn" onclick="changePage(${totalPages})">${totalPages}</button>`;
        }

        html += `<button class="page-btn ${currentPage === totalPages ? 'disabled' : ''}" onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>Next →</button>`;
        
        html += '</div>';
        html += `<div class="pagination-info">Halaman ${currentPage} dari ${totalPages} (${totalItems} total)</div>`;

        paginationContainer.innerHTML = html;
    }

    window.changePage = function(page) {
        currentPage = page;
        loadPdData();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // ==========================================
    // FILTERING & SORTING
    // ==========================================

    function applyFilters() {
        currentFilters = {
            search: filterSearch ? filterSearch.value.trim() : '',
            status: filterStatus ? filterStatus.value : '',
            reference: filterReference ? filterReference.value : ''
        };
        currentPage = 1;
        loadPdData();
    }

    window.resetFilter = function() {
        if (filterSearch) filterSearch.value = '';
        if (filterStatus) filterStatus.value = '';
        if (filterReference) filterReference.value = '';
        applyFilters();
    };

    window.sortData = function(field) {
        if (currentSort.field === field) {
            currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            currentSort.field = field;
            currentSort.direction = 'asc';
        }
        loadPdData();
    };

    // ==========================================
    // DETAIL MODAL
    // ==========================================

    window.viewDetail = async function(id) {
        currentDetailId = id;
        
        try {
            const response = await fetch(`${API_BASE_URL}/${id}`);
            const result = await response.json();

            if (result.status === 'success') {
                renderDetailModal(result.data);
                document.getElementById('detailModal').style.display = 'flex';
            } else {
                showAlert('Gagal memuat detail: ' + result.message);
            }
        } catch (error) {
            console.error('Error loading detail:', error);
            showAlert('Terjadi kesalahan saat memuat detail');
        }
    };

    function renderDetailModal(pd) {
        const content = document.getElementById('detail-content');
        const footer = document.getElementById('detail-footer');

        content.innerHTML = `
            <div class="detail-grid">
                <div class="detail-section">
                    <h4>Informasi PD</h4>
                    <div class="detail-row">
                        <span class="detail-label">Nomor PD:</span>
                        <span class="detail-value pd-no">${escapeHtml(pd.pd_no)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Tanggal:</span>
                        <span class="detail-value">${formatDate(pd.created_at)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Status:</span>
                        <span class="detail-value">${renderStatusBadge(pd.status)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Nominal:</span>
                        <span class="detail-value nominal-highlight">${formatCurrency(pd.nominal)}</span>
                    </div>
                </div>

                <div class="detail-section">
                    <h4>Informasi Pemohon</h4>
                    <div class="detail-row">
                        <span class="detail-label">Nama:</span>
                        <span class="detail-value">${escapeHtml(pd.user_name)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Departemen:</span>
                        <span class="detail-value">${escapeHtml(pd.department)}</span>
                    </div>
                </div>

                ${pd.reference_request_no ? `
                    <div class="detail-section">
                        <h4>Referensi Request</h4>
                        <div class="detail-row">
                            <span class="detail-label">No. Request:</span>
                            <span class="detail-value">${escapeHtml(pd.reference_request_no)}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Tipe:</span>
                            <span class="detail-value">${pd.reference_request_type || '-'}</span>
                        </div>
                    </div>
                ` : ''}

                <div class="detail-section full-width">
                    <h4>Deskripsi</h4>
                    <div class="detail-description">${escapeHtml(pd.description)}</div>
                </div>

                ${pd.approver_name ? `
                    <div class="detail-section">
                        <h4>Informasi Approval</h4>
                        <div class="detail-row">
                            <span class="detail-label">Approver:</span>
                            <span class="detail-value">${escapeHtml(pd.approver_name)}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Tanggal:</span>
                            <span class="detail-value">${pd.approval_date ? formatDate(pd.approval_date) : '-'}</span>
                        </div>
                        ${pd.approver_remark ? `
                            <div class="detail-row">
                                <span class="detail-label">Remark:</span>
                                <span class="detail-value">${escapeHtml(pd.approver_remark)}</span>
                            </div>
                        ` : ''}
                    </div>
                ` : ''}
            </div>
        `;

        footer.innerHTML = `
            <button class="btn btn-reset" onclick="closeDetailModal()">Tutup</button>
            ${pd.attachment_count > 0 ? `<button class="btn btn-success" onclick="viewAttachments(${pd.id}); closeDetailModal();">📎 Lihat Lampiran</button>` : ''}
            ${canApprove(pd) ? `<button class="btn btn-apply" onclick="openApproval(${pd.id}); closeDetailModal();">✓ Approval</button>` : ''}
        `;
    }

    window.closeDetailModal = function() {
        document.getElementById('detailModal').style.display = 'none';
        currentDetailId = null;
    };

    // ==========================================
    // APPROVAL MODAL
    // ==========================================

    window.openApproval = function(id) {
        currentDetailId = id;
        document.getElementById('approvalModal').style.display = 'flex';
    };

    window.closeApprovalModal = function() {
        document.getElementById('approvalModal').style.display = 'none';
        document.getElementById('approval-action').value = 'Approve';
        document.getElementById('approval-remark').value = '';
    };

    window.submitApproval = async function() {
        const action = document.getElementById('approval-action').value;
        const remark = document.getElementById('approval-remark').value;

        try {
            const response = await fetch(`${API_BASE_URL}/${currentDetailId}/approve`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: action,
                    remark: remark
                })
            });

            const result = await response.json();

            if (result.status === 'success') {
                closeApprovalModal();
                showAlert('Approval berhasil disimpan');
                loadPdData();
            } else {
                showAlert('Gagal: ' + result.message);
            }
        } catch (error) {
            console.error('Error submitting approval:', error);
            showAlert('Terjadi kesalahan saat submit approval');
        }
    };

    // ==========================================
    // ATTACHMENT MODAL
    // ==========================================

    window.viewAttachments = async function(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/${id}/attachments`);
            const result = await response.json();

            if (result.status === 'success' && result.data.length > 0) {
                currentAttachments = result.data;
                currentAttachmentIndex = 0;
                renderAttachmentModal();
                document.getElementById('attachmentModal').style.display = 'flex';
            } else {
                showAlert('Tidak ada lampiran ditemukan');
            }
        } catch (error) {
            console.error('Error loading attachments:', error);
            showAlert('Gagal memuat lampiran');
        }
    };

    function renderAttachmentModal() {
        const list = document.getElementById('attachment-list');
        const count = document.getElementById('attachment-count');
        const counter = document.getElementById('attachment-counter');

        count.textContent = currentAttachments.length + ' file';
        counter.textContent = `${currentAttachmentIndex + 1} / ${currentAttachments.length}`;

        list.innerHTML = currentAttachments.map((att, index) => `
            <div class="attachment-list-item ${index === currentAttachmentIndex ? 'active' : ''}" onclick="selectAttachment(${index})">
                <span class="att-icon">${getFileIcon(att.file_type)}</span>
                <div class="att-info">
                    <span class="att-name">${escapeHtml(att.file_name)}</span>
                    <span class="att-size">${formatFileSize(att.file_size)}</span>
                </div>
            </div>
        `).join('');

        previewCurrentAttachment();
        updateNavButtons();
    }

    function previewCurrentAttachment() {
        const att = currentAttachments[currentAttachmentIndex];
        const img = document.getElementById('attachment-preview-img');
        const pdf = document.getElementById('attachment-preview-pdf');
        const noPreview = document.getElementById('attachment-no-preview');
        const filename = document.getElementById('no-preview-filename');

        img.style.display = 'none';
        pdf.style.display = 'none';
        noPreview.style.display = 'none';

        if (att.file_type.startsWith('image/')) {
            img.src = att.file_url;
            img.style.display = 'block';
        } else if (att.file_type === 'application/pdf') {
            pdf.src = att.file_url;
            pdf.style.display = 'block';
        } else {
            filename.textContent = att.file_name;
            noPreview.style.display = 'flex';
        }
    }

    window.selectAttachment = function(index) {
        currentAttachmentIndex = index;
        renderAttachmentModal();
    };

    window.prevAttachment = function() {
        if (currentAttachmentIndex > 0) {
            currentAttachmentIndex--;
            renderAttachmentModal();
        }
    };

    window.nextAttachment = function() {
        if (currentAttachmentIndex < currentAttachments.length - 1) {
            currentAttachmentIndex++;
            renderAttachmentModal();
        }
    };

    function updateNavButtons() {
        const btnPrev = document.getElementById('btn-prev');
        const btnNext = document.getElementById('btn-next');

        if (btnPrev) btnPrev.disabled = currentAttachmentIndex === 0;
        if (btnNext) btnNext.disabled = currentAttachmentIndex === currentAttachments.length - 1;
    }

    window.downloadCurrentAttachment = function() {
        const att = currentAttachments[currentAttachmentIndex];
        if (att && att.file_url) {
            window.open(att.file_url, '_blank');
        }
    };

    window.downloadAllAttachments = function() {
        currentAttachments.forEach((att, index) => {
            setTimeout(() => {
                window.open(att.file_url, '_blank');
            }, index * 500);
        });
    };

    window.closeAttachmentModal = function() {
        document.getElementById('attachmentModal').style.display = 'none';
        currentAttachments = [];
        currentAttachmentIndex = 0;
    };

    // ==========================================
    // ALERT MODAL
    // ==========================================

    function showAlert(message) {
        document.getElementById('alertMessage').textContent = message;
        document.getElementById('alertModal').style.display = 'flex';
    }

    window.closeAlertModal = function() {
        document.getElementById('alertModal').style.display = 'none';
    };

    // ==========================================
    // UTILITIES
    // ==========================================

    function formatCurrency(amount) {
        return 'Rp ' + parseInt(amount).toLocaleString('id-ID');
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function getFileIcon(type) {
        if (type === 'application/pdf') return '📄';
        if (type.startsWith('image/')) return '🖼️';
        return '📎';
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

})();