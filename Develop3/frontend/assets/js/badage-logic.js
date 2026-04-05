/**
 * USER MANAGEMENT LOGIC
 * Lokasi: /Develop3/frontend/assets/js/user-logic.js
 */

function toggleUserStatus(userId) {
    const statusElement = document.getElementById(`status-${userId}`);
    const btnElement = event.currentTarget; // Mengambil tombol yang diklik

    if (statusElement.innerText.toLowerCase() === 'aktif') {
        // Ubah ke Inactive
        statusElement.innerText = 'nonaktif';
        statusElement.className = 'status-badge-inactive';
        btnElement.innerText = 'Aktifkan';
        btnElement.style.backgroundColor = '#f1f2f6';
        console.log(`User ${userId} dinonaktifkan di frontend.`);
    } else {
        // Ubah kembali ke Active
        statusElement.innerText = 'aktif';
        statusElement.className = 'status-badge-approved';
        btnElement.innerText = 'Nonaktifkan';
        btnElement.style.backgroundColor = '#e8f4fd';
        console.log(`User ${userId} diaktifkan kembali di frontend.`);
    }
}