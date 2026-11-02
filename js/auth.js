document.getElementById('loginBtn').addEventListener('click', async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('error_msg');
    const btn = document.getElementById('loginBtn');

    if (!email || !password) {
        errorDiv.innerText = "Please enter email and password";
        errorDiv.style.display = 'block';
        return;
    }

    btn.innerText = "⏳ Logging in...";
    btn.disabled = true;
    errorDiv.style.display = 'none';

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Login failed');
        }

        // Save Token and Data
        localStorage.setItem('staff_token', data.token);
        localStorage.setItem('staff_data', JSON.stringify(data.user));

        // Redirect based on Role
        if (data.user.role === 'Admin' || data.user.role === 'Manager') {
            window.location.href = 'admin.html';
        } else {
            window.location.href = 'dashboard.html';
        }

    } catch (error) {
        errorDiv.innerText = error.message;
        errorDiv.style.display = 'block';
        btn.innerText = "Login";
        btn.disabled = false;
    }
});
