// signup.js - VERSÃO COM VERIFICAÇÃO POR EMAIL (CORRIGIDA)
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
  sendEmailVerification,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { auth } from "./firebase.js";

// Elementos do DOM
const signupForm = document.getElementById("signupForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirmPassword");
const togglePasswordBtn = document.getElementById("togglePassword");
const toggleConfirmPasswordBtn = document.getElementById("toggleConfirmPassword");
const googleSignupBtn = document.getElementById("googleSignup");
const errorMessage = document.getElementById("errorMessage");

// Toggle de visualização de senha
togglePasswordBtn?.addEventListener("click", () => {
  const type = passwordInput.type === "password" ? "text" : "password";
  passwordInput.type = type;

  const icon = togglePasswordBtn.querySelector("i");
  if (icon) icon.className = type === "password" ? "fas fa-eye" : "fas fa-eye-slash";
});

toggleConfirmPasswordBtn?.addEventListener("click", () => {
  const type = confirmPasswordInput.type === "password" ? "text" : "password";
  confirmPasswordInput.type = type;

  const icon = toggleConfirmPasswordBtn.querySelector("i");
  if (icon) icon.className = type === "password" ? "fas fa-eye" : "fas fa-eye-slash";
});

// Função para mostrar erro/sucesso
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

  // Se for mensagem de sucesso, mantém visível indefinidamente
  if (type !== "success") {
    setTimeout(() => {
      errorMessage.classList.remove("show");
    }, 5000);
  }
}

// Função para limpar erro
function clearError() {
  errorMessage.textContent = "";
  errorMessage.classList.remove("show");
  errorMessage.style.display = "none";
}

// Função para validar email
function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Função para tratar erros do Firebase
function handleFirebaseError(error) {
  const code = error?.code || "";

  switch (true) {
    case code.includes("email-already-in-use"):
      return "⚠️ Este email já está em uso. Tente fazer login ou recuperar sua senha.";

    case code.includes("invalid-email"):
      return "⚠️ Email inválido.";

    case code.includes("weak-password"):
      return "⚠️ Senha muito fraca. Use pelo menos 6 caracteres.";

    case code.includes("network-request-failed"):
      return "⚠️ Erro de conexão. Verifique sua internet.";

    case code.includes("operation-not-allowed"):
      return "⚠️ Cadastro por email está desabilitado. Contate o suporte.";

    case code.includes("unauthorized-continue-uri"):
      return "⚠️ Domínio não autorizado no Firebase (Authentication → Settings → Authorized domains).";

    case code.includes("invalid-continue-uri"):
      return "⚠️ URL de verificação inválida. Verifique a configuração do link de verificação.";

    default:
      console.error("Firebase error:", error?.code, error?.message, error);
      return "⚠️ Erro ao criar conta. Tente novamente.";
  }
}

// Função para obter a URL correta do link de verificação
function getVerifyUrl() {
  // Em dev (Live Server / portas), use um domínio do Firebase Hosting (já autorizado)
  // e redirecione para sua página de login.
  const isDev =
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1" ||
    location.hostname.endsWith(".local");

  if (isDev) {
    // Troque "nilinvest-1176c" pelo SEU projectId se for diferente
    const hostingBase = "https://nilinvest-1176c.web.app";
    return `${hostingBase}/login.html?verified=true`;
  }

  // Em produção, pode usar o próprio domínio atual
  return `${location.origin}/login.html?verified=true`;
}

// Função para enviar email de verificação
async function sendVerificationEmail(user) {
  const actionCodeSettings = {
    url: getVerifyUrl(),
    handleCodeInApp: false, // ✅ web padrão (não requer handler do link)
  };

  try {
    await sendEmailVerification(user, actionCodeSettings);
    return true;
  } catch (error) {
    console.error("sendEmailVerification error:", error?.code, error?.message, error);
    return false;
  }
}

// Cadastro com email e senha
signupForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearError();

  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const confirmPassword = confirmPasswordInput.value;

  // Validações
  if (!email || !password || !confirmPassword) {
    showError("⚠️ Preencha todos os campos.");
    return;
  }

  if (!isValidEmail(email)) {
    showError("⚠️ Informe um email válido.");
    return;
  }

  if (password.length < 6) {
    showError("⚠️ A senha deve ter no mínimo 6 caracteres.");
    return;
  }

  if (password !== confirmPassword) {
    showError("⚠️ As senhas não coincidem.");
    return;
  }

  // Desabilita botão durante o processamento
  const submitBtn = signupForm.querySelector(".btn-auth-submit");
  const originalText = submitBtn?.innerHTML || "";
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML =
      '<span class="btn-text">Criando conta...</span><i class="fas fa-spinner fa-spin"></i>';
  }

  let user = null;

  try {
    // Cria usuário
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    user = userCredential.user;

    // Atualiza perfil com nome do usuário (pega do email)
    const displayName = email.split("@")[0];
    await updateProfile(user, { displayName });

    // ENVIA EMAIL DE VERIFICAÇÃO
    const emailSent = await sendVerificationEmail(user);

    if (emailSent) {
      showError(
        `✅ Conta criada com sucesso!\n\nEnviamos um email de verificação para:\n${email}\n\nPor favor, verifique sua caixa de entrada e clique no link para ativar sua conta.`,
        "success"
      );

      // Limpa o formulário após 2 segundos
      setTimeout(() => {
        emailInput.value = "";
        passwordInput.value = "";
        confirmPasswordInput.value = "";
      }, 2000);

      // Redireciona para login após 8 segundos
      setTimeout(() => {
        window.location.href = "login.html?verify=true";
      }, 8000);
    } else {
      showError(
        "⚠️ Conta criada, mas houve um erro ao enviar o email de verificação. Você pode solicitar o reenvio na página de login."
      );

      // Redireciona para login
      setTimeout(() => {
        window.location.href = "login.html";
      }, 5000);
    }
  } catch (error) {
    showError(handleFirebaseError(error));
  } finally {
    // Restaura botão
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  }
});

// Cadastro com Google (já vem verificado automaticamente)
googleSignupBtn?.addEventListener("click", async () => {
  clearError();

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  try {
    await signInWithPopup(auth, provider);
    window.location.href = "app.html";
  } catch (error) {
    // Se usuário cancelar, não mostra erro
    if (
      error.code === "auth/popup-closed-by-user" ||
      error.code === "auth/cancelled-popup-request"
    ) {
      return;
    }

    showError(handleFirebaseError(error));
  }
});
