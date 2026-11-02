const token = localStorage.getItem('staff_token');
const adminData = JSON.parse(localStorage.getItem('staff_data') || '{}');

if (!token) {
    alert("❌ Access Denied! Please login first.");
    window.location.href = 'index.html';
}
if (adminData.role !== 'Admin') {
    alert("❌ Access Denied! Only Admin can view this page.");
    window.location.href = 'dashboard.html';
}

document.getElementById('admin_name').innerText = '👤 ' + (adminData.name || 'Admin');
const db = firebase.database();
let globalUsers = {}; // Store users globally for dropdowns

// 1. Fetch Users for List, Stats, & Dropdown
db.ref('users').on('value', (snapshot) => {
    const users = snapshot.val() || {};
    globalUsers = users;
    
    const tbody = document.getElementById('employee_list');
    const select = document.getElementById('sal_emp_id');
    tbody.innerHTML = '';
    select.innerHTML = '<option value="">Select Employee</option>';
    
    let total = 0, approved = 0, pending = 0;

    Object.keys(users).forEach(key => {
        const user = users[key];
        total++;
        if (user.status === 'approved') approved++;
        if (user.status === 'pending') pending++;

        // Populate Generate Salary Dropdown
        if (user.role === 'Employee') {
            select.innerHTML += `<option value="${key}">${user.name} (${user.empCode || 'No Code'})</option>`;
        }

        const statusBadge = user.status === 'approved' 
            ? '<span style="background:#d1fae5; color:#10b981; padding:4px 8px; border-radius:4px; font-size:12px; font-weight:bold;">Approved</span>'
            : '<span style="background:#fef3c7; color:#f59e0b; padding:4px 8px; border-radius:4px; font-size:12px; font-weight:bold;">Pending</span>';

        tbody.innerHTML += `
            <tr>
                <td>${user.empCode || '-'}</td>
                <td><strong>${user.name}</strong><br><small style="color:#64748b;">${user.designation || '-'}</small></td>
                <td>${user.email}</td>
                <td>${user.role}</td>
                <td>${statusBadge}</td>
                <td>
                    <button onclick="openEditModal('${key}')" style="background:#dbeafe; color:#2563eb; border:none; padding:6px 10px; border-radius:6px; cursor:pointer; margin-right:5px;">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteUser('${key}')" style="background:#fee2e2; color:#ef4444; border:none; padding:6px 10px; border-radius:6px; cursor:pointer;">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });

    document.getElementById('total_emp').innerText = total;
    document.getElementById('approved_emp').innerText = approved;
    document.getElementById('pending_emp').innerText = pending;
});

// 2. Add Employee
async function addEmployee() {
    const name = document.getElementById('emp_name').value;
    const email = document.getElementById('emp_email').value;
    const password = document.getElementById('emp_pass').value;
    const empCode = document.getElementById('emp_code').value;
    const designation = document.getElementById('emp_desig').value;
    const basicSalary = document.getElementById('emp_basic').value;
    const role = document.getElementById('emp_role').value;

    if (!name || !email || !password) return alert("⚠️ Name, Email and Password required.");

    try {
        const res = await fetch('/api/create-employee', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token 
            },
            body: JSON.stringify({ name, email, password, designation, basicSalary, role, empCode })
        });
        
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Failed to create employee');
        
        alert("✅ Employee Added Successfully");
        document.querySelectorAll('input').forEach(i => i.value = '');
    } catch (err) {
        alert("❌ Error: " + err.message);
    }
}

// 3. Generate Salary
async function generateSalary() {
    const uid = document.getElementById('sal_emp_id').value;
    const month = document.getElementById('sal_month').value;
    const allowance = parseFloat(document.getElementById('sal_allowance').value) || 0;
    const deduct = parseFloat(document.getElementById('sal_deduct').value) || 0;
    const status = document.getElementById('sal_status').value;

    if (!uid || !month) return alert("⚠️ Please select an employee and month.");

    const emp = globalUsers[uid];
    if(!emp) return alert("Employee not found in DB.");

    // Agar salary structure set hai toh basic wahan se uthayenge, warna default basicSalary
    const basic = (emp.salaryStructure && emp.salaryStructure.basic) ? emp.salaryStructure.basic : (emp.basicSalary || 0);
    const net = basic + allowance - deduct;

    try {
        await db.ref(`salary_records/${uid}/${month}`).set({
            month: month, 
            basic: basic, 
            allowances: allowance, 
            deductions: deduct, 
            netSalary: net, 
            status: status
        });
        
        alert("✅ Salary Record Generated Successfully!");
        document.getElementById('sal_allowance').value = '0';
        document.getElementById('sal_deduct').value = '0';
    } catch (err) {
        alert("❌ Firebase Error: " + err.message);
    }
}

// 4. Edit Modal (Salary Structure)
function openEditModal(uid) {
    const user = globalUsers[uid];
    if(!user) return;

    document.getElementById('edit_uid').value = uid;
    document.getElementById('edit_code').value = user.empCode || '';
    document.getElementById('edit_desig').value = user.designation || '';
    
    const struct = user.salaryStructure || {};
    document.getElementById('edit_basic').value = struct.basic || user.basicSalary || 0;
    document.getElementById('edit_hra').value = struct.hra || 0;
    document.getElementById('edit_conveyance').value = struct.conveyance || 0;
    document.getElementById('edit_special').value = struct.special || 0;
    document.getElementById('edit_pf').value = struct.pf || 0;
    document.getElementById('edit_esic').value = struct.esic || 0;

    document.getElementById('editModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('editModal').style.display = 'none';
}

// 5. Save Salary Structure
async function saveSalaryStructure() {
    const uid = document.getElementById('edit_uid').value;
    const empCode = document.getElementById('edit_code').value;
    const designation = document.getElementById('edit_desig').value;
    
    const basic = parseFloat(document.getElementById('edit_basic').value) || 0;
    const hra = parseFloat(document.getElementById('edit_hra').value) || 0;
    const conveyance = parseFloat(document.getElementById('edit_conveyance').value) || 0;
    const special = parseFloat(document.getElementById('edit_special').value) || 0;
    const pf = parseFloat(document.getElementById('edit_pf').value) || 0;
    const esic = parseFloat(document.getElementById('edit_esic').value) || 0;
    
    const netPay = basic + hra + conveyance + special - pf - esic;

    try {
        await db.ref('users/' + uid).update({
            empCode: empCode,
            designation: designation,
            salaryStructure: { basic, hra, conveyance, special, pf, esic, netPay }
        });
        alert("✅ Salary Structure Updated!");
        closeModal();
    } catch (err) {
        alert("❌ Error: " + err.message);
    }
}

// 6. Delete User
async function deleteUser(uid) {
    if (!confirm("Are you sure you want to delete this user permanently?")) return;
    try {
        await db.ref('users/' + uid).remove();
        alert("🗑️ User Deleted");
    } catch (err) {
        alert("❌ Error: " + err.message);
    }
}

// 7. Logout
function logout() {
    localStorage.removeItem('staff_token');
    localStorage.removeItem('staff_data');
    window.location.href = 'index.html';
}
