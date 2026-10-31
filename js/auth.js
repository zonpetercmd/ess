document.getElementById('loginBtn').addEventListener('click', async () => {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const errorDiv = document.getElementById('error_msg');
    const btn = document.getElementById('loginBtn');

    // Clear previous errors
    errorDiv.style.display = 'none';
    errorDiv.innerText = '';

    // Validation
    if (!email || !password) {
        errorDiv.innerText = "Please enter both email and password";
        errorDiv.style.display = 'block';
        return;
    }

    try {
        // Loading state
        btn.innerText = "Logging in...";
        btn.disabled = true;
        btn.style.opacity = '0.7';

        // API Call
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Login failed. Please check your credentials.');
        }

        // Save User Data & Token securely
        localStorage.setItem('staff_token', data.token);
        localStorage.setItem('staff_user', JSON.stringify(data.user));

        // Success state
        btn.innerText = "✅ Login Successful!";
        btn.style.background = "#10b981"; // Green color

        // Redirect to Dashboard after 0.5 seconds
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 500);

    } catch (err) {
        // Error state
        errorDiv.innerText = err.message;
        errorDiv.style.display = 'block';
        btn.innerText = "Login";
        btn.disabled = false;
        btn.style.opacity = '1';
    }
});

// Enter key dabane par bhi login ho jaye
document.getElementById('password').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        document.getElementById('loginBtn').click();
    }
});
