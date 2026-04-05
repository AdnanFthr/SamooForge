/**
 * LOGIC USER MANAGEMENT - V3 System
 * CRUD dengan IndexedDB via APP_CONFIG
 */

window.allUsersData = [];
const DEFAULT_PASSWORD = "SAS.2026#orderapps!";

// Variabel untuk sort
window.currentSort = {
    field: null,
    direction: 'asc'
};

// Load users dari APP_CONFIG (IndexedDB)
async function loadUsers() {
    try {
        showLoading();
        
        if (typeof APP_CONFIG === 'undefined') {
            throw new Error('APP_CONFIG not loaded. Pastikan config.js sudah di-load.');
        }
        
        const users = await APP_CONFIG.getUsers();
        window.allUsersData = users;
        renderTable(users);
    } catch (error) {
        console.error("Gagal memuat data user:", error);
        document.getElementById('user-table-body').innerHTML = 
            `<tr><td colspan="6" style="text-align:center; color:red;">Gagal memuat data: ${error.message}</td></tr>`;
    }
}

function showLoading() {
    document.getElementById('user-table-body').innerHTML = `
        <tr>
            <td colspan="6" style="text-align: center; padding: 40px;">
                <div style="display: inline-block; width: 40px; height: 40px; border: 3px solid #f3f3f3; border-top: 3px solid #0f5c93; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <p style="margin-top: 15px; color: #64748b;">Memuat data...</p>
            </td>
        </tr>
    `;
}

function renderTable(users) {
    const tableBody = document.getElementById('user-table-body'); 
    tableBody.innerHTML = '';

    if (users.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 40px;">Tidak ada data ditemukan</td></tr>';
        return;
    }

    users.forEach(user => {
        const statusClass = user.is_active === 1 ? 'status-badge-approved' : 'status-badge-inactive';
        const statusText = user.is_active === 1 ? 'aktif' : 'nonaktif';
        
        const row = `
            <tr data-user-id="${user.id}">
                <td>${user.id}</td>
                <td>${escapeHtml(user.nama_lengkap)}</td>
                <td>${escapeHtml(user.username)}</td>
                <td><span class="role-badge role-${user.id_role}">${user.nama_role}</span></td>
                <td>
                    <span class="${statusClass}">${statusText}</span>
                </td>
                <td>
                    <div class="action-btns">
                        <button class="btn-mini btn-view" onclick='viewUserDetail(${JSON.stringify(user)})' title="Lihat Detail">👁️</button>
                        <button class="btn-mini btn-edit" onclick="prepareEdit('${user.id}')" title="Edit">✏️</button>
                        <button class="btn-mini btn-delete" onclick="deleteUser('${user.id}')" title="Hapus">🗑️</button>
                    </div>
                </td>
            </tr>
        `;
        tableBody.innerHTML += row;
    });
}

// FUNGSI SORT
window.sortData = function(field) {
    if (window.currentSort.field === field) {
        window.currentSort.direction = window.currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        window.currentSort.field = field;
        window.currentSort.direction = 'asc';
    }

    window.allUsersData.sort((a, b) => {
        let valA = a[field] || '';
        let valB = b[field] || '';
        
        if (field === 'role') {
            valA = a.nama_role || '';
            valB = b.nama_role || '';
        }
        
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return window.currentSort.direction === 'asc' ? -1 : 1;
        if (valA > valB) return window.currentSort.direction === 'asc' ? 1 : -1;
        return 0;
    });

    updateSortIcons(field, window.currentSort.direction);
    renderTable(window.allUsersData);
};

function updateSortIcons(activeField, direction) {
    document.querySelectorAll('.modern-table th').forEach(th => {
        th.innerHTML = th.innerHTML.replace(/ ↕| ↑| ↓/g, '') + ' ↕';
        th.style.color = '#0f5c93';
    });

    const headers = document.querySelectorAll('.modern-table th');
    const fieldMap = {
        'id': 0,
        'nama_lengkap': 1,
        'username': 2,
        'role': 3
    };

    const index = fieldMap[activeField];
    if (index !== undefined && headers[index]) {
        const arrow = direction === 'asc' ? ' ↑' : ' ↓';
        headers[index].innerHTML = headers[index].innerHTML.replace(' ↕', arrow);
        headers[index].style.color = '#c6a048';
    }
}

// UPDATE STATUS LABEL SAAT SWITCH BERUBAH
function setupStatusSwitch() {
    const switchInput = document.getElementById('is_active');
    const statusLabel = document.getElementById('status-label-text');
    
    if (switchInput && statusLabel) {
        switchInput.addEventListener('change', function() {
            statusLabel.textContent = this.checked ? 'Aktif' : 'Nonaktif';
            statusLabel.className = this.checked ? 'status-label active' : 'status-label inactive';
        });
    }
}

// Form submit handler - TAMBAH USER (Demo Mode)
document.getElementById('addUserForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const form = e.target;
    const editId = form.dataset.editId;
    
    // Jika mode tambah (bukan edit), block
    if (!editId) {
        showAlert('❌ Tidak bisa tambah user karena mode demo. Fitur ini hanya simulasi.');
        return;
    }
    
    // Mode Edit: Update data termasuk status
    const formData = {
        id: editId,
        nama_lengkap: document.getElementById('nama_lengkap').value,
        username: document.getElementById('username').value,
        id_role: document.getElementById('id_role').value,
        departemen: document.getElementById('departemen').value,
        email: document.getElementById('email').value,
        no_handphone: document.getElementById('no_handphone').value,
        is_active: document.getElementById('is_active').checked ? 1 : 0
    };
    
    // Password hanya dikirim jika diisi
    const passwordInput = document.getElementById('password');
    if (passwordInput.value.trim()) {
        formData.password = passwordInput.value;
    }

    try {
        const result = await APP_CONFIG.updateUser(formData);
        
        if (result.status === 'success') {
            showAlert(result.message);
            closeModal();
            loadUsers();
        } else {
            showAlert("Gagal menyimpan: " + result.message);
        }
    } catch (error) {
        console.error("Error saving data:", error);
        showAlert("Terjadi kesalahan saat menyimpan data");
    }
});

document.addEventListener('DOMContentLoaded', function() {
    loadUsers();
    setupStatusSwitch();
});

window.openModal = function() {
    const modal = document.getElementById('userModal');
    const form = document.getElementById('addUserForm');
    const modalTitle = document.querySelector('#userModal .modal-header h3');
    const passwordInput = document.getElementById('password');
    const passwordLabelHint = document.getElementById('password-label-hint');
    const statusSwitch = document.getElementById('is_active');
    const statusLabel = document.getElementById('status-label-text');
    
    if (modal) {
        modalTitle.innerText = "Tambah User Baru";
        
        form.reset();
        delete form.dataset.editId;
        
        // Reset switch ke aktif
        if (statusSwitch) {
            statusSwitch.checked = true;
            statusLabel.textContent = 'Aktif';
            statusLabel.className = 'status-label active';
        }
        
        passwordInput.value = DEFAULT_PASSWORD;
        passwordInput.readOnly = true;
        passwordInput.type = "text";
        passwordInput.style.backgroundColor = "#f0f0f0";
        passwordInput.style.cursor = "not-allowed";
        passwordLabelHint.innerText = "(Auto-generated)";
        passwordLabelHint.style.display = "inline";
        
        modal.style.display = 'flex';
    }
};

window.closeModal = function() {
    const modal = document.getElementById('userModal');
    if (modal) {
        modal.style.display = 'none';
    }
};

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Alert functions
window.showAlert = function(message) {
    document.getElementById('alertMessage').innerText = message;
    document.getElementById('alertModal').style.display = 'flex';
};

window.closeAlertModal = function() {
    document.getElementById('alertModal').style.display = 'none';
};