/* GLOBAL UTILITIES
   Fungsi: Fungsi bantuan yang dipakai di banyak halaman (Format mata uang, validasi token, dll).
   Lokasi: /frontend/assets/js/global-utils.js
*/

const API_BASE_URL = "http://localhost:3000"; // Sesuaikan dengan Gateway Anda

// Fungsi untuk mengecek apakah user sudah login (Dipakai di dashboard & request)
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/pages/login.html';
    }
}

// Helper untuk Fetch API agar tidak menulis fetch berulang kali
async function apiFetch(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
        'Authorization': `Bearer ${token}`
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
    return response.json();
}