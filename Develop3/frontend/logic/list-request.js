/**
 * LOGIC LIST REQUEST - V3 System
 * List dan manajemen MR/FR
 */

window.allRequests = [];
window.currentRequest = null;
window.currentSort = { field: null, direction: 'asc' };
window.currentPdfData = null;
window.paginationState = {
    currentPage: 1,
    perPage: 10,
    totalPages: 1,
    totalItems: 0,
    hasNext: false,
    hasPrev: false
};

// Attachment State Management
window.currentAttachments = [];
window.currentAttachmentIndex = 0;

// ============================================
// UTILITY FUNCTIONS (DEFINED AT TOP)
// ============================================

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped HTML
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Get current user session
function getSession() {
    return JSON.parse(sessionStorage.getItem('sas_user_session') || '{}');
}

// Load requests dengan pagination
async function loadRequests(page = 1) {
    const session = getSession();
    const filters = {
        user_id: session.id,
        user_role: session.id_role,
        page: page,
        per_page: window.paginationState.perPage
    };

    const search = document.getElementById('filter-search')?.value;
    const type = document.getElementById('filter-type')?.value;
    const status = document.getElementById('filter-status')?.value;

    if (search) filters.search = search;
    if (type) filters.type = type;
    if (status) filters.status = status;

    try {
        const params = new URLSearchParams(filters).toString();
        const url = `${API_BASE_URL}/get-requests?${params}`;
        
        console.log("Fetching page", page, ":", url);
        
        const response = await fetch(url);
        const result = await response.json();
        
        if (result.status === 'success') {
            window.allRequests = result.data || [];
            
            // Update pagination state
            if (result.pagination) {
                window.paginationState = {
                    currentPage: result.pagination.page,
                    perPage: result.pagination.per_page,
                    totalPages: result.pagination.total_pages,
                    totalItems: result.pagination.total,
                    hasNext: result.pagination.has_next,
                    hasPrev: result.pagination.has_prev
                };
            }
            
            renderTable(window.allRequests);
            renderPagination();
        } else {
            throw new Error(result.message || 'Unknown error');
        }
        
    } catch (error) {
        console.error("Error:", error);
        document.getElementById('request-table-body').innerHTML = 
            `<tr><td colspan="6" style="text-align:center; color:red;">
                Gagal memuat data: ${error.message}
            </td></tr>`;
        renderPagination();
    }
}

// RENDER PAGINATION CONTROLS
function renderPagination() {
    const container = document.getElementById('pagination-container');
    if (!container) return;
    
    const { currentPage, totalPages, totalItems, hasNext, hasPrev } = window.paginationState;
    
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let html = '<div class="pagination-wrapper">';
    
    // Info text
    const startItem = (currentPage - 1) * 10 + 1;
    const endItem = Math.min(currentPage * 10, totalItems);
    html += `<div class="pagination-info">
        Menampilkan ${startItem} - ${endItem} dari ${totalItems} data
    </div>`;
    
    // Pagination buttons
    html += '<div class="pagination-buttons">';
    
    // Previous button
    html += `<button class="pagination-btn ${!hasPrev ? 'disabled' : ''}" 
        onclick="goToPage(${currentPage - 1})" 
        ${!hasPrev ? 'disabled' : ''}>◀ Sebelumnya</button>`;
    
    // Page numbers (show max 5 pages)
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    
    if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
    }
    
    // First page + ellipsis
    if (startPage > 1) {
        html += `<button class="pagination-btn" onclick="goToPage(1)">1</button>`;
        if (startPage > 2) {
            html += `<span class="pagination-ellipsis">...</span>`;
        }
    }
    
    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
        const active = i === currentPage ? 'active' : '';
        html += `<button class="pagination-btn ${active}" onclick="goToPage(${i})">${i}</button>`;
    }
    
    // Last page + ellipsis
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            html += `<span class="pagination-ellipsis">...</span>`;
        }
        html += `<button class="pagination-btn" onclick="goToPage(${totalPages})">${totalPages}</button>`;
    }
    
    // Next button
    html += `<button class="pagination-btn ${!hasNext ? 'disabled' : ''}" 
        onclick="goToPage(${currentPage + 1})" 
        ${!hasNext ? 'disabled' : ''}>Selanjutnya ▶</button>`;
    
    html += '</div></div>';
    
    container.innerHTML = html;
}

// Navigate to specific page
window.goToPage = function(page) {
    if (page < 1 || page > window.paginationState.totalPages) return;
    if (page === window.paginationState.currentPage) return;
    
    window.paginationState.currentPage = page;
    loadRequests(page);
    
    // Scroll to top of table
    document.querySelector('.table-container')?.scrollIntoView({ behavior: 'smooth' });
};

// Render table
function renderTable(requests) {
    const tbody = document.getElementById('request-table-body');
    tbody.innerHTML = '';

    if (requests.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Tidak ada data</td></tr>';
        return;
    }

    const session = getSession();

    requests.forEach(req => {
        const statusClass = getStatusClass(req.status);
        const typeLabel = req.request_type === 'MR' ? 'Material' : 'Field';
        
        // Tentukan aksi berdasarkan role dan status
        let actionButtons = `<button class="btn-mini btn-view" onclick="viewDetail(${req.id})" title="Lihat Detail">👁️</button>`;
        
        // PDF button untuk status Approved (bisa diakses User yang membuat atau Approver)
        if (req.status === 'Approved') {
            const canViewPdf = (session.id_role === '02' && session.id == req.user_id) || session.id_role === '03';
            if (canViewPdf) {
                actionButtons += `<button class="btn-mini btn-pdf" onclick="handlePdf('${req.request_no}')" title="Generate PDF">📄</button>`;
            }
        }
        
        // Edit button untuk status Returned dan owner
        if (req.status === 'Returned' && session.id_role === '02' && session.id == req.user_id) {
            actionButtons += `<button class="btn-mini btn-edit" onclick="editRequest(${req.id})" title="Edit">✏️</button>`;
        }
        
        const row = `
            <tr id="row-${req.id}" class="request-row">
                <td><strong>${req.request_no}</strong></td>
                <td>${req.user_name}</td>
                <td><span class="type-badge type-${req.request_type}">${typeLabel}</span></td>
                <td>${formatDate(req.created_at)}</td>
                <td><span id="status-badge-${req.id}" class="status-badge ${statusClass} status-transition">${req.status}</span></td>
                <td>${actionButtons}</td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

// Get status badge class
function getStatusClass(status) {
    const classes = {
        'Waiting': 'status-waiting',
        'Approved': 'status-approved',
        'Returned': 'status-returned',
        'Rejected': 'status-rejected'
    };
    return classes[status] || '';
}

// Format date
function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// Sort data
window.sortData = function(field) {
    if (window.currentSort.field === field) {
        window.currentSort.direction = window.currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        window.currentSort.field = field;
        window.currentSort.direction = 'asc';
    }

    window.allRequests.sort((a, b) => {
        let valA = a[field] || '';
        let valB = b[field] || '';
        
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return window.currentSort.direction === 'asc' ? -1 : 1;
        if (valA > valB) return window.currentSort.direction === 'asc' ? 1 : -1;
        return 0;
    });

    updateSortIcons(field, window.currentSort.direction);
    renderTable(window.allRequests);
};

// Update sort icons
function updateSortIcons(field, direction) {
    document.querySelectorAll('.modern-table th').forEach(th => {
        th.innerHTML = th.innerHTML.replace(/ ↕| ↑| ↓/g, '') + ' ↕';
        th.style.color = '#0f5c93';
    });

    const headers = document.querySelectorAll('.modern-table th');
    const fieldMap = {
        'request_no': 0, 'user_name': 1, 'request_type': 2, 'created_at': 3
    };

    const index = fieldMap[field];
    if (index !== undefined && headers[index]) {
        const arrow = direction === 'asc' ? ' ↑' : ' ↓';
        headers[index].innerHTML = headers[index].innerHTML.replace(' ↕', arrow);
        headers[index].style.color = '#c6a048';
    }
}

// View detail
window.viewDetail = async function(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/get-request/${id}`);
        const result = await response.json();
        
        if (result.status === 'success') {
            window.currentRequest = result.data;
            showDetailModal(result.data);
        }
    } catch (error) {
        console.error("Error:", error);
        showAlert("Gagal memuat detail");
    }
};

// Parse attachments dari berbagai format
function parseAttachments(attachmentData) {
    if (!attachmentData) return [];
    
    if (Array.isArray(attachmentData)) {
        return attachmentData.map(att => {
            if (typeof att === 'object' && att !== null && att.file_url) {
                return att.file_url;
            }
            return att;
        }).filter(url => url && typeof url === 'string');
    }
    
    if (typeof attachmentData === 'string') {
        return attachmentData.split(',').map(url => url.trim()).filter(url => url);
    }
    
    return [];
}

// Generate icon class berdasarkan extension
function getFileIconClass(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const iconMap = {
        'jpg': 'image', 'jpeg': 'image', 'png': 'image', 'gif': 'image', 'webp': 'image',
        'pdf': 'pdf',
        'doc': 'doc', 'docx': 'doc', 'xls': 'doc', 'xlsx': 'doc', 'ppt': 'doc', 'pptx': 'doc',
        'txt': 'doc', 'zip': 'doc', 'rar': 'doc'
    };
    return iconMap[ext] || 'file';
}

// Generate icon emoji berdasarkan extension
function getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const iconMap = {
        'jpg': '🖼️', 'jpeg': '🖼️', 'png': '🖼️', 'gif': '🖼️', 'webp': '🖼️',
        'pdf': '📄',
        'doc': '📝', 'docx': '📝', 'xls': '📊', 'xlsx': '📊', 
        'ppt': '📽️', 'pptx': '📽️', 'txt': '📃', 'zip': '📦', 'rar': '📦'
    };
    return iconMap[ext] || '📎';
}

// Show detail modal
function showDetailModal(req) {
    const session = getSession();
    const isUser = session.id_role === '02';
    const isOwner = session.id == req.user_id;
    
    const attachments = req.attachments || [];
    let attachmentHtml = '';
    
    if (attachments.length > 0) {
        const attachmentUrls = attachments.map(att => {
            return (typeof att === 'object' && att.file_url) ? att.file_url : att;
        }).filter(url => url);
        
        window.tempAttachmentUrls = attachmentUrls;
        
        const attachmentButtons = attachments.map((att, index) => {
            const fileUrl = (typeof att === 'object' && att.file_url) ? att.file_url : att;
            const fileName = fileUrl.split('/').pop();
            return `
                <button class="btn-attachment-mini" onclick="openPreviewFromDetail(${index})">
                    ${getFileIcon(fileName)} File ${index + 1}
                </button>
            `;
        }).join('');
        
        attachmentHtml = `
            <div class="detail-section full-width">
                <label>Attachment (${attachments.length} file):</label>
                <div class="attachment-buttons-grid">
                    ${attachmentButtons}
                </div>
                <button class="btn btn-sm btn-apply" onclick="openPreviewFromDetail(0)" style="margin-top: 10px;">
                    📎 Lihat Semua Attachment
                </button>
            </div>
        `;
    } else if (req.attachment_url) {
        attachmentHtml = `
            <div class="detail-section">
                <label>Attachment:</label>
                <button class="btn btn-sm btn-apply" onclick="previewAttachments('${req.attachment_url}', 0)">📎 Lihat Attachment</button>
            </div>
        `;
    }

    let historyHtml = '<div class="detail-section"><label>History:</label><div class="history-list">';
    if (req.history && req.history.length > 0) {
        req.history.forEach(h => {
            historyHtml += `
                <div class="history-item">
                    <span class="history-date">${formatDate(h.created_at)}</span>
                    <span class="history-action">${h.action_type}</span>
                    <span class="history-by">by ${h.action_by_name}</span>
                    ${h.remark ? `<div class="history-remark">${h.remark}</div>` : ''}
                </div>
            `;
        });
    } else {
        historyHtml += '<div style="padding: 10px; color: #999; font-style: italic;">Tidak ada history</div>';
    }
    historyHtml += '</div></div>';

    // ============================================
    // ITEMS TABLE SECTION
    // ============================================
    let itemsHtml = '';
    if (req.items && req.items.length > 0) {
        const itemsRows = req.items.map(item => `
            <tr>
                <td class="item-no-cell">${item.item_no}</td>
                <td class="item-desc-cell">${escapeHtml(item.full_description || '-')}</td>
                <td class="item-unit-cell">${escapeHtml(item.unit || '-')}</td>
                <td class="item-qty-cell">${item.qty_requested !== null ? item.qty_requested : '-'}</td>
                <td class="item-qty-cell">${item.qty_approved !== null ? item.qty_approved : '-'}</td>
                <td class="item-qty-cell">${item.qty_supplied !== null ? item.qty_supplied : '-'}</td>
                <td class="item-qty-cell">${item.qty_outstanding !== null ? item.qty_outstanding : '-'}</td>
            </tr>
        `).join('');
        
        itemsHtml = `
            <div class="detail-section full-width items-table-section">
                <label>📋 Daftar Item (${req.items.length} baris):</label>
                <div class="items-table-wrapper">
                    <table class="detail-items-table">
                        <thead>
                            <tr>
                                <th class="col-item-no">No</th>
                                <th class="col-item-desc">Full Description</th>
                                <th class="col-item-unit">Unit</th>
                                <th class="col-item-qty">Req</th>
                                <th class="col-item-qty">Appr</th>
                                <th class="col-item-qty">Supp</th>
                                <th class="col-item-qty">Out</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsRows}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    } else {
        itemsHtml = `
            <div class="detail-section full-width">
                <label>📋 Daftar Item:</label>
                <div class="no-items-message">Tidak ada item untuk request ini</div>
            </div>
        `;
    }
    
    // NEW: REQUEST INFO SECTION (Field/Rig, Location, Freight)
    // ============================================
    const requestInfoHtml = `
        <div class="detail-section">
            <label>Field / Rig Name:</label>
            <div class="detail-value">${req.field_rig_name || '-'}</div>
        </div>
        <div class="detail-section">
            <label>Location Code:</label>
            <div class="detail-value">${req.location_code || '-'}</div>
        </div>
        <div class="detail-section">
            <label>Freight By:</label>
            <div class="detail-value">${req.freight_by || '-'}</div>
        </div>
    `;

    const content = `
        <div class="detail-grid">
            <div class="detail-section">
                <label>Nomor Request:</label>
                <div class="detail-value">${req.request_no}</div>
            </div>
            <div class="detail-section">
                <label>Tipe:</label>
                <div class="detail-value">${req.request_type === 'MR' ? 'Material Request' : 'Field Request'}</div>
            </div>
            <div class="detail-section">
                <label>Requestor:</label>
                <div class="detail-value">${req.user_name} (${req.department})</div>
            </div>
            <div class="detail-section">
                <label>Tanggal:</label>
                <div class="detail-value">${formatDate(req.created_at)}</div>
            </div>
            
            <!-- NEW: Request Info Fields -->
            ${requestInfoHtml}
            
            <!-- NEW: Items Table Section -->
            ${itemsHtml}
            
            <div class="detail-section full-width">
                <label>📝 Catatan Umum:</label>
                <div class="detail-value description">${req.general_notes || '-'}</div>
            </div>
            ${req.approver_name ? `
            <div class="detail-section">
                <label>Approver:</label>
                <div class="detail-value">${req.approver_name}</div>
            </div>
            ` : ''}
            ${req.approver_remark ? `
            <div class="detail-section full-width">
                <label>Remark Approver:</label>
                <div class="detail-value remark">${req.approver_remark}</div>
            </div>
            ` : ''}
            ${attachmentHtml}
            ${historyHtml}
        </div>
    `;

    document.getElementById('detail-content').innerHTML = content;

    let footerHtml = '<button class="btn btn-reset" onclick="closeDetailModal()">Tutup</button>';

    if (isUser && isOwner) {
        if (req.status === 'Returned') {
            footerHtml += `<button class="btn btn-apply" onclick="editRequest(${req.id})">✏️ Edit & Resubmit</button>`;
        }
        if (req.status === 'Approved') {
            footerHtml += `<button class="btn btn-success" onclick="handlePdf('${req.request_no}'); closeDetailModal();">📄 Generate PDF</button>`;
        }
    } else if (session.id_role === '03' && req.status === 'Waiting') {
        footerHtml += `<button class="btn btn-success" onclick="openApprovalModal()">⚡ Approval Action</button>`;
    } else if (session.id_role === '03' && req.status === 'Approved') {
        footerHtml += `<button class="btn btn-success" onclick="handlePdf('${req.request_no}'); closeDetailModal();">📄 View PDF</button>`;
    }

    document.getElementById('detail-footer').innerHTML = footerHtml;
    document.getElementById('detailModal').style.display = 'flex';
}

// Helper untuk buka preview dari detail modal
window.openPreviewFromDetail = function(index) {
    if (window.tempAttachmentUrls && window.tempAttachmentUrls.length > 0) {
        previewAttachments(window.tempAttachmentUrls, index);
    }
};

// Close detail modal
window.closeDetailModal = function() {
    document.getElementById('detailModal').style.display = 'none';
    window.currentRequest = null;
    window.tempAttachmentUrls = null;
};

// Edit request
window.editRequest = function(id) {
    window.location.href = `create-request.html?edit=${id}`;
};

// Open approval modal
window.openApprovalModal = function() {
    window.approvalRequestData = window.currentRequest;
    closeDetailModal();
    document.getElementById('approvalModal').style.display = 'flex';
    
    document.getElementById('approval-action').value = 'Approve';
    document.getElementById('approval-remark').value = '';
    document.getElementById('approval-remark').style.borderColor = '';
};

// Close approval modal
window.closeApprovalModal = function() {
    document.getElementById('approvalModal').style.display = 'none';
    document.getElementById('approval-remark').value = '';
    document.getElementById('approval-remark').style.borderColor = '';
    window.approvalRequestData = null;
};

// Submit approval dengan loading state dan real-time badge update
window.submitApproval = async function() {
    const requestData = window.approvalRequestData || window.currentRequest;
    
    if (!requestData) {
        showAlert('Error: Tidak ada request yang dipilih');
        return;
    }
    
    const action = document.getElementById('approval-action').value;
    const remark = document.getElementById('approval-remark').value.trim();
    const session = getSession();

    if ((action === 'Return' || action === 'Reject') && !remark) {
        showAlert(`Catatan wajib diisi untuk aksi ${action}`);
        document.getElementById('approval-remark').style.borderColor = '#dc2626';
        document.getElementById('approval-remark').focus();
        return;
    }
    
    document.getElementById('approval-remark').style.borderColor = '';
    
    const submitBtn = document.querySelector('#approvalModal .btn-apply');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '⏳ Processing...';
    submitBtn.disabled = true;

    try {
        const response = await fetch(`${API_BASE_URL}/approve-request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: requestData.id,
                action: action,
                remark: remark,
                approver_id: session.id,
                approver_name: session.nama_lengkap
            })
        });

        const result = await response.json();
        
        if (result.status === 'success') {
            const newStatus = action === 'Approve' ? 'Approved' : 
                             action === 'Return' ? 'Returned' : 'Rejected';
            
            updateRequestStatusBadge(requestData.id, newStatus);
            
            const requestIndex = window.allRequests.findIndex(r => r.id === requestData.id);
            if (requestIndex !== -1) {
                window.allRequests[requestIndex].status = newStatus;
                window.allRequests[requestIndex].approver_name = session.nama_lengkap;
                window.allRequests[requestIndex].approver_remark = remark;
            }
            
            closeApprovalModal();
            
            showApprovalSuccessAlert(action, newStatus);
            
            setTimeout(() => {
                loadRequests();
            }, 1000);
            
        } else {
            showAlert('Gagal: ' + result.message);
        }
    } catch (error) {
        console.error("Error:", error);
        showAlert('Terjadi kesalahan saat memproses approval');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
};

// Update badge status secara real-time di tabel
function updateRequestStatusBadge(requestId, newStatus) {
    const badgeElement = document.getElementById(`status-badge-${requestId}`);
    if (!badgeElement) return;
    
    badgeElement.classList.remove('status-waiting', 'status-approved', 'status-returned', 'status-rejected');
    
    const newStatusClass = getStatusClass(newStatus);
    badgeElement.classList.add(newStatusClass);
    
    badgeElement.textContent = newStatus;
    
    badgeElement.classList.add('status-updated');
    setTimeout(() => {
        badgeElement.classList.remove('status-updated');
    }, 2000);
    
    const rowElement = document.getElementById(`row-${requestId}`);
    if (rowElement) {
        rowElement.classList.add('row-highlight');
        setTimeout(() => {
            rowElement.classList.remove('row-highlight');
        }, 2000);
    }
}

// Show approval success alert dengan detail status
function showApprovalSuccessAlert(action, newStatus) {
    const statusColors = {
        'Approved': '#059669',
        'Returned': '#d97706',
        'Rejected': '#dc2626'
    };
    
    const statusIcons = {
        'Approved': '✅',
        'Returned': '🔄',
        'Rejected': '❌'
    };
    
    const message = `Request berhasil ${action.toLowerCase()}\nStatus: ${statusIcons[newStatus]} ${newStatus}`;
    showAlert(message);
}

// MULTIPLE ATTACHMENT PREVIEW FUNCTIONS

// Open attachment modal dengan multiple files support
window.previewAttachments = function(attachmentData, startIndex = 0) {
    window.currentAttachments = parseAttachments(attachmentData);
    window.currentAttachmentIndex = Math.min(startIndex, window.currentAttachments.length - 1);
    
    if (window.currentAttachments.length === 0) {
        showAlert('Tidak ada attachment');
        return;
    }
    
    document.getElementById('attachment-count').textContent = 
        `${window.currentAttachments.length} file${window.currentAttachments.length > 1 ? 's' : ''}`;
    
    renderAttachmentList();
    
    showAttachmentAtIndex(window.currentAttachmentIndex);
    
    document.getElementById('attachmentModal').style.display = 'flex';
};

// Render sidebar list
function renderAttachmentList() {
    const listContainer = document.getElementById('attachment-list');
    listContainer.innerHTML = '';
    
    window.currentAttachments.forEach((url, index) => {
        const filename = url.split('/').pop();
        const iconClass = getFileIconClass(filename);
        const icon = getFileIcon(filename);
        
        const item = document.createElement('div');
        item.className = `attachment-item ${index === window.currentAttachmentIndex ? 'active' : ''}`;
        item.onclick = () => selectAttachment(index);
        item.innerHTML = `
            <div class="attachment-icon ${iconClass}">${icon}</div>
            <div class="attachment-info">
                <div class="attachment-name">${filename}</div>
                <div class="attachment-meta">File ${index + 1}</div>
            </div>
        `;
        
        listContainer.appendChild(item);
    });
}

// Select attachment dari sidebar
function selectAttachment(index) {
    window.currentAttachmentIndex = index;
    
    document.querySelectorAll('.attachment-item').forEach((item, i) => {
        item.classList.toggle('active', i === index);
    });
    
    showAttachmentAtIndex(index);
}

// Show attachment at specific index
function showAttachmentAtIndex(index) {
    const url = window.currentAttachments[index];
    const filename = url.split('/').pop();
    const ext = filename.split('.').pop().toLowerCase();
    const fullUrl = `http://localhost/sas-orderapps/Develop3/uploads/requests/${url}`;
    
    document.getElementById('attachment-preview-img').style.display = 'none';
    document.getElementById('attachment-preview-pdf').style.display = 'none';
    document.getElementById('attachment-no-preview').style.display = 'none';
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
        const img = document.getElementById('attachment-preview-img');
        img.src = fullUrl;
        img.style.display = 'block';
    } else if (ext === 'pdf') {
        const pdf = document.getElementById('attachment-preview-pdf');
        pdf.src = fullUrl;
        pdf.style.display = 'block';
    } else {
        document.getElementById('no-preview-filename').textContent = filename;
        document.getElementById('attachment-no-preview').style.display = 'block';
    }
    
    updateNavigationControls();
    
    const activeItem = document.querySelectorAll('.attachment-item')[index];
    if (activeItem) {
        activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

// Update navigation buttons state
function updateNavigationControls() {
    const total = window.currentAttachments.length;
    const current = window.currentAttachmentIndex + 1;
    
    document.getElementById('attachment-counter').textContent = `${current} / ${total}`;
    document.getElementById('btn-prev').disabled = window.currentAttachmentIndex === 0;
    document.getElementById('btn-next').disabled = window.currentAttachmentIndex >= total - 1;
}

/**
 * Handle PDF action - Generate dan Preview
 */
window.handlePdf = async function(requestNo) {
    try {
        showAlert('⏳ Sedang generate PDF...');
        
        // Generate PDF
        const pdfData = await PdfService.generate(requestNo);
        window.currentPdfData = pdfData;
        
        closeAlertModal();
        
        // Buka preview modal
        openPdfPreview(pdfData.url, requestNo);
        
    } catch (error) {
        closeAlertModal();
        showAlert('❌ Gagal generate PDF: ' + error.message);
    }
};

/**
 * Buka modal preview PDF
 */
function openPdfPreview(pdfUrl, requestNo) {
    const modal = document.getElementById('pdfModal');
    const iframe = document.getElementById('pdf-preview-frame');
    
    // Set iframe source
    iframe.src = `http://localhost/sas-orderapps/Develop3/${pdfUrl}`;
    
    // Update title
    modal.querySelector('h3').textContent = `Purchase Order - ${requestNo}`;
    
    modal.style.display = 'flex';
}

/**
 * Close PDF modal
 */
window.closePdfModal = function() {
    const modal = document.getElementById('pdfModal');
    const iframe = document.getElementById('pdf-preview-frame');
    
    iframe.src = '';
    modal.style.display = 'none';
    window.currentPdfData = null;
};

/**
 * Print PDF
 */
window.printPDF = function() {
    const iframe = document.getElementById('pdf-preview-frame');
    if (iframe && iframe.contentWindow) {
        iframe.contentWindow.print();
    }
};

/**
 * Download PDF
 */
window.downloadPDF = function() {
    if (window.currentPdfData) {
        PdfService.download(window.currentPdfData.filename);
    }
};

// Navigation functions
window.prevAttachment = function() {
    if (window.currentAttachmentIndex > 0) {
        selectAttachment(window.currentAttachmentIndex - 1);
    }
};

window.nextAttachment = function() {
    if (window.currentAttachmentIndex < window.currentAttachments.length - 1) {
        selectAttachment(window.currentAttachmentIndex + 1);
    }
};

// Close attachment modal
window.closeAttachmentModal = function() {
    document.getElementById('attachmentModal').style.display = 'none';
    document.getElementById('attachment-preview-img').src = '';
    document.getElementById('attachment-preview-pdf').src = '';
    window.currentAttachments = [];
    window.currentAttachmentIndex = 0;
};

// Download current attachment
window.downloadCurrentAttachment = function() {
    if (window.currentAttachments.length === 0) return;
    
    const url = window.currentAttachments[window.currentAttachmentIndex];
    const fullUrl = `http://localhost/sas-orderapps/Develop3/uploads/requests/${url}`;
    
    const a = document.createElement('a');
    a.href = fullUrl;
    a.download = url.split('/').pop();
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
};

// Download all attachments
window.downloadAllAttachments = function() {
    if (window.currentAttachments.length === 0) return;
    
    window.currentAttachments.forEach((url, index) => {
        setTimeout(() => {
            const fullUrl = `http://localhost/sas-orderapps/Develop3/uploads/requests/${url}`;
            const a = document.createElement('a');
            a.href = fullUrl;
            a.download = url.split('/').pop();
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }, index * 500);
    });
    
    showAlert(`Mendownload ${window.currentAttachments.length} file...`);
};

// Alert
window.showAlert = function(message) {
    document.getElementById('alertMessage').innerText = message;
    document.getElementById('alertModal').style.display = 'flex';
};

window.closeAlertModal = function() {
    document.getElementById('alertModal').style.display = 'none';
};

// Filter functions
window.resetFilter = function() {
    document.getElementById('filter-search').value = '';
    document.getElementById('filter-type').value = '';
    document.getElementById('filter-status').value = '';
    window.paginationState.currentPage = 1;
    loadRequests(1);
};

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    loadRequests(1);
    
    document.getElementById('btn-cari')?.addEventListener('click', () => loadRequests(1));
    
    document.addEventListener('keydown', function(e) {
        if (document.getElementById('attachmentModal').style.display === 'flex') {
            if (e.key === 'ArrowLeft') prevAttachment();
            if (e.key === 'ArrowRight') nextAttachment();
            if (e.key === 'Escape') closeAttachmentModal();
        }
    });
});