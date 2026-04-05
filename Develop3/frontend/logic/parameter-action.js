/**
 * PARAMETER ACTIONS - Filter logic
 */

document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('filter-search');
    const roleSelect = document.getElementById('filter-role');
    const btnApply = document.getElementById('btn-cari');
    const btnReset = document.querySelector('.btn-reset');

    if (!searchInput || !roleSelect || !btnApply) return;

    function filterTable() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const selectedRoleValue = roleSelect.value;
        const tableRows = document.querySelectorAll('#user-table-body tr');

        tableRows.forEach(row => {
            if (row.cells.length < 5) return;

            const name = row.cells[1].textContent.toLowerCase();
            const username = row.cells[2].textContent.toLowerCase();
            const roleBadge = row.querySelector('.role-badge');
            const roleClass = roleBadge ? roleBadge.className : '';

            const matchText = name.includes(searchTerm) || username.includes(searchTerm);
            const matchRole = (selectedRoleValue === "") || roleClass.includes(`role-${selectedRoleValue}`);

            row.style.display = (matchText && matchRole) ? "" : "none";
        });
    }

    btnApply.addEventListener('click', (e) => {
        e.preventDefault();
        filterTable();
    });

    if (btnReset) {
        btnReset.addEventListener('click', (e) => {
            e.preventDefault();
            searchInput.value = '';
            roleSelect.selectedIndex = 0;
            document.querySelectorAll('#user-table-body tr').forEach(r => r.style.display = "");
        });
    }
});