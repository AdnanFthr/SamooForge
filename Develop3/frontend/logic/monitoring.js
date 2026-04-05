/**
 * MONITORING LOGIC - Local Database Version
 */

window.monitoringData = [];
window.currentSort = { field: null, direction: 'asc' };

async function loadMonitoring() {
    try {
        const result = await APP_CONFIG.getMonitoring();
        window.monitoringData = result.data;
        renderTable(window.monitoringData);
    } catch (error) {
        console.error("Gagal memuat monitoring:", error);
        document.getElementById('monitoring-table-body').innerHTML = 
            '<tr><td colspan="6" style="text-align:center; color:red;">Gagal memuat data</td></tr>';
    }
}

function renderTable(data) {
    const tableBody = document.getElementById('monitoring-table-body');
    tableBody.innerHTML = '';

    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Tidak ada data</td></tr>';
        return;
    }

    data.forEach(item => {
        const row = `
            <tr>
                <td>${item.id}</td>
                <td><span class="type-badge type-${item.type}">${item.type.toUpperCase()}</span></td>
                <td>${escapeHtml(item.value)}</td>
                <td>${formatDate(item.created_at)}</td>
                <td><span class="status-badge status-${item.status}">${item.status}</span></td>
                <td>
                    <button class="btn-mini btn-delete" onclick="deleteEntry(${item.id})" title="Hapus">🗑️</button>
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

    window.monitoringData.sort((a, b) => {
        let valA = a[field] || '';
        let valB = b[field] || '';
        
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return window.currentSort.direction === 'asc' ? -1 : 1;
        if (valA > valB) return window.currentSort.direction === 'asc' ? 1 : -1;
        return 0;
    });

    updateSortIcons(field, window.currentSort.direction);
    renderTable(window.monitoringData);
};

function updateSortIcons(activeField, direction) {
    document.querySelectorAll('.modern-table th').forEach(th => {
        th.innerHTML = th.innerHTML.replace(/ ↕| ↑| ↓/g, '') + ' ↕';
        th.style.color = '#0f5c93';
    });

    const headers = document.querySelectorAll('.modern-table th');
    const fieldMap = { 'id': 0, 'type': 1, 'value': 2, 'created_at': 3 };
    const index = fieldMap[activeField];
    
    if (index !== undefined && headers[index]) {
        const arrow = direction === 'asc' ? ' ↑' : ' ↓';
        headers[index].innerHTML = headers[index].innerHTML.replace(' ↕', arrow);
        headers[index].style.color = '#c6a048';
    }
}

async function applyFilters() {
    const filters = {
        search: document.getElementById('filter-search')?.value,
        type: document.getElementById('filter-type')?.value,
        status: document.getElementById('filter-status')?.value
    };
    
    try {
        const result = await APP_CONFIG.getMonitoring(filters);
        window.monitoringData = result.data;
        renderTable(window.monitoringData);
    } catch (error) {
        console.error("Filter error:", error);
    }
}

window.resetFilter = function() {
    document.getElementById('filter-search').value = '';
    document.getElementById('filter-type').value = '';
    document.getElementById('filter-status').value = '';
    loadMonitoring();
};

window.deleteEntry = async function(id) {
    if (!confirm('Yakin ingin menghapus entry ini?')) return;
    
    try {
        await APP_CONFIG.deleteMonitoringEntry(id);
        showAlert('Entry berhasil dihapus');
        await loadMonitoring();
    } catch (error) {
        console.error("Delete error:", error);
        showAlert('Gagal menghapus entry');
    }
};

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Alert
window.showAlert = function(message) {
    document.getElementById('alertMessage').innerText = message;
    document.getElementById('alertModal').style.display = 'flex';
};

window.closeAlertModal = function() {
    document.getElementById('alertModal').style.display = 'none';
};

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    loadMonitoring();
    
    document.getElementById('btn-cari')?.addEventListener('click', applyFilters);
});