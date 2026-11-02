// Check if Admin is logged in
const token = localStorage.getItem('staff_token');
const adminData = JSON.parse(localStorage.getItem('staff_data') || '{}');

if (!token) {
    alert("❌ Access Denied! Please login first.");
    window.location.href = 'index.html';
}

// Check if role is Admin
if (adminData.role !== 'Admin') {
    alert("❌ Access Denied! Only Admin can view this page.");
    window.location.href = 'dashboard.html';
}

// Show Admin Name
document.getElementById('admin_name').innerText = '👤 ' + (adminData.name || 'Admin');

const db = firebase.database();

// 1. Fetch Users for List & Stats
db.ref('users').on('value', (snapshot) => {
    const users = snapshot.val() || {};
    const tbody = document.getElementById('employee_list');
    tbody.innerHTML = '';
    
    let total = 0;
    let approved = 0;
    let pending = 0;

    Object.keys(users).forEach(key => {
        const user = users[key];
        total++;
        
        if (user.status === 'approved') approved++;
        if (user.status === 'pending') pending++;

        const statusBadge = user.status === 'approved' 
            ? '<span style="background:#d1fae5; color:#10b981; padding:4px 8px; border-radius:4px; font-size:12px; font-weight:bold;">Approved</span>'
            : '<span style="background:#fef3c7; color:#f59e0b; padding:4px 8px; border-radius:4px; font-size:12px; font-weight:bold;">Pending</span>';

        tbody.innerHTML += `
            <tr>
                <td><strong>${user.name}</strong><br><small style="color:#64748b;">${user.designation || '-'}</small></td>
                <td>${user.email}</td>
                <td>${user.role}</td>
                <td>${statusBadge}</td>
                <td>
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

// 2. Add Employee Function (Calls Backend API)
async function addEmployee() {
    const name = document.getElementById('emp_name').value;
    const email = document.getElementById('emp_email').value;
    const password = document.getElementById('emp_pass').value;
    const designation = document.getElementById('emp_desig').value;
    const basicSalary = document.getElementById('emp_basic').value;
    const role = document.getElementById('emp_role').value;

    if (!name || !email || !password) {
        return alert("⚠️ Name, Email and Password are required.");
    }

    try {
        const res = await fetch('/api/create-employee', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token 
            },
            body: JSON.stringify({ name, email, password, designation, basicSalary, role })
        });
        
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Failed to create employee');
        
        alert("✅ Employee Added Successfully");
        
        // Clear inputs
        document.getElementById('emp_name').value = '';
        document.getElementById('emp_email').value = '';
        document.getElementById('emp_pass').value = '';
        document.getElementById('emp_desig').value = '';
        document.getElementById('emp_basic').value = '';
    } catch (err) {
        alert("❌ Error: " + err.message);
    }
}

// 3. Delete User Function
async function deleteUser(uid) {
    if (!confirm("Are you sure you want to delete this user permanently?")) return;
    
    try {
        await db.ref('users/' + uid).remove();
        alert("🗑️ User Deleted");
    } catch (err) {
        alert("❌ Error: " + err.message);
    }
}

// 4. Logout
function logout() {
    localStorage.removeItem('staff_token');
    localStorage.removeItem('staff_data');
    window.location.href = 'index.html';
}
