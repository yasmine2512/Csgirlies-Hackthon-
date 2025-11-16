// console.log("Auth page loaded ✔");

// const SAMPLE_USERS = [
//   { username: "TESTUSER", password: "1234" }
// ];


// const usernameInput = document.getElementById("username");
// const passwordInput = document.getElementById("password");
// const loginBtn = document.getElementById("login-btn");
// const registerBtn = document.getElementById("register-btn");
// const authError = document.getElementById("auth-error");

// // clear error messages
// function clearError() {
//   authError.textContent = "";
// }

// //register 
// registerBtn.addEventListener("click", () => {
//   clearError();
//   const username = usernameInput.value.trim();
//   const password = passwordInput.value.trim();

//   if (!username || !password) {
//     authError.textContent = "Enter username and password.";
//     return;
//   }

//   let users = JSON.parse(localStorage.getItem("users")) || [];

//   if (users.find(u => u.username === username)) {
//     authError.textContent = "Username already exists!";
//     return;
//   }

//   users.push({ username, password });
//   localStorage.setItem("users", JSON.stringify(users));

//   alert("Registration successful! You can now login.");
//   usernameInput.value = "";
//   passwordInput.value = "";
// });

// //login 
// loginBtn.addEventListener("click", () => {
//   clearError();
//   const username = usernameInput.value.trim();
//   const password = passwordInput.value.trim();

//   let users = JSON.parse(localStorage.getItem("users")) || [];
//   const user = users.find(u => u.username === username && u.password === password);

//   if (!user) {
//     authError.textContent = "Invalid username or password!";
//     return;
//   }

//   localStorage.setItem("currentUser", JSON.stringify(user));
//   document.addEventListener("DOMContentLoaded", () => {
//     const currentUser = JSON.parse(localStorage.getItem("currentUser"));
//     if (currentUser) {
//         // console.log("logged in as:", currentUser.username);
//         window.location.href = "practise.html";
//     }
// });
//   window.location.href = "practise.html";
// });

console.log("Auth page loaded ✔");

// API BASE URL
const API_URL = "http://localhost:5000/auth";

const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("login-btn");
const registerBtn = document.getElementById("register-btn");
const authError = document.getElementById("auth-error");

// Clear error messages
function clearError() {
  authError.textContent = "";
}

// ------------------------ REGISTER ------------------------
registerBtn.addEventListener("click", async () => {
  clearError();
  const name = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  if (!name || !password) {
    authError.textContent = "Enter username and password.";
    return;
  }

  try {
    const res = await fetch(`${API_URL}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, password })
    });

    const data = await res.json();

    if (!res.ok) {
      authError.textContent = data.error || "Registration failed";
      return;
    }

    alert("Registration successful! You can now login.");
    usernameInput.value = "";
    passwordInput.value = "";
  } catch (err) {
    console.error(err);
    authError.textContent = "Server error. Try again.";
  }
});

// ------------------------ LOGIN ------------------------
loginBtn.addEventListener("click", async () => {
  clearError();
  const name = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  if (!name || !password) {
    authError.textContent = "Enter username and password.";
    return;
  }

  try {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, password })
    });

    const data = await res.json();
    const userId = data.user.id;
    if (!res.ok) {
      authError.textContent = data.error || "Login failed";
      return;
    }

   window.location.href = `practise.html?userId=${userId}`;

  } catch (err) {
    console.error(err);
    authError.textContent = "Server error. Try again.";
  }
});
