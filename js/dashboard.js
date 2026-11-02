// ✅ 1. Check Authentication (Using the new staff_data keys)
const token = localStorage.getItem('staff_token');
const staffDataStr = localStorage.getItem('staff_data');

if (!token || !staffDataStr) {
    alert("❌ Access Denied! Please login first.");
    window.location.href = 'index.html';
}

const empData = JSON.parse(staffDataStr);

// Show User Info
document.getElementById('emp_name').innerText = '👤 ' + (empData.name || 'Employee');
document.getElementById('welcome_name').innerText = empData.name || 'Employee';
document.getElementById('emp_desig').innerText = empData.designation || '-';
document.getElementById('emp_basic').innerText = '₹ ' + (empData.basicSalary || 0).toLocaleString();
document.getElementById('emp_id').innerText = empData.uid || '-';
document.getElementById('emp_role_badge').innerText = empData.role || 'Employee';

// Logout Function
function logout() {
    localStorage.removeItem('staff_token');
    localStorage.removeItem('staff_data');
    window.location.href = 'index.html';
}

// ✅ 2. Load Salary Data from Firebase
const db = firebase.database();
const salaryTbody = document.getElementById('salary_list');

// User ki salary records fetch karein
db.ref('salary_records/' + empData.uid).on('value', (snapshot) => {
    const records = snapshot.val();
    
    if (!records) {
        salaryTbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #999;">No salary records found yet.</td></tr>';
        return;
    }

    salaryTbody.innerHTML = '';
    
    // Records ko date ke hisaab se sort karein (Latest first)
    const sortedMonths = Object.keys(records).sort((a, b) => b.localeCompare(a));

    sortedMonths.forEach(month => {
        const data = records[month];
        
        salaryTbody.innerHTML += `
            <tr>
                <td><strong>${month}</strong></td>
                <td>₹ ${(data.basic || 0).toLocaleString()}</td>
                <td>₹ ${(data.allowances || 0).toLocaleString()}</td>
                <td>₹ ${(data.deductions || 0).toLocaleString()}</td>
                <td><strong>₹ ${(data.netSalary || 0).toLocaleString()}</strong></td>
                <td><span style="background:#d1fae5; color:#10b981; padding:4px 8px; border-radius:4px; font-size:12px; font-weight:bold;">${data.status || 'Paid'}</span></td>
                <td>
                    <button onclick="downloadSlip('${month}')" style="background:#e0e7ff; color:#2563eb; border:none; padding:6px 10px; border-radius:6px; cursor:pointer; font-weight:bold;">
                        <i class="fas fa-download"></i> Slip
                    </button>
                </td>
            </tr>
        `;
    });
});

// ✅ 3. Dummy Slip Download Function (Hum isko aage upgrade karenge PDF ke liye)
function downloadSlip(month) {
    alert(`⏳ PDF Generation for ${month} is under development. It will be available soon!`);
}
