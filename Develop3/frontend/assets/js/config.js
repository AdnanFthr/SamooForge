/**
 * APP CONFIGURATION - Local Website Mode
 * V3 System - Mock Data dengan IndexedDB Persistence
 */

const APP_CONFIG = {
    // Mode selalu DEMO untuk local website
    DEMO_MODE: true,
    
    // Session Keys
    SESSION_KEY: 'sas_user_session',
    TOKEN_KEY: 'sas_token',
    SETTINGS_KEY: 'sas_settings',
    
    // Current user (auto-set saat init)
    currentUser: null,

    // ============================================================
    // MOCK DATA - Initial Dataset
    // ============================================================
    MOCK_DATA: {
        users: [
            {
                id: '0001',
                nama_lengkap: 'Administrator',
                username: 'admin',
                id_role: '01',
                nama_role: 'Admin',
                departemen: 'IT',
                email: 'admin@sas.co.id',
                no_handphone: '081234567890',
                password: 'admin123',
                is_active: 1,
                created_at: '2026-01-01T00:00:00Z'
            },
            {
                id: '0002',
                nama_lengkap: 'Cindy Aulia Nurhikmah',
                username: 'cindy',
                id_role: '02',
                nama_role: 'User',
                departemen: 'Finance',
                email: 'cindy@sas.co.id',
                no_handphone: '082345678901',
                password: 'user123',
                is_active: 1,
                created_at: '2026-01-01T00:00:00Z'
            },
            {
                id: '0003',
                nama_lengkap: 'Haryanto Daru',
                username: 'haryanto',
                id_role: '03',
                nama_role: 'Approver SCM',
                departemen: 'Field Coordination',
                email: 'haryanto@sas.co.id',
                no_handphone: '083456789012',
                password: 'approver123',
                is_active: 1,
                created_at: '2026-01-01T00:00:00Z'
            },
            {
                id: '0004',
                nama_lengkap: 'Budi Santoso',
                username: 'budi',
                id_role: '02',
                nama_role: 'User',
                departemen: 'Operations',
                email: 'budi@sas.co.id',
                no_handphone: '084567890123',
                password: 'user123',
                is_active: 1,
                created_at: '2026-01-01T00:00:00Z'
            },
            {
                id: '0005',
                nama_lengkap: 'Dewi Kusuma',
                username: 'dewi',
                id_role: '02',
                nama_role: 'User',
                departemen: 'HR',
                email: 'dewi@sas.co.id',
                no_handphone: '085678901234',
                password: 'user123',
                is_active: 0,
                created_at: '2026-01-01T00:00:00Z'
            }
        ],
        
        requests: [
            {
                id: 1,
                request_no: '0001/SAS/MR/03/01/2026',
                request_type: 'MR',
                user_id: '0002',
                user_name: 'Cindy Aulia Nurhikmah',
                department: 'Finance',
                field_rig_name: 'Bojonegoro',
                location_code: 'Pertamina Zona 10',
                freight_by: 'Land',
                general_notes: 'Pengadaan laptop untuk kebutuhan kantor cabang baru.',
                status: 'Waiting',
                created_at: '2026-01-03T09:15:00Z',
                updated_at: '2026-01-03T09:15:00Z',
                approver_id: null,
                approver_name: null,
                approval_date: null,
                approver_remark: null,
                items: [
                    { id: 1, item_no: 1, full_description: 'Laptop Dell Latitude 5420', unit: 'PCS', qty_requested: 5, qty_approved: null, qty_supplied: null, qty_outstanding: null },
                    { id: 2, item_no: 2, full_description: 'Mouse Logitech M280 Wireless', unit: 'PCS', qty_requested: 5, qty_approved: null, qty_supplied: null, qty_outstanding: null }
                ],
                attachments: [],
                attachment_count: 0,
                history: [{ id: 1, action_type: 'Create', action_by: '0002', action_by_name: 'Cindy Aulia Nurhikmah', old_status: null, new_status: 'Waiting', remark: 'Request created', created_at: '2026-01-03T09:15:00Z' }]
            },
            {
                id: 2,
                request_no: '0002/SAS/FR/05/01/2026',
                request_type: 'FR',
                user_id: '0002',
                user_name: 'Cindy Aulia Nurhikmah',
                department: 'Finance',
                field_rig_name: 'Balikpapan',
                location_code: 'Pertamina Zona 11',
                freight_by: 'Sea',
                general_notes: 'Jasa perbaikan mesin generator.',
                status: 'Approved',
                created_at: '2026-01-05T14:30:00Z',
                updated_at: '2026-01-06T10:30:00Z',
                approver_id: '0003',
                approver_name: 'Haryanto Daru',
                approval_date: '2026-01-06T10:30:00Z',
                approver_remark: 'Approved, segera proses',
                items: [
                    { id: 3, item_no: 1, full_description: 'Service starter generator 500KVA', unit: 'SET', qty_requested: 1, qty_approved: 1, qty_supplied: null, qty_outstanding: null }
                ],
                attachments: [],
                attachment_count: 0,
                history: [
                    { id: 2, action_type: 'Create', action_by: '0002', action_by_name: 'Cindy Aulia Nurhikmah', old_status: null, new_status: 'Waiting', remark: 'Request created', created_at: '2026-01-05T14:30:00Z' },
                    { id: 3, action_type: 'Approve', action_by: '0003', action_by_name: 'Haryanto Daru', old_status: 'Waiting', new_status: 'Approved', remark: 'Approved, segera proses', created_at: '2026-01-06T10:30:00Z' }
                ]
            }
        ],
        
        pdList: [
            {
                id: 1,
                pd_no: '0001/SAS/PD/20/01/2026',
                user_id: '0002',
                user_name: 'Cindy Aulia Nurhikmah',
                department: 'Finance',
                nominal: 2500000,
                description: 'Pengajuan dana untuk pembelian sparepart printer',
                reference_request_id: 1,
                reference_request_no: '0001/SAS/MR/03/01/2026',
                reference_request_type: 'MR',
                status: 'Waiting',
                created_at: '2026-01-20T10:30:00Z',
                updated_at: '2026-01-20T10:30:00Z',
                approver_id: null,
                approver_name: null,
                approval_date: null,
                approver_remark: null,
                attachments: [],
                attachment_count: 0
            },
            {
                id: 2,
                pd_no: '0002/SAS/PD/22/01/2026',
                user_id: '0002',
                user_name: 'Cindy Aulia Nurhikmah',
                department: 'Finance',
                nominal: 5000000,
                description: 'Pengajuan dana untuk service AC',
                reference_request_id: null,
                reference_request_no: null,
                reference_request_type: null,
                status: 'Approved',
                created_at: '2026-01-22T13:30:00Z',
                updated_at: '2026-01-23T09:15:00Z',
                approver_id: '0003',
                approver_name: 'Haryanto Daru',
                approval_date: '2026-01-23T09:15:00Z',
                approver_remark: 'Disetujui',
                attachments: [],
                attachment_count: 0
            }
        ],
        
        menuTree: [
            { id: 1, menu_key: 'dashboard', parent_id: null, label: 'Dashboard', icon: 'dashboard.png', sort_order: 1, is_active: 1, children: [] },
            { 
                id: 2, 
                menu_key: 'request', 
                parent_id: null, 
                label: 'Request (MR/FR)', 
                icon: 'pengajuan(MR-FR).png', 
                sort_order: 2, 
                is_active: 1, 
                children: [
                    { id: 5, menu_key: 'create-request', parent_id: 2, label: 'Create Request', icon: 'create.png', sort_order: 1, is_active: 1, children: [] },
                    { id: 6, menu_key: 'list-request', parent_id: 2, label: 'List Request', icon: 'list.png', sort_order: 2, is_active: 1, children: [] }
                ]
            },
            { 
                id: 3, 
                menu_key: 'pengajuan-dana', 
                parent_id: null, 
                label: 'Pengajuan Dana', 
                icon: 'pd.png', 
                sort_order: 3, 
                is_active: 1, 
                children: [
                    { id: 7, menu_key: 'create-pd', parent_id: 3, label: 'Create PD', icon: 'req-money.png', sort_order: 1, is_active: 1, children: [] },
                    { id: 8, menu_key: 'list-pd', parent_id: 3, label: 'List PD', icon: 'list-req-money.png', sort_order: 2, is_active: 1, children: [] }
                ]
            },
            { 
                id: 4, 
                menu_key: 'pengaturan', 
                parent_id: null, 
                label: 'Pengaturan', 
                icon: 'settings.png', 
                sort_order: 4, 
                is_active: 1, 
                children: [
                    { id: 9, menu_key: 'user-management', parent_id: 4, label: 'User Management', icon: 'user-management.png', sort_order: 1, is_active: 1, children: [] },
                    { id: 10, menu_key: 'parameter', parent_id: 4, label: 'Parameter', icon: 'parameter.png', sort_order: 2, is_active: 1, children: [] },
                    { id: 11, menu_key: 'monitoring', parent_id: 4, label: 'Monitoring', icon: 'monitoring.png', sort_order: 3, is_active: 1, children: [] }
                ]
            }
        ],
        
        userPermissions: {
            '0001': { active_menus: ['all'] },
            '0002': { active_menus: ['dashboard', 'request', 'create-request', 'list-request', 'pengajuan-dana', 'create-pd', 'list-pd'] },
            '0003': { active_menus: ['dashboard', 'request', 'list-request', 'pengajuan-dana', 'list-pd', 'pengaturan', 'parameter', 'monitoring'] },
            '0004': { active_menus: ['dashboard', 'request', 'create-request', 'list-request', 'pengajuan-dana', 'create-pd', 'list-pd'] },
            '0005': { active_menus: ['dashboard', 'request', 'list-request'] }
        },
        
        monitoringData: [
            { id: 1, type: 'cache', value: 'User session cache - 5 items', created_at: '2026-01-28T08:00:00Z', status: 'active', expires_at: '2026-01-28T10:00:00Z' },
            { id: 2, type: 'log', value: 'Login attempt from 192.168.1.100 - Success', created_at: '2026-01-28T09:15:00Z', status: 'active', expires_at: null },
            { id: 3, type: 'session', value: 'User 0002 active session', created_at: '2026-01-28T09:30:00Z', status: 'active', expires_at: '2026-01-28T11:30:00Z' },
            { id: 4, type: 'cache', value: 'Request list cache - page 1', created_at: '2026-01-28T09:45:00Z', status: 'expired', expires_at: '2026-01-28T09:55:00Z' },
            { id: 5, type: 'log', value: 'Request 0001/SAS/MR/03/01/2026 created', created_at: '2026-01-28T10:00:00Z', status: 'active', expires_at: null }
        ],
        
        fieldRigNames: [
            { id: 1, name: 'Bojonegoro', is_active: 1 },
            { id: 2, name: 'Balikpapan', is_active: 1 },
            { id: 3, name: 'Jakarta', is_active: 1 },
            { id: 4, name: 'Surabaya', is_active: 1 }
        ],
        
        locationCodes: [
            { id: 1, code: 'Pertamina Zona 10', is_active: 1 },
            { id: 2, code: 'Pertamina Zona 11', is_active: 1 },
            { id: 3, code: 'Pertamina Zona 12', is_active: 1 },
            { id: 4, code: 'Pertamina Zona 13', is_active: 1 }
        ]
    },

    // ============================================================
    // INITIALIZATION
    // ============================================================
    
    async init() {
        // Check if LocalDB is available
        if (typeof LocalDB === 'undefined') {
            console.error('[APP] LocalDB is not defined! Make sure db.js is loaded before config.js');
            throw new Error('LocalDB not loaded. Pastikan db.js di-load sebelum config.js');
        }
        
        // Init IndexedDB
        await LocalDB.init();
        
        // Seed data jika kosong
        await LocalDB.seedData(this.MOCK_DATA);
        
        // Set current user dari session atau default
        const session = JSON.parse(sessionStorage.getItem(this.SESSION_KEY) || '{}');
        this.currentUser = session.id ? session : this.MOCK_DATA.users[0]; // Default admin
        
        // Auto-login jika belum ada session
        if (!session.id) {
            sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(this.currentUser));
            sessionStorage.setItem(this.TOKEN_KEY, 'local-token-' + Date.now());
        }
        
        console.log('[APP] Initialized with user:', this.currentUser.nama_lengkap);
        return this;
    },

    // ============================================================
    // API METHODS - Database Operations
    // ============================================================
    
    // USER MANAGEMENT
    async getUsers() {
        // Check LocalDB availability
        if (typeof LocalDB === 'undefined') {
            throw new Error('LocalDB not available');
        }
        
        const users = await LocalDB.getAll('users');
        return users.map(u => ({
            id: u.id,
            nama_lengkap: u.nama_lengkap,
            username: u.username,
            id_role: u.id_role,
            nama_role: u.nama_role,
            departemen: u.departemen,
            email: u.email,
            no_handphone: u.no_handphone,
            is_active: u.is_active
        }));
    },

    async addUser(userData) {
        if (typeof LocalDB === 'undefined') {
            throw new Error('LocalDB not available');
        }
        
        const users = await LocalDB.getAll('users');
        const maxId = Math.max(...users.map(u => parseInt(u.id)), 0);
        const newId = String(maxId + 1).padStart(4, '0');
        
        const newUser = {
            ...userData,
            id: newId,
            password: userData.password || 'SAS.2026#orderapps!',
            is_active: 1,
            created_at: new Date().toISOString()
        };
        
        await LocalDB.put('users', newUser);
        return { status: 'success', message: 'User berhasil ditambahkan', data: { id: newId } };
    },

    async updateUser(userData) {
        if (typeof LocalDB === 'undefined') {
            throw new Error('LocalDB not available');
        }
        
        const existing = await LocalDB.get('users', userData.id);
        if (!existing) {
            return { status: 'error', message: 'User tidak ditemukan' };
        }
        
        // Merge data, preserve fields not provided
        const updated = { 
            ...existing, 
            ...userData, 
            updated_at: new Date().toISOString() 
        };
        
        // Don't overwrite password if not provided
        if (!userData.password) {
            updated.password = existing.password;
        }
        
        await LocalDB.put('users', updated);
        return { status: 'success', message: 'User berhasil diperbarui' };
    },

    // PERMISSION METHODS
    async getUserPermissions(userId) {
        try {
            // Check LocalDB availability
            if (typeof LocalDB === 'undefined') {
                throw new Error('LocalDB not available');
            }
            
            // Try to get from IndexedDB first
            const dbPerm = await LocalDB.get('permissions', userId);
            
            // Get default from MOCK_DATA
            const defaultPerm = this.MOCK_DATA.userPermissions[userId] || { active_menus: [] };
            
            return {
                tree: this.MOCK_DATA.menuTree,
                active_menus: dbPerm ? dbPerm.menus : defaultPerm.active_menus,
                full_access: (dbPerm ? dbPerm.menus : defaultPerm.active_menus).includes('all')
            };
        } catch (error) {
            console.error('Error getting permissions:', error);
            // Fallback to mock data
            const defaultPerm = this.MOCK_DATA.userPermissions[userId] || { active_menus: [] };
            return {
                tree: this.MOCK_DATA.menuTree,
                active_menus: defaultPerm.active_menus,
                full_access: defaultPerm.active_menus.includes('all')
            };
        }
    },

    async savePermissions(userId, permissions) {
        try {
            // Check LocalDB availability
            if (typeof LocalDB === 'undefined') {
                throw new Error('LocalDB not available');
            }
            
            // Save to IndexedDB
            await LocalDB.put('permissions', {
                user_id: userId,
                menus: permissions,
                updated_at: new Date().toISOString()
            });
            
            // Update in-memory mock data
            this.MOCK_DATA.userPermissions[userId] = { active_menus: permissions };
            
            return { status: 'success', message: 'Permission berhasil disimpan' };
        } catch (error) {
            console.error('Error saving permissions:', error);
            return { status: 'error', message: error.message };
        }
    },

    // MONITORING
    async getMonitoring(filters = {}) {
        if (typeof LocalDB === 'undefined') {
            throw new Error('LocalDB not available');
        }
        
        let data = await LocalDB.getAll('monitoring');
        
        if (filters.type) data = data.filter(m => m.type === filters.type);
        if (filters.status) data = data.filter(m => m.status === filters.status);
        if (filters.search) {
            const search = filters.search.toLowerCase();
            data = data.filter(m => m.value.toLowerCase().includes(search));
        }
        
        return { status: 'success', data };
    },

    async addMonitoringEntry(entry) {
        if (typeof LocalDB === 'undefined') {
            throw new Error('LocalDB not available');
        }
        
        const newEntry = {
            ...entry,
            id: Date.now(),
            created_at: new Date().toISOString()
        };
        await LocalDB.put('monitoring', newEntry);
        return { status: 'success', data: newEntry };
    },

    async deleteMonitoringEntry(id) {
        if (typeof LocalDB === 'undefined') {
            throw new Error('LocalDB not available');
        }
        
        await LocalDB.delete('monitoring', id);
        return { status: 'success' };
    },

    // MASTER DATA
    getFieldRigNames() {
        return { status: 'success', data: this.MOCK_DATA.fieldRigNames.filter(f => f.is_active) };
    },

    getLocationCodes() {
        return { status: 'success', data: this.MOCK_DATA.locationCodes.filter(l => l.is_active) };
    },

    // REQUESTS (MR/FR)
    async getRequests(filters = {}) {
        if (typeof LocalDB === 'undefined') {
            throw new Error('LocalDB not available');
        }
        
        let data = await LocalDB.getAll('requests');
        
        if (filters.status) data = data.filter(r => r.status === filters.status);
        if (filters.type) data = data.filter(r => r.request_type === filters.type);
        if (filters.search) {
            const search = filters.search.toLowerCase();
            data = data.filter(r => 
                r.request_no.toLowerCase().includes(search) ||
                r.user_name.toLowerCase().includes(search)
            );
        }
        
        // Pagination
        const page = parseInt(filters.page) || 1;
        const perPage = parseInt(filters.per_page) || 10;
        const total = data.length;
        const start = (page - 1) * perPage;
        const paginated = data.slice(start, start + perPage);
        
        return {
            status: 'success',
            data: paginated,
            pagination: {
                page, per_page: perPage, total,
                total_pages: Math.ceil(total / perPage),
                has_next: page < Math.ceil(total / perPage),
                has_prev: page > 1
            }
        };
    },

    async getRequest(id) {
        if (typeof LocalDB === 'undefined') {
            throw new Error('LocalDB not available');
        }
        
        const req = await LocalDB.get('requests', id);
        return req ? { status: 'success', data: req } : { status: 'error', message: 'Request tidak ditemukan' };
    },

    // PD (PENGAJUAN DANA)
    async getPDList(filters = {}) {
        if (typeof LocalDB === 'undefined') {
            throw new Error('LocalDB not available');
        }
        
        let data = await LocalDB.getAll('pd');
        
        if (filters.status) data = data.filter(p => p.status === filters.status);
        if (filters.search) {
            const search = filters.search.toLowerCase();
            data = data.filter(p => 
                p.pd_no.toLowerCase().includes(search) ||
                p.description.toLowerCase().includes(search)
            );
        }
        if (filters.reference === 'with') data = data.filter(p => p.reference_request_no);
        if (filters.reference === 'without') data = data.filter(p => !p.reference_request_no);
        
        return { status: 'success', data: { items: data, total: data.length } };
    },

    async getPD(id) {
        if (typeof LocalDB === 'undefined') {
            throw new Error('LocalDB not available');
        }
        
        const pd = await LocalDB.get('pd', id);
        return pd ? { status: 'success', data: pd } : { status: 'error', message: 'PD tidak ditemukan' };
    },

    // UTILITY
    generateRequestNo(type, date = new Date()) {
        const prefix = '0000';
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${prefix}/SAS/${type}/${day}/${month}/${year}`;
    },

    generatePDNo(date = new Date()) {
        const prefix = '0000';
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${prefix}/SAS/PD/${day}/${month}/${year}`;
    },

    // RESET
    async resetAllData() {
        if (typeof LocalDB === 'undefined') {
            throw new Error('LocalDB not available');
        }
        
        await LocalDB.resetAll(this.MOCK_DATA);
        return { status: 'success', message: 'Semua data telah direset' };
    },

    // SWITCH USER (Demo feature)
    async switchUser(userId) {
        if (typeof LocalDB === 'undefined') {
            throw new Error('LocalDB not available');
        }
        
        const user = await LocalDB.get('users', userId);
        if (user) {
            this.currentUser = user;
            sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(user));
            sessionStorage.setItem(this.TOKEN_KEY, 'local-token-' + Date.now());
            return { status: 'success', user };
        }
        return { status: 'error', message: 'User tidak ditemukan' };
    },

    // LOGOUT
    logout() {
        // Clear session data
        sessionStorage.removeItem(this.SESSION_KEY);
        sessionStorage.removeItem(this.TOKEN_KEY);
        
        // Clear IndexedDB jika diperlukan (opsional - untuk security)
        if (typeof LocalDB !== 'undefined') {
            // Hapus data sensitive jika ada, atau biarkan untuk cache
            console.log('[LOGOUT] Session cleared');
        }
        
        // Redirect ke root index.html (naik 2 level dari Develop3/frontend/pages/)
        // ../../index.html = dari /pages/ ke /frontend/ ke /Develop3/ ke /samooforge/
        window.location.href = '../../index.html';
    }
};

// Auto-init saat load dengan error handling
document.addEventListener('DOMContentLoaded', () => {
    // Check if LocalDB exists before trying to init
    if (typeof LocalDB === 'undefined') {
        console.error('[APP] CRITICAL: LocalDB is not defined! Make sure db.js is loaded BEFORE config.js in your HTML files.');
        console.error('[APP] Correct order: <script src="db.js"><\/script> <script src="config.js"><\/script>');
        return;
    }
    
    APP_CONFIG.init().then(() => {
        console.log('[APP] Ready');
    }).catch(err => {
        console.error('[APP] Init failed:', err);
    });
});

window.APP_CONFIG = APP_CONFIG;