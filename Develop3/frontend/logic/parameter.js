/**
 * PARAMETER LOGIC - Local Database Version
 * Mengatur akses menu per user dengan hierarchical toggle
 */

window.allUsersData = [];
window.currentPermissions = {};
window.currentUserId = null;
window.currentSort = { field: null, direction: 'asc' };
window.menuTreeData = [];

function checkAdminAccess() {
    const session = JSON.parse(sessionStorage.getItem('sas_user_session') || '{}');
    if (session.id_role !== '01') {
        window.location.href = 'dashboard.html';
        return false;
    }
    return true;
}

async function loadUsers() {
    try {
        showLoadingTable();
        
        // Check if APP_CONFIG is available
        if (typeof APP_CONFIG === 'undefined') {
            throw new Error('APP_CONFIG not loaded. Pastikan db.js dan config.js sudah di-load dengan benar.');
        }
        
        // Get users from config.js (which uses db.js)
        const users = await APP_CONFIG.getUsers();
        
        // Filter out admin (role 01)
        window.allUsersData = users.filter(u => u.id_role !== '01');
        
        renderTable(window.allUsersData);
    } catch (error) {
        console.error("Gagal memuat data user:", error);
        showAlert("Gagal memuat data user: " + error.message);
        document.getElementById('user-table-body').innerHTML = 
            '<tr><td colspan="5" style="text-align:center; color:red;">Gagal memuat data: ' + error.message + '</td></tr>';
    }
}

function showLoadingTable() {
    document.getElementById('user-table-body').innerHTML = `
        <tr>
            <td colspan="5" style="text-align: center; padding: 40px;">
                <div style="display: inline-block; width: 40px; height: 40px; border: 3px solid #f3f3f3; border-top: 3px solid #0f5c93; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <p style="margin-top: 15px; color: #64748b;">Memuat data user...</p>
            </td>
        </tr>
    `;
}

function renderTable(users) {
    const tableBody = document.getElementById('user-table-body');
    tableBody.innerHTML = '';

    if (users.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 40px; color: #999;">Tidak ada data user (selain Admin)</td></tr>';
        return;
    }

    users.forEach(user => {
        const row = `
            <tr data-user-id="${user.id}">
                <td>${user.id}</td>
                <td>${escapeHtml(user.nama_lengkap)}</td>
                <td>${escapeHtml(user.username)}</td>
                <td><span class="role-badge role-${user.id_role}">${user.nama_role}</span></td>
                <td>
                    <div class="action-btns">
                        <button class="btn-mini btn-config" onclick="openPermissionModal('${user.id}')" title="Konfigurasi Akses Menu">
                            ⚙️ Konfigurasi
                        </button>
                    </div>
                </td>
            </tr>
        `;
        tableBody.innerHTML += row;
    });
}

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
    const fieldMap = { 'id': 0, 'nama_lengkap': 1, 'username': 2, 'role': 3 };
    const index = fieldMap[activeField];
    
    if (index !== undefined && headers[index]) {
        const arrow = direction === 'asc' ? ' ↑' : ' ↓';
        headers[index].innerHTML = headers[index].innerHTML.replace(' ↕', arrow);
        headers[index].style.color = '#c6a048';
    }
}

window.openPermissionModal = async function(userId) {
    const user = window.allUsersData.find(u => u.id == userId);
    if (!user) return;

    window.currentUserId = userId;
    
    document.getElementById('perm-user-name').textContent = user.nama_lengkap;
    document.getElementById('perm-user-info').textContent = `${user.username} • ${user.nama_role}`;
    
    try {
        // Show loading in modal
        document.getElementById('permission-tree').innerHTML = '<div style="text-align: center; padding: 40px;"><div class="loading-spinner"></div><p>Memuat permission...</p></div>';
        document.getElementById('permissionModal').style.display = 'flex';
        
        // Check if APP_CONFIG is available
        if (typeof APP_CONFIG === 'undefined') {
            throw new Error('APP_CONFIG not loaded');
        }
        
        // Get permissions from config.js (uses db.js)
        const perms = await APP_CONFIG.getUserPermissions(userId);
        window.menuTreeData = JSON.parse(JSON.stringify(perms.tree)); // Deep copy
        
        // Mark active menus
        const activeMenus = perms.active_menus;
        markActiveMenus(window.menuTreeData, activeMenus);
        
        renderPermissionTree(window.menuTreeData);
    } catch (error) {
        console.error("Gagal load permissions:", error);
        document.getElementById('permission-tree').innerHTML = '<div style="text-align: center; padding: 40px; color: red;">Gagal memuat permission: ' + error.message + '</div>';
    }
};

function markActiveMenus(menus, activeMenus) {
    menus.forEach(menu => {
        menu.is_active = activeMenus.includes('all') || activeMenus.includes(menu.menu_key) ? 1 : 0;
        if (menu.children && menu.children.length > 0) {
            markActiveMenus(menu.children, activeMenus);
        }
    });
}

window.closePermissionModal = function() {
    document.getElementById('permissionModal').style.display = 'none';
    window.currentUserId = null;
    window.currentPermissions = {};
    window.menuTreeData = [];
};

function renderPermissionTree(menus, container = null, level = 0) {
    if (!container) {
        container = document.getElementById('permission-tree');
        container.innerHTML = '';
    }

    menus.forEach(menu => {
        const item = document.createElement('div');
        item.className = `permission-item level-${level}`;
        item.style.marginLeft = `${level * 25}px`;
        item.dataset.menuId = menu.id;
        item.dataset.menuKey = menu.menu_key;
        
        const hasChildren = menu.children && menu.children.length > 0;
        const isActive = menu.is_active == 1;
        
        item.innerHTML = `
            <div class="permission-row ${isActive ? 'active' : ''}" onclick="toggleMenu(${menu.id})">
                <span class="permission-icon">${hasChildren ? (isActive ? '📂' : '📁') : '📄'}</span>
                <span class="permission-label">${menu.label}</span>
                <label class="toggle-switch" onclick="event.stopPropagation()">
                    <input type="checkbox" 
                           data-menu-id="${menu.id}" 
                           data-menu-key="${menu.menu_key}"
                           ${isActive ? 'checked' : ''}
                           onchange="handleToggle(${menu.id}, this.checked)">
                    <span class="toggle-slider"></span>
                </label>
            </div>
        `;
        
        container.appendChild(item);
        
        if (hasChildren) {
            const childrenContainer = document.createElement('div');
            childrenContainer.className = 'children-container';
            childrenContainer.dataset.parentId = menu.id;
            renderPermissionTree(menu.children, childrenContainer, level + 1);
            container.appendChild(childrenContainer);
        }
    });
}

window.toggleMenu = function(menuId) {
    // Optional: expand/collapse children on click
    const childrenContainer = document.querySelector(`.children-container[data-parent-id="${menuId}"]`);
    if (childrenContainer) {
        childrenContainer.style.display = childrenContainer.style.display === 'none' ? 'block' : 'none';
    }
};

window.handleToggle = function(menuId, isChecked) {
    updateMenuState(window.menuTreeData, menuId, isChecked ? 1 : 0);
    
    // If unchecking parent, uncheck all children
    if (!isChecked) {
        uncheckAllChildren(menuId);
    }
    
    // If checking child, ensure parent is checked
    if (isChecked) {
        checkParentIfNeeded(menuId);
    }
    
    // Re-render to reflect changes
    renderPermissionTree(window.menuTreeData);
};

function updateMenuState(menus, menuId, value) {
    for (let menu of menus) {
        if (menu.id == menuId) {
            menu.is_active = value;
            return true;
        }
        if (menu.children && updateMenuState(menu.children, menuId, value)) {
            return true;
        }
    }
    return false;
}

function uncheckAllChildren(parentId) {
    const findAndUncheck = (menus) => {
        for (let menu of menus) {
            if (menu.id == parentId && menu.children) {
                menu.children.forEach(child => {
                    child.is_active = 0;
                    uncheckAllChildren(child.id);
                });
                return true;
            }
            if (menu.children && findAndUncheck(menu.children)) {
                return true;
            }
        }
        return false;
    };
    
    findAndUncheck(window.menuTreeData);
}

function checkParentIfNeeded(childId) {
    // Find parent of this child
    const findParent = (menus, targetId, parent = null) => {
        for (let menu of menus) {
            if (menu.id == targetId) {
                return parent;
            }
            if (menu.children) {
                const found = findParent(menu.children, targetId, menu);
                if (found) return found;
            }
        }
        return null;
    };
    
    const parent = findParent(window.menuTreeData, childId);
    if (parent) {
        parent.is_active = 1;
        // Recursively check parent's parent
        checkParentIfNeeded(parent.id);
    }
}

window.savePermissions = async function() {
    if (!window.currentUserId) return;
    
    const btn = document.querySelector('#permissionModal .btn-apply');
    const originalText = btn.innerHTML;
    btn.innerHTML = '💾 Menyimpan...';
    btn.disabled = true;
    
    try {
        // Check if APP_CONFIG is available
        if (typeof APP_CONFIG === 'undefined') {
            throw new Error('APP_CONFIG not loaded');
        }
        
        // Collect all active menu keys
        const activeMenus = collectActiveMenus(window.menuTreeData);
        
        // Save via config.js (which uses db.js)
        const result = await APP_CONFIG.savePermissions(window.currentUserId, activeMenus);
        
        if (result.status === 'success') {
            showAlert('✅ Permission berhasil disimpan untuk user ' + window.currentUserId);
            
            // TAMBAHAN: Update permission di memory agar langsung efektif
            const updatedMenus = collectActiveMenus(window.menuTreeData);
            APP_CONFIG.MOCK_DATA.userPermissions[window.currentUserId] = { 
                active_menus: updatedMenus 
            };
            
            closePermissionModal();
        } else {
            showAlert('❌ Gagal menyimpan: ' + result.message);
        }
    } catch (error) {
        console.error("Error saving:", error);
        showAlert('❌ Terjadi kesalahan saat menyimpan: ' + error.message);
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
};

function collectActiveMenus(menus, result = []) {
    menus.forEach(menu => {
        if (menu.is_active == 1) {
            result.push(menu.menu_key);
        }
        if (menu.children) {
            collectActiveMenus(menu.children, result);
        }
    });
    return result;
}

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

// Init
document.addEventListener('DOMContentLoaded', function() {
    if (checkAdminAccess()) {
        loadUsers();
    }
});