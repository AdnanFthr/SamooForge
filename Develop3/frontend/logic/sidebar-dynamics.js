/**
 * SIDEBAR DYNAMICS - Render menu berdasarkan permission user
 * V3 System - Dynamic Sidebar dengan Permission Control
 * Lokasi: /frontend/Logic/sidebar-dynamics.js
 */

(function() {
    'use strict';
    
    // Hapus cache lama saat init
    window.userPermissions = [];
    window.menuTree = [];
    window.currentSidebarUserId = null; // Track user yang sedang dirender

    // LOAD USER INFO LANGSUNG - Panggil segera di awal
    loadUserInfoImmediate();

    // Fungsi load user info dari sessionStorage
    function loadUserInfoImmediate() {
        console.log('Loading user info immediate...');
        
        const session = JSON.parse(sessionStorage.getItem('sas_user_session') || '{}');
        console.log('Session data:', session);
        
        const nameEl = document.getElementById('sidebar-user-name');
        const deptEl = document.getElementById('sidebar-user-dept');
        
        console.log('Elements found:', nameEl, deptEl);
        
        if (session.nama_lengkap) {
            if (nameEl) {
                nameEl.textContent = session.nama_lengkap;
                console.log('Name updated to:', session.nama_lengkap);
            }
            if (deptEl) {
                deptEl.textContent = session.departemen || '-';
                console.log('Dept updated to:', session.departemen);
            }
        } else {
            console.log('No nama_lengkap in session, using fallback');
            // Fallback ke app.js loadUserInfo jika ada
            if (typeof window.loadUserInfo === 'function') {
                window.loadUserInfo();
            }
        }
    }

    // Load permission user yang login - DENGAN FORCE REFRESH
    async function loadUserPermissions(forceRefresh = false) {
        console.log('Loading user permissions... forceRefresh:', forceRefresh);
        
        const session = JSON.parse(sessionStorage.getItem('sas_user_session') || '{}');
        
        if (!session.id) {
            console.error('No session found');
            return;
        }

        // Skip jika user sama dan tidak force refresh
        if (!forceRefresh && window.currentSidebarUserId === session.id && window.userPermissions.length > 0) {
            console.log('Sidebar already rendered for user:', session.id);
            return;
        }

        console.log('Session:', session);
        window.currentSidebarUserId = session.id;

        // Admin selalu full access
        if (session.id_role === '01') {
            console.log('Admin detected - full access');
            window.userPermissions = ['all'];
            window.menuTree = APP_CONFIG ? APP_CONFIG.MOCK_DATA.menuTree : [];
            renderSidebar();
            return;
        }

        try {
            // PRIORITAS 1: Gunakan APP_CONFIG (Local Database) jika tersedia
            if (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.getUserPermissions) {
                console.log('Using APP_CONFIG.getUserPermissions...');
                const perms = await APP_CONFIG.getUserPermissions(session.id);
                console.log('Permissions from APP_CONFIG:', perms);
                
                window.userPermissions = perms.active_menus;
                window.menuTree = JSON.parse(JSON.stringify(perms.tree)); // Deep copy
                
                renderSidebar();
                checkPageAccess();
                return;
            }
            
            // PRIORITAS 2: Fallback ke API (untuk backward compatibility)
            const permissionUrl = 'http://localhost/sas-orderapps/Develop3/gateway.php/request/user/get-my-permissions/' + session.id;
            console.log('Fetching:', permissionUrl);
            
            const response = await fetch(permissionUrl);
            const result = await response.json();
            
            console.log('Permission result:', result);
            
            if (result.status === 'success') {
                window.userPermissions = result.data.active_menus;
                window.menuTree = result.data.tree;
                renderSidebar();
                checkPageAccess();
            } else {
                console.error('Failed to load permissions:', result.message);
                renderFallbackSidebar();
            }
        } catch (error) {
            console.error('Failed to load permissions:', error);
            renderFallbackSidebar();
        }
    }

    // Render sidebar dinamis
    function renderSidebar() {
        const navList = document.querySelector('.nav-list');
        if (!navList) {
            console.error('Nav list not found');
            return;
        }

        const isAdmin = window.userPermissions.includes('all');
        console.log('Rendering sidebar - Is admin:', isAdmin);
        console.log('Permissions:', window.userPermissions);
        console.log('Menu tree:', window.menuTree);
        
        // Build HTML sidebar
        let html = '';
        
        // Dashboard (selalu ada kecuali dinonaktifkan)
        if (isAdmin || window.userPermissions.includes('dashboard')) {
            html += createMenuItem('dashboard', 'Dashboard', 'dashboard.png', 'dashboard.html');
        }

        // Request (MR/FR) - cek parent dan children
        const hasRequest = isAdmin || window.userPermissions.includes('request');
        const hasCreate = isAdmin || window.userPermissions.includes('create-request');
        const hasList = isAdmin || window.userPermissions.includes('list-request');
        
        if (hasRequest && (hasCreate || hasList)) {
            html += createParentMenu('request', 'Request (MR/FR)', 'pengajuan(MR-FR).png', [
                hasCreate ? {key: 'create-request', label: 'Create Request', icon: 'create.png', url: 'create-request.html'} : null,
                hasList ? {key: 'list-request', label: 'List Request', icon: 'list.png', url: 'list-request.html'} : null
            ].filter(Boolean));
        }

        // Pengajuan Dana (PD)
        const hasPengajuanDana = isAdmin || window.userPermissions.includes('pengajuan-dana');
        const hasCreatePD = isAdmin || window.userPermissions.includes('create-pd');
        const hasListPD = isAdmin || window.userPermissions.includes('list-pd');
        
        if (hasPengajuanDana && (hasCreatePD || hasListPD)) {
            html += createParentMenu('pengajuan-dana', 'Pengajuan Dana', 'pd.png', [
                hasCreatePD ? {key: 'create-pd', label: 'Create PD', icon: 'req-money.png', url: 'create-pd.html'} : null,
                hasListPD ? {key: 'list-pd', label: 'List PD', icon: 'list-req-money.png', url: 'list-pd.html'} : null
            ].filter(Boolean));
        }

        // Pengaturan - cek parent dan children
        const hasSettings = isAdmin || window.userPermissions.includes('pengaturan');
        const hasUserMgmt = isAdmin || window.userPermissions.includes('user-management');
        const hasParameter = isAdmin || window.userPermissions.includes('parameter');
        const hasMonitoring = isAdmin || window.userPermissions.includes('monitoring');
        
        const settingChildren = [
            hasUserMgmt ? {key: 'user-management', label: 'User Management', icon: 'user-management.png', url: 'user-management.html'} : null,
            hasParameter ? {key: 'parameter', label: 'Parameter', icon: 'parameter.png', url: 'parameter.html'} : null,
            hasMonitoring ? {key: 'monitoring', label: 'Monitoring/Cache', icon: 'monitoring.png', url: 'monitoring.html'} : null
        ].filter(Boolean);

        if (hasSettings && settingChildren.length > 0) {
            html += createParentMenu('pengaturan', 'Pengaturan', 'settings.png', settingChildren);
        }

        // Logout
        html += `
            <a href="../../../index.html" class="nav-link" onclick="APP_CONFIG.logout(); return false;">
                <img src="../assets/images/logout.png" alt="Logout" class="nav-icon"> Keluar
            </a>
        `;

        navList.innerHTML = html;
        
        // Re-attach event listeners untuk submenu
        attachSubmenuListeners();
        
        // Highlight current page
        highlightCurrentPage();
        
        console.log('Sidebar rendered successfully');
    }

    // Fallback sidebar
    function renderFallbackSidebar() {
        const navList = document.querySelector('.nav-list');
        if (!navList) return;
        
        navList.innerHTML = `
            <a href="dashboard.html" class="nav-link">
                <img src="../assets/images/dashboard.png" alt="Dash" class="nav-icon"> Dashboard
            </a>
            <a href="../../auth/login.html" class="nav-link" onclick="APP_CONFIG.logout(); return false;">
                <img src="../assets/images/logout.png" alt="Logout" class="nav-icon"> Keluar
            </a>
        `;
    }

    // Create single menu item
    function createMenuItem(key, label, icon, url) {
        const currentPage = window.location.pathname.split('/').pop();
        const isActive = currentPage === url ? 'active' : '';
        
        return `
            <a href="${url}" class="nav-link ${isActive}" data-menu="${key}">
                <img src="../assets/images/${icon}" alt="${label}" class="nav-icon"> ${label}
            </a>
        `;
    }

    // Create parent menu dengan submenu
    function createParentMenu(key, label, icon, children) {
        const currentPage = window.location.pathname.split('/').pop();
        let hasActiveChild = false;
        
        children.forEach(child => {
            if (currentPage === child.url) hasActiveChild = true;
        });
        
        const openClass = hasActiveChild ? 'open' : '';
        const activeClass = hasActiveChild ? 'active' : '';
        
        let submenuHtml = '<ul class="submenu">';
        children.forEach(child => {
            const isActive = currentPage === child.url ? 'active' : '';
            submenuHtml += `
                <li>
                    <a href="${child.url}" class="nav-link ${isActive}" data-menu="${child.key}">
                        <img src="../assets/images/${child.icon}" alt="${child.label}" class="nav-icon"> ${child.label}
                    </a>
                </li>
            `;
        });
        submenuHtml += '</ul>';
        
        return `
            <div class="has-submenu ${openClass}">
                <a href="#" class="nav-link submenu-toggle ${activeClass}" data-menu="${key}">
                    <img src="../assets/images/${icon}" alt="${label}" class="nav-icon"> ${label}
                </a>
                ${submenuHtml}
            </div>
        `;
    }

    // Attach event listeners untuk submenu toggle
    function attachSubmenuListeners() {
        const toggles = document.querySelectorAll('.submenu-toggle');
        toggles.forEach(toggle => {
            toggle.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                const parent = this.parentElement;
                
                document.querySelectorAll('.has-submenu.open').forEach(openItem => {
                    if (openItem !== parent) openItem.classList.remove('open');
                });
                
                parent.classList.toggle('open');
            });
        });
    }

    // Highlight current page
    function highlightCurrentPage() {
        const currentPage = window.location.pathname.split('/').pop();
        document.querySelectorAll('.nav-link').forEach(link => {
            const href = link.getAttribute('href');
            if (href && href.includes(currentPage)) {
                link.classList.add('active');
            }
        });
    }

    // Route Guard
    function checkPageAccess() {
        const currentPage = window.location.pathname.split('/').pop();
        const isAdmin = window.userPermissions.includes('all');
        
        if (isAdmin) return;
        
        const pageToMenu = {
            'dashboard.html': 'dashboard',
            'create-request.html': 'create-request',
            'list-request.html': 'list-request',
            'create-pd.html': 'create-pd',
            'list-pd.html': 'list-pd',
            'user-management.html': 'user-management',
            'parameter.html': 'parameter',
            'monitoring.html': 'monitoring'
        };
        
        const requiredMenu = pageToMenu[currentPage];
        if (!requiredMenu) return;
        
        if (!window.userPermissions.includes(requiredMenu)) {
            console.warn('Access denied to:', currentPage);
            // Optional: redirect ke dashboard
            // window.location.href = 'dashboard.html';
        }
    }

    // PUBLIC API - Expose ke window
    window.loadUserPermissions = loadUserPermissions;
    window.loadUserInfoImmediate = loadUserInfoImmediate;
    
    // FUNGSI BARU: Force refresh sidebar (dipanggil saat switch user)
    window.refreshSidebar = function() {
        console.log('Force refreshing sidebar...');
        window.userPermissions = [];
        window.menuTree = [];
        window.currentSidebarUserId = null;
        loadUserPermissions(true); // Force refresh
    };

    // Auto init saat DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            loadUserInfoImmediate();
            // Delay sedikit untuk memastikan APP_CONFIG sudah siap
            setTimeout(() => loadUserPermissions(false), 100);
        });
    } else {
        loadUserInfoImmediate();
        setTimeout(() => loadUserPermissions(false), 100);
    }
    
})();