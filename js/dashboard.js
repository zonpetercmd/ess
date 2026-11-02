// ✅ 1. Check Authentication
const token = localStorage.getItem('staff_token');
const staffDataStr = localStorage.getItem('staff_data');

if (!token || !staffDataStr) {
    window.location.href = 'index.html';
}

const empData = JSON.parse(staffDataStr);
const db = firebase.database();

// Initialize UI
document.getElementById('emp_name').innerText = '👤 ' + (empData.name || 'Employee');
document.getElementById('welcome_name').innerText = empData.name || 'Employee';
document.getElementById('emp_desig').innerText = empData.designation || '-';
document.getElementById('emp_code').innerText = empData.empCode || 'Not Set';
document.getElementById('emp_role_badge').innerText = empData.role || 'Employee';

// Profile Tab Data
document.getElementById('p_name').innerText = empData.name || '-';
document.getElementById('p_email').innerText = empData.email || '-';
document.getElementById('p_desig').innerText = empData.designation || '-';
document.getElementById('p_code').innerText = empData.empCode || '-';
document.getElementById('p_doj').innerText = empData.doj || 'Not Set';

// Set default attendance month to current month
const today = new Date();
document.getElementById('att_month_filter').value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

// Logout
function logout() {
    localStorage.removeItem('staff_token');
    localStorage.removeItem('staff_data');
    window.location.href = 'index.html';
}

// Tab Switching Logic
function switchTab(tabId, btn) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));
    
    document.getElementById('tab-' + tabId).classList.add('active');
    btn.classList.add('active');

    if (tabId === 'attendance') loadAttendance();
}

// ✅ 2. Load Salary Structure (From User Profile)
// *Note: Admin panel se ye data set karna hoga*
const structure = empData.salaryStructure;
const structDiv = document.getElementById('salary_structure');
if (structure) {
    structDiv.innerHTML = `
        <div class="structure-row"><span>Basic Pay</span><span>₹ ${(structure.basic || 0).toLocaleString()}</span></div>
        <div class="structure-row"><span>HRA</span><span>₹ ${(structure.hra || 0).toLocaleString()}</span></div>
        <div class="structure-row"><span>Conveyance</span><span>₹ ${(structure.conveyance || 0).toLocaleString()}</span></div>
        <div class="structure-row"><span>Special Allowance</span><span>₹ ${(structure.special || 0).toLocaleString()}</span></div>
        <div class="structure-row" style="color:#ef4444;"><span>PF Deduction</span><span>- ₹ ${(structure.pf || 0).toLocaleString()}</span></div>
        <div class="structure-row" style="color:#ef4444;"><span>ESIC Deduction</span><span>- ₹ ${(structure.esic || 0).toLocaleString()}</span></div>
        <div class="structure-row"><span>Net Monthly Pay</span><span>₹ ${(structure.netPay || 0).toLocaleString()}</span></div>
    `;
} else {
    structDiv.innerHTML = '<p style="color:#999;">Salary structure not configured by Admin.</p>';
}

// ✅ 3. Load Salary History
const salaryTbody = document.getElementById('salary_list');
db.ref('salary_records/' + empData.uid).on('value', (snapshot) => {
    const records = snapshot.val();
    if (!records) {
        salaryTbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #999;">No salary records found.</td></tr>';
        return;
    }

    salaryTbody.innerHTML = '';
    const sortedMonths = Object.keys(records).sort((a, b) => b.localeCompare(a));
    let lastPaid = "Pending";

    sortedMonths.forEach(month => {
        const data = records[month];
        if(data.status === 'Paid' && lastPaid === "Pending") {
            lastPaid = `₹ ${(data.netSalary || 0).toLocaleString()} (${month})`;
        }

        const statusBadge = data.status === 'Paid' 
            ? '<span style="background:#d1fae5; color:#10b981; padding:4px 8px; border-radius:4px; font-size:12px; font-weight:bold;">Credited</span>'
            : '<span style="background:#fef3c7; color:#f59e0b; padding:4px 8px; border-radius:4px; font-size:12px; font-weight:bold;">Pending</span>';

        salaryTbody.innerHTML += `
            <tr>
                <td><strong>${month}</strong></td>
                <td><strong>₹ ${(data.netSalary || 0).toLocaleString()}</strong></td>
                <td>${statusBadge}</td>
                <td>
                    <button onclick="downloadSlip('${month}')" style="background:#e0e7ff; color:#2563eb; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-weight:bold;">
                        <i class="fas fa-download"></i> Slip
                    </button>
                </td>
            </tr>
        `;
    });
    
    document.getElementById('last_salary').innerText = lastPaid;
});

// ✅ 4. Load Attendance
function loadAttendance() {
    const month = document.getElementById('att_month_filter').value; // Format: YYYY-MM
    const grid = document.getElementById('attendance_grid');
    
    if (!month) {
        grid.innerHTML = '<p style="color:#999; grid-column: 1/-1;">Please select a month.</p>';
        return;
    }
    
    grid.innerHTML = '<p style="color:#999; grid-column: 1/-1;">Loading...</p>';

    db.ref(`attendance/${empData.uid}/${month}`).once('value', (snapshot) => {
        const data = snapshot.val();
        if (!data) {
            grid.innerHTML = '<p style="color:#999; grid-column: 1/-1;">No attendance marked for this month.</p>';
            return;
        }

        grid.innerHTML = '';
        // Data format: { "01": "Present", "02": "Absent", "03": "Leave" }
        Object.keys(data).sort().forEach(day => {
            const status = data[day];
            let className = 'att-box';
            if (status === 'Present') className += ' att-present';
            else if (status === 'Absent') className += ' att-absent';
            else if (status === 'Leave') className += ' att-leave';

            grid.innerHTML += `
                <div class="${className}">
                    <div style="font-size:10px; margin-bottom:2px;">Day ${day}</div>
                    <div>${status.charAt(0)}</div>
                </div>
            `;
        });
    });
}

// ✅ 5. Download Salary Slip (PDF Generation)
function downloadSlip(month) {
    db.ref(`salary_records/${empData.uid}/${month}`).once('value', (snapshot) => {
        const data = snapshot.val();
        if (!data) return alert("Record not found");

        // Create a hidden div for PDF
        const element = document.createElement('div');
        element.style.padding = '40px';
        element.style.fontFamily = 'Arial, sans-serif';
        element.style.color = '#000';
        element.style.background = '#fff';
        
        element.innerHTML = `
            <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 20px;">
                <h1 style="margin: 0; color: #111827;">DEV Vidyalaya</h1>
                <p style="margin: 5px 0;">Salary Slip for the month of ${month}</p>
            </div>
            
            <table style="width: 100%; margin-bottom: 20px;">
                <tr>
                    <td><strong>Employee Name:</strong> ${empData.name}</td>
                    <td><strong>Employee Code:</strong> ${empData.empCode || 'N/A'}</td>
                </tr>
                <tr>
                    <td><strong>Designation:</strong> ${empData.designation || 'N/A'}</td>
                    <td><strong>Status:</strong> ${data.status}</td>
                </tr>
            </table>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <tr style="background: #f1f5f9;">
                    <th style="border: 1px solid #ccc; padding: 10px; text-align: left;">Earnings</th>
                    <th style="border: 1px solid #ccc; padding: 10px; text-align: right;">Amount (₹)</th>
                    <th style="border: 1px solid #ccc; padding: 10px; text-align: left;">Deductions</th>
                    <th style="border: 1px solid #ccc; padding: 10px; text-align: right;">Amount (₹)</th>
                </tr>
                <tr>
                    <td style="border: 1px solid #ccc; padding: 10px;">Basic Salary</td>
                    <td style="border: 1px solid #ccc; padding: 10px; text-align: right;">${(data.basic || 0).toLocaleString()}</td>
                    <td style="border: 1px solid #ccc; padding: 10px;">Deductions</td>
                    <td style="border: 1px solid #ccc; padding: 10px; text-align: right;">${(data.deductions || 0).toLocaleString()}</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #ccc; padding: 10px;">Allowances</td>
                    <td style="border: 1px solid #ccc; padding: 10px; text-align: right;">${(data.allowances || 0).toLocaleString()}</td>
                    <td style="border: 1px solid #ccc; padding: 10px;"></td>
                    <td style="border: 1px solid #ccc; padding: 10px;"></td>
                </tr>
                <tr style="font-weight: bold; background: #f8fafc;">
                    <td style="border: 1px solid #ccc; padding: 10px;">Total Earnings</td>
                    <td style="border: 1px solid #ccc; padding: 10px; text-align: right;">${(data.basic + data.allowances).toLocaleString()}</td>
                    <td style="border: 1px solid #ccc; padding: 10px;">Total Deductions</td>
                    <td style="border: 1px solid #ccc; padding: 10px; text-align: right;">${(data.deductions || 0).toLocaleString()}</td>
                </tr>
            </table>

            <div style="text-align: right; margin-top: 30px; font-size: 18px;">
                <strong>Net Salary Paid: ₹ ${(data.netSalary || 0).toLocaleString()}</strong>
            </div>
            
            <div style="margin-top: 50px; font-size: 12px; color: #666; text-align: center;">
                This is a computer-generated document. No signature is required.
            </div>
        `;

        // PDF Generation Options
        const opt = {
            margin:       10,
            filename:     `Salary_Slip_${month}_${empData.name}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2 },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        // Generate and Save
        html2pdf().set(opt).from(element).save();
    });
}
