// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCIWQj15HFfvoOk2oHrJE1mY-JH5tzYkYU",
  authDomain: "nilinvest-1176c.firebaseapp.com",
  projectId: "nilinvest-1176c",
  storageBucket: "nilinvest-1176c.firebasestorage.app",
  messagingSenderId: "127711268658",
  appId: "1:127711268658:web:4bd1c01fcc09609342512b",
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Exporta os serviços
export const auth = getAuth(app);
export const db = getFirestore(app);