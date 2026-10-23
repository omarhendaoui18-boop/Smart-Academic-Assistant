// Sécurité
if (!localStorage.getItem('saa_token') || localStorage.getItem('saa_role') !== 'admin') {
    window.location.href = '/pages/login.html';
}

document.getElementById('logoutBtn').addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.clear();
    window.location.href = '/pages/login.html';
});

// Configuration Chart.js
Chart.defaults.color = '#a0a0b0';
Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.05)';

// --- 1. Graphique des Statuts (Camembert) ---
const statusCtx = document.getElementById('statusChart').getContext('2d');
const statusChart = new Chart(statusCtx, {
    type: 'doughnut',
    data: {
        labels: ['🟢 Bon', '🟡 Moyen', '🔴 En danger'],
        datasets: [{
            data: [0, 0, 0], // Zéro par défaut
            backgroundColor: ['#28a745', '#ffc107', '#ff4d4d'],
            borderWidth: 0,
            hoverOffset: 10
        }]
    },
    options: {
        responsive: true,
        plugins: { legend: { position: 'bottom', labels: { padding: 20 } } }
    }
});

// --- 2. Graphique des Filières (Barres) ---
const filiereCtx = document.getElementById('filiereChart').getContext('2d');
const filiereChart = new Chart(filiereCtx, {
    type: 'bar',
    data: {
        labels: [], // Vide par défaut
        datasets: [{
            label: 'Moyenne Réelle',
            data: [], // Vide par défaut
            backgroundColor: 'rgba(108, 99, 255, 0.6)',
            borderColor: '#6c63ff',
            borderWidth: 1,
            borderRadius: 8
        }]
    },
    options: {
        responsive: true,
        scales: { y: { beginAtZero: true, max: 20 } },
        plugins: { legend: { display: false } }
    }
});

// --- 3. Charger les vrais stats globaux ---
async function loadRealStats() {
    try {
        const response = await fetch('/api/admin/stats');
        const result = await response.json();
        
        if (result.success) {
            document.getElementById('stat-total').textContent = result.data.totalEtudiants;
            document.getElementById('stat-danger').textContent = result.data.enDanger;
            document.getElementById('stat-moyenne').textContent = result.data.moyenneGenerale + ' / 20';
            document.getElementById('stat-bon').textContent = result.data.statutBon;

            // Mettre à jour le camembert
            statusChart.data.datasets[0].data = [
                result.data.statutBon, 
                result.data.statutMoyen, 
                result.data.enDanger
            ];
            statusChart.update();
        }
    } catch (error) {
        console.error("Erreur stats globales:", error);
    }
}

// --- 4. Charger les vraies moyennes par filière ---
async function loadFilieresStats() {
    try {
        const response = await fetch('/api/admin/stats/filieres');
        const result = await response.json();
        
        if (result.success) {
            const labels = Object.keys(result.data); 
            const data = Object.values(result.data); 
            
            // Mettre à jour le graphique des barres
            filiereChart.data.labels = labels;
            filiereChart.data.datasets[0].data = data;
            filiereChart.update();
        }
    } catch (error) {
        console.error("Erreur stats filières:", error);
    }
}

// --- LANCEMENT ---
loadRealStats();
loadFilieresStats();