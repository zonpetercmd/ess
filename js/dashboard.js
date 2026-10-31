if (!firebase.apps.length) firebase.initializeApp(window.FIREBASE_CONFIG);
const db = firebase.database();

// Check if logged in
const staffUser = JSON.parse(localStorage.getItem('staff_user'));
const token = localStorage.getItem('staff_token');

if (!staffUser || !token) {
    window.location.href = 'index.html'; // Redirect to login if not authenticated
} else {
    document.getElementById('staff_name').innerText = staffUser.name;
    document.getElementById('welcome_name').innerText = staffUser.name;
    loadSalary(staffUser.uid);
}

function loadSalary(uid) {
    const tbody = document.getElementById('salary_list');
    
    // Fetch salary records for this specific employee
    db.ref('salary_records/' + uid).on('value', (snapshot) => {
        const data = snapshot.val();
        
        if (!data) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:#999;">No salary records found yet.</td></tr>';
            return;
        }

        const records = Object.keys(data).map(key => ({ id: key, ...data[key] })).sort((a,b) => b.id.localeCompare(a.id));
        
        tbody.innerHTML = records.map(r => `
            <tr>
                <td><strong>${r.month}</strong></td>
                <td>₹ ${r.basic.toLocaleString()}</td>
                <td style="color: #059669;">+ ₹ ${r.allowances.toLocaleString()}</td>
                <td style="color: #dc2626;">- ₹ ${r.deductions.toLocaleString()}</td>
                <td style="font-weight: 800;">₹ ${r.netSalary.toLocaleString()}</td>
                <td>
                    <span style="background:${r.status === 'Paid' ? '#ecfdf5' : '#fffbeb'}; color:${r.status === 'Paid' ? '#059669' : '#d97706'}; padding:4px 10px; border-radius:20px; font-size:12px; font-weight:700;">
                        ${r.status}
                    </span>
                </td>
                <td><button onclick="printSlip('${r.id}')" class="btn-action btn-blue">Print Slip</button></td>
            </tr>
        `).join('');
    });
}

// Print Pay Slip
window.printSlip = (monthId) => {
    db.ref('salary_records/' + staffUser.uid + '/' + monthId).once('value').then(snap => {
        const r = snap.val();
        const win = window.open('', '_blank');
        win.document.write(`
            <html><head><title>Pay Slip - ${r.month}</title>
            <style>
                body { font-family: Arial; padding: 40px; }
                .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ccc; padding: 12px; text-align: left; }
            </style></head><body>
                <div class="header">
                    <h2>D E V विद्यालय</h2>
                    <p>Pay Slip for ${r.month}</p>
                </div>
                <p><strong>Employee Name:</strong> ${staffUser.name}</p>
                <p><strong>Designation:</strong> ${staffUser.designation || 'Staff'}</p>
                <table>
                    <tr><th>Description</th><th>Amount (₹)</th></tr>
                    <tr><td>Basic Salary</td><td>${r.basic.toLocaleString()}</td></tr>
                    <tr><td>Allowances</td><td>+ ${r.allowances.toLocaleString()}</td></tr>
                    <tr><td>Deductions</td><td>- ${r.deductions.toLocaleString()}</td></tr>
                    <tr style="background:#f8fafc; font-weight:bold;"><td>Net Payable</td><td>₹ ${r.netSalary.toLocaleString()}</td></tr>
                </table>
                <p style="margin-top: 50px; text-align: right;">Authorized Signatory</p>
            </body></html>
        `);
        win.document.close();
        setTimeout(() => win.print(), 500);
    });
};

window.logout = () => {
    localStorage.removeItem('staff_user');
    localStorage.removeItem('staff_token');
    window.location.href = 'index.html';
};
