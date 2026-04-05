/**
 * LOGIC USER ACTIONS - V3 System
 */

let confirmCallback = null;

// Modal Konfirmasi
function openConfirmModal(message, callback) {
    document.getElementById('confirmMessage').innerText = message;
    document.getElementById('confirmModal').style.display = 'flex';
    confirmCallback = callback;
}

function closeConfirmModal() {
    document.getElementById('confirmModal').style.display = 'none';
    confirmCallback = null;
}

document.getElementById('btnConfirmAction').addEventListener('click', function() {
    if (confirmCallback) {
        confirmCallback();
        closeConfirmModal();
    }
});

// DELETE USER dengan IndexedDB
window.deleteUser = async function(userId) {
    openConfirmModal(`Apakah Anda yakin ingin menghapus User ID: ${userId}?`, async function() {
        try {
            const result = await APP_CONFIG.deleteUser(userId);
            
            if (result.status === 'success') {
                showAlert("User berhasil dihapus");
                await loadUsers();
            } else {
                showAlert("Gagal menghapus: " + result.message);
            }
        } catch (error) {
            console.error("Gagal menghapus:", error);
            showAlert("Terjadi kesalahan saat menghapus user: " + error.message);
        }
    });
};

// PREPARE EDIT dengan STATUS SWITCH
window.prepareEdit = async function(userId) {
    try {
        // Get fresh user data from DB
        const users = await APP_CONFIG.getUsers();
        const user = users.find(u => u.id == userId);
        
        if (!user) {
            showAlert("Data user tidak ditemukan!");
            return;
        }

        const form = document.getElementById('addUserForm');
        const modalTitle = document.querySelector('#userModal .modal-header h3');
        const passwordInput = document.getElementById('password');
        const passwordLabelHint = document.getElementById('password-label-hint');
        const statusSwitch = document.getElementById('is_active');
        const statusLabel = document.getElementById('status-label-text');
        
        if (modalTitle) {
            modalTitle.innerText = "Edit Data User";
        }

        // Isi form dengan data user
        document.getElementById('nama_lengkap').value = user.nama_lengkap;
        document.getElementById('username').value = user.username;
        document.getElementById('id_role').value = user.id_role;
        document.getElementById('departemen').value = user.departemen || '';
        document.getElementById('email').value = user.email || '';
        document.getElementById('no_handphone').value = user.no_handphone || '';
        
        // Set status switch
        if (statusSwitch) {
            const isActive = user.is_active === 1;
            statusSwitch.checked = isActive;
            statusLabel.textContent = isActive ? 'Aktif' : 'Nonaktif';
            statusLabel.className = isActive ? 'status-label active' : 'status-label inactive';
        }
        
        // Password kosong untuk edit
        passwordInput.value = '';
        passwordInput.readOnly = false;
        passwordInput.type = "password";
        passwordInput.style.backgroundColor = "";
        passwordInput.style.cursor = "text";
        passwordInput.placeholder = "Kosongkan jika tidak ingin ubah password";
        passwordLabelHint.innerText = "(Opsional)";
        
        form.dataset.editId = user.id;

        const modal = document.getElementById('userModal');
        if (modal) {
            modal.style.display = 'flex';
        }
    } catch (error) {
        console.error('Error preparing edit:', error);
        showAlert('Gagal memuat data user untuk edit: ' + error.message);
    }
};

// VIEW DETAIL
window.viewUserDetail = function(user) {
    document.getElementById('v_id').value = user.id;
    document.getElementById('v_nama').value = user.nama_lengkap;
    document.getElementById('v_username').value = user.username;
    document.getElementById('v_role').value = user.nama_role;
    document.getElementById('v_dept').value = user.departemen || '-';
    document.getElementById('v_phone').value = user.no_handphone || '-';
    document.getElementById('v_email').value = user.email || '-';
    document.getElementById('v_password').value = '********';
    
    // Tambahkan status di view modal jika ada elementnya
    const statusEl = document.getElementById('v_status');
    if (statusEl) {
        statusEl.value = user.is_active === 1 ? 'Aktif' : 'Nonaktif';
    }

    document.getElementById('viewUserModal').style.display = 'flex';
};

window.closeViewModal = function() {
    document.getElementById('viewUserModal').style.display = 'none';
};

// Alert helpers
window.showAlert = function(message) {
    document.getElementById('alertMessage').innerText = message;
    document.getElementById('alertModal').style.display = 'flex';
};

window.closeAlertModal = function() {
    document.getElementById('alertModal').style.display = 'none';
};