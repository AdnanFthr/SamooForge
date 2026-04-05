/**
 * LOGIC USER FILTER - V3 System (Fixed Version)
 */
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('filter-search');
    const roleSelect = document.getElementById('filter-role');
    const btnApply = document.getElementById('btn-cari');
    const btnReset = document.querySelector('.btn-reset');

    if (!searchInput || !roleSelect || !btnApply) return;

    function filterTable() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const selectedRoleValue = roleSelect.value; // Mengambil value (01, 02, 03)
        const tableRows = document.querySelectorAll('#user-table-body tr');

        tableRows.forEach(row => {
            // Abaikan jika row adalah pesan "Tidak ada data"
            if (row.cells.length < 5) return;

            const name = row.cells[1].textContent.toLowerCase();
            const username = row.cells[2].textContent.toLowerCase();
            
            // Ambil ID Role dari class badge (user-management.js memberikan class "role-01", dst)
            const roleBadge = row.querySelector('.role-badge');
            const roleClass = roleBadge ? roleBadge.className : ''; 

            // Logika Pencarian Teks
            const matchText = name.includes(searchTerm) || username.includes(searchTerm);
            
            // Logika Role: Cek apakah class badge mengandung ID role yang dipilih
            // Contoh: Jika pilih Admin (01), cek apakah ada class "role-01"
            const matchRole = (selectedRoleValue === "") || roleClass.includes(`role-${selectedRoleValue}`);

            if (matchText && matchRole) {
                row.style.display = "";
            } else {
                row.style.display = "none";
            }
        });
    }

    // Event Click Tombol Cari
    btnApply.addEventListener('click', (e) => {
        e.preventDefault();
        filterTable();
    });

    // Reset Filter
    if (btnReset) {
        btnReset.addEventListener('click', (e) => {
            e.preventDefault();
            searchInput.value = '';
            roleSelect.selectedIndex = 0;
            // Tampilkan kembali semua baris
            document.querySelectorAll('#user-table-body tr').forEach(r => r.style.display = "");
        });
    }
});