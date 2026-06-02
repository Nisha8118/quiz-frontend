import { initializeApp }
from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import { getAuth }
from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBRTtEqD0evikzO3Tc3ZnEIc0xugq2BCxY",
  authDomain: "adaptive-ai-quiz.firebaseapp.com",
  projectId: "adaptive-ai-quiz",
  storageBucket: "adaptive-ai-quiz.firebasestorage.app",
  messagingSenderId: "1022291006158",
  appId: "1:1022291006158:web:392e34f04cdbfade13f69f",
  measurementId: "G-9WPXQLP7TC"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

export { auth };
