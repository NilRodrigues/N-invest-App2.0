import {
  onAuthStateChanged,
  signOut,
  sendEmailVerification,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { auth } from "./firebase.js";

export function setMsg(el, text = "", type = "error") {
  if (!el) return;
  el.textContent = text;
  el.style.display = text ? "block" : "none";
  el.dataset.type = type; // se quiser estilizar depois
}

export function setupTogglePassword(btn, input) {
  if (!btn || !input) return;
  btn.addEventListener("click", () => {
    const isPass = input.type === "password";
    input.type = isPass ? "text" : "password";
    btn.setAttribute("aria-label", isPass ? "Ocultar senha" : "Mostrar senha");
    const icon = btn.querySelector("i");
    if (icon) icon.className = isPass ? "fas fa-eye-slash" : "fas fa-eye";
  });
}

export async function ensureVerifiedOrKick(user, { onNotVerified } = {}) {
  await user.reload();
  if (user.emailVerified) return true;

  await signOut(auth);
  onNotVerified?.();
  return false;
}

export async function resendVerificationForCurrentUser() {
  const user = auth.currentUser;
  if (!user) throw new Error("NO_USER");
  await sendEmailVerification(user, { url: `${window.location.origin}/login.html` });
}

export function protectAppPage() {
  // Usar em app.html: se não estiver logado/verificado, manda pro login
  return new Promise((resolve) => {
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        window.location.replace("./login.html");
        return;
      }
      await user.reload();
      if (!user.emailVerified) {
        await signOut(auth);
        window.location.replace("./login.html?msg=verify");
        return;
      }
      resolve(user);
    });
  });
}
