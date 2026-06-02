import { auth } from "./auth.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
}
from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

const email = document.getElementById("email");
const password = document.getElementById("password");

const signupBtn = document.getElementById("signup-btn");
const loginBtn = document.getElementById("login-btn");

const message = document.getElementById("message");


// CREATE ACCOUNT

signupBtn.addEventListener("click", async () => {

    try {

        await createUserWithEmailAndPassword(
            auth,
            email.value,
            password.value
        );

        message.textContent =
        "✅ Account created successfully";

    }
    catch(error){

        message.textContent =
        error.message;
    }

});


// LOGIN

loginBtn.addEventListener("click", async () => {

    try {

        await signInWithEmailAndPassword(
            auth,
            email.value,
            password.value
        );

        message.textContent =
        "✅ Login successful";

        window.location.href =
        "index.html";

    }
    catch(error){

        message.textContent =
        error.message;
    }

});
