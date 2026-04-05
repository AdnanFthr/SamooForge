/**
 * LOCAL DATABASE - IndexedDB Wrapper
 * Untuk persistence data melebihi localStorage limit
 */

const DB_NAME = 'SASOrderAppsV3';
const DB_VERSION = 1;

const LocalDB = {
    db: null,

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Stores
                if (!db.objectStoreNames.contains('users')) {
                    const userStore = db.createObjectStore('users', { keyPath: 'id' });
                    userStore.createIndex('username', 'username', { unique: true });
                }
                
                if (!db.objectStoreNames.contains('requests')) {
                    db.createObjectStore('requests', { keyPath: 'id', autoIncrement: true });
                }
                
                if (!db.objectStoreNames.contains('pd')) {
                    db.createObjectStore('pd', { keyPath: 'id', autoIncrement: true });
                }
                
                if (!db.objectStoreNames.contains('permissions')) {
                    db.createObjectStore('permissions', { keyPath: 'user_id' });
                }
                
                if (!db.objectStoreNames.contains('monitoring')) {
                    db.createObjectStore('monitoring', { keyPath: 'id', autoIncrement: true });
                }
                
                if (!db.objectStoreNames.contains('files')) {
                    db.createObjectStore('files', { keyPath: 'id', autoIncrement: true });
                }
            };
        });
    },

    // Generic CRUD operations
    async getAll(storeName) {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async get(storeName, key) {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(key);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async put(storeName, data) {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async delete(storeName, key) {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(key);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },

    async clear(storeName) {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },

    // Seed initial data from MOCK_DATA
    async seedData(mockData) {
        const existingUsers = await this.getAll('users');
        if (existingUsers.length === 0) {
            console.log('[DB] Seeding initial data...');
            
            // Seed users
            for (const user of mockData.users) {
                await this.put('users', user);
            }
            
            // Seed requests
            for (const req of mockData.requests) {
                await this.put('requests', req);
            }
            
            // Seed PD
            for (const pd of mockData.pdList) {
                await this.put('pd', pd);
            }
            
            // Seed permissions
            for (const [userId, perms] of Object.entries(mockData.userPermissions)) {
                await this.put('permissions', {
                    user_id: userId,
                    menus: perms.active_menus,
                    updated_at: new Date().toISOString()
                });
            }
            
            // Seed monitoring
            for (const item of mockData.monitoringData) {
                await this.put('monitoring', item);
            }
            
            console.log('[DB] Seeding complete');
        }
    },

    // Reset all data
    async resetAll(mockData) {
        console.log('[DB] Resetting all data...');
        await this.clear('users');
        await this.clear('requests');
        await this.clear('pd');
        await this.clear('permissions');
        await this.clear('monitoring');
        await this.clear('files');
        await this.seedData(mockData);
        console.log('[DB] Reset complete');
    }
};

// Auto-init saat load
window.LocalDB = LocalDB;