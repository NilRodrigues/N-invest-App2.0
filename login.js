// login.js - VERSÃO COM VERIFICAÇÃO DE EMAIL
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendEmailVerification, // ADICIONE ESTA IMPORT
  sendPasswordResetEmail // ADICIONE ESTA IMPORT (opcional)
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { auth } from "./firebase.js";

// Elementos do DOM
const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const togglePasswordBtn = document.getElementById("togglePassword");
const googleLoginBtn = document.getElementById("googleLogin");
const errorMessage = document.getElementById("errorMessage");

// Adicione este elemento ao HTML do login.html se quiser botão de reenvio
// <button id="resendVerification" class="btn-resend" style="display:none;">Reenviar email de verificação</button>

// Toggle de visualização de senha
togglePasswordBtn?.addEventListener("click", () => {
  const type = passwordInput.type === "password" ? "text" : "password";
  passwordInput.type = type;
  
  const icon = togglePasswordBtn.querySelector("i");
  icon.className = type === "password" ? "fas fa-eye" : "fas fa-eye-slash";
});

// Função para mostrar erro
function showError(message, type = "error") {
  errorMessage.textContent = message;
  errorMessage.classList.add("show");
  errorMessage.style.display = "block";
  
  if (type === "success") {
    errorMessage.style.background = "rgba(16, 185, 129, 0.1)";
    errorMessage.style.borderColor = "rgba(16, 185, 129, 0.3)";
    errorMessage.style.color = "var(--secondary)";
  } else {
    errorMessage.style.background = "";
    errorMessage.style.borderColor = "";
    errorMessage.style.color = "";
  }
  
  setTimeout(() => {
    errorMessage.classList.remove("show");
  }, type === "success" ? 8000 : 5000);
}

// Função para limpar erro
function clearError() {
  errorMessage.textContent = "";
  errorMessage.classList.remove("show");
  errorMessage.style.display = "none";
}

// Função para tratar erros do Firebase
function handleFirebaseError(error) {
  const code = error?.code || "";
  
  switch (true) {
    case code.includes("invalid-credential"):
    case code.includes("wrong-password"):
    case code.includes("user-not-found"):
      return "⚠️ Email ou senha incorretos.";
    
    case code.includes("invalid-email"):
      return "⚠️ Email inválido.";
    
    case code.includes("too-many-requests"):
      return "⚠️ Muitas tentativas. Tente novamente mais tarde.";
    
    case code.includes("network-request-failed"):
      return "⚠️ Erro de conexão. Verifique sua internet.";
    
    case code.includes("user-disabled"):
      return "⚠️ Esta conta foi desativada.";
    
    case code.includes("email-not-verified"):
      return "⚠️ Email não verificado.";
    
    default:
      console.error("Firebase error:", error);
      return "⚠️ Erro ao fazer login. Tente novamente.";
  }
}

// Função para reenviar email de verificação
async function resendVerification(email) {
  try {
    // Primeiro tenta fazer login para pegar o usuário atual
    const userCredential = await signInWithEmailAndPassword(auth, email, passwordInput.value);
    const user = userCredential.user;
    
    // Envia email de verificação
    await sendEmailVerification(user, {
      url: window.location.origin + '/login.html?verified=true'
    });
    
    // Faz logout para forçar nova verificação
    await auth.signOut();
    
    showError(`✅ Email de verificação reenviado para:\n${email}\n\nVerifique sua caixa de entrada.`, "success");
    
  } catch (error) {
    showError("⚠️ Erro ao reenviar email de verificação. Tente criar uma nova conta.");
  }
}

// Login com email e senha
loginForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearError();
  
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  
  // Validações
  if (!email || !password) {
    showError("⚠️ Preencha email e senha.");
    return;
  }
  
  if (password.length < 6) {
    showError("⚠️ A senha deve ter no mínimo 6 caracteres.");
    return;
  }
  
  // Desabilita botão durante o processamento
  const submitBtn = loginForm.querySelector(".btn-auth-submit");
  const originalText = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="btn-text">Entrando...</span><i class="fas fa-spinner fa-spin"></i>';
  
  try {
    // Faz login
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // VERIFICA SE O EMAIL ESTÁ CONFIRMADO
    if (!user.emailVerified) {
      // Se não estiver verificado, mostra mensagem e oferece reenviar
      await auth.signOut(); // Faz logout
      
      const resendBtn = document.getElementById("resendVerification");
      if (resendBtn) {
        resendBtn.style.display = "block";
        resendBtn.onclick = () => resendVerification(email);
      }
      
      showError(`⚠️ Email não verificado!\n\nEnviamos um email de verificação para:\n${email}\n\nVerifique sua caixa de entrada e clique no link para ativar sua conta.\n\nSe não recebeu, clique em "Reenviar email de verificação".`);
      
      // Restaura botão
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
      return;
    }
    
    // Se estiver verificado, redireciona para o app
    window.location.href = "app.html";
    
  } catch (error) {
    showError(handleFirebaseError(error));
    
    // Restaura botão
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
});

// Login com Google
googleLoginBtn?.addEventListener("click", async () => {
  clearError();
  
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: 'select_account'
  });
  
  try {
    await signInWithPopup(auth, provider);
    
    // Redireciona para o app
    window.location.href = "app.html";
    
  } catch (error) {
    // Se usuário cancelar, não mostra erro
    if (error.code === 'auth/popup-closed-by-user' || 
        error.code === 'auth/cancelled-popup-request') {
      return;
    }
    
    showError(handleFirebaseError(error));
  }
});

// Verifica se veio da página de cadastro com parâmetro de verificação
window.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const verifyParam = urlParams.get('verify');
  const verifiedParam = urlParams.get('verified');
  
  if (verifyParam === 'true') {
    showError("✅ Por favor, verifique seu email para ativar sua conta.\n\nClique no link que enviamos para seu email.", "success");
  }
  
  if (verifiedParam === 'true') {
    showError("✅ Email verificado com sucesso!\n\nAgora você pode fazer login.", "success");
  }
});