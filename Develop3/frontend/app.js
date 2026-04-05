/**
 * GLOBAL FRONTEND LOGIC - V3 System
 * Menggabungkan: Jam Digital, Toggle Sidebar, Submenu Animasi, User Info & Mobile Responsiveness.
 */

// Konfigurasi URL Gateway sesuai struktur
const GATEWAY_URL = 'http://localhost/sas-orderapps/Develop3/gateway.php';

// Fungsi untuk load user info ke sidebar - MENGGUNAKAN SESSIONSTORAGE
function loadUserInfo() {
    const session = JSON.parse(sessionStorage.getItem('sas_user_session') || '{}');
    const userName = session.nama_lengkap || 'Loading...';
    const userDept = session.departemen || 'Loading...';
    
    const nameEl = document.getElementById('sidebar-user-name');
    const deptEl = document.getElementById('sidebar-user-dept');
    
    if (nameEl) nameEl.textContent = userName;
    if (deptEl) deptEl.textContent = userDept;
    
    console.log('app.js loadUserInfo:', userName, userDept);
}

document.addEventListener('DOMContentLoaded', function() {
    // Load user info
    loadUserInfo();
    
    // ==========================================
    // 1. FUNGSI JAM DIGITAL & TANGGAL
    // ==========================================
    function updateClock() {
        const now = new Date();
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        
        const clockElement = document.getElementById('real-time-clock');
        if (clockElement) {
            clockElement.innerHTML = `
                <div class="date-part" style="font-size: 0.85rem; opacity: 0.8;">
                    ${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}
                </div>
                <div class="time-part" style="font-size: 1.2rem; font-weight: bold; color: #c6a048;">
                    ${hours}:${minutes}
                </div>
            `;
        }
    }
    setInterval(updateClock, 1000);
    updateClock();

    // ==========================================
    // 2. LOGIKA SIDEBAR & SUBMENU
    // ==========================================
    const sidebar = document.querySelector('.sidebar');
    const menuBtn = document.getElementById('mobile-menu-btn');

    if (menuBtn && sidebar) {
        menuBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            sidebar.classList.toggle('active');
        });
    }

    const submenuToggles = document.querySelectorAll('.submenu-toggle');
    submenuToggles.forEach(toggle => {
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

    // ==========================================
    // 3. FITUR "CLOSE ON CLICK OUTSIDE"
    // ==========================================
    document.addEventListener('click', function(event) {
        const isClickInsideSidebar = sidebar ? sidebar.contains(event.target) : false;
        const isClickOnMenuBtn = menuBtn ? menuBtn.contains(event.target) : false;

        if (!isClickInsideSidebar && !isClickOnMenuBtn) {
            if (window.innerWidth <= 992 && sidebar) {
                sidebar.classList.remove('active');
            }
            document.querySelectorAll('.has-submenu.open').forEach(openItem => {
                openItem.classList.remove('open');
            });
        }
    });

    console.log("Global Logic Initialized: Sidebar, Submenu, Clock, and User Info are ready.");
});

// Tambahkan di akhir app.js
// Listen untuk perubahan session dari tab lain
window.addEventListener('storage', function(e) {
    if (e.key === 'sas_user_session') {
        console.log('Session changed in another tab, refreshing sidebar...');
        if (typeof window.refreshSidebar === 'function') {
            window.refreshSidebar();
        }
    }
});