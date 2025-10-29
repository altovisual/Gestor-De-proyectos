/**
 * Servicio de autenticación con Google OAuth2
 * Maneja la autenticación y obtención de tokens para acceder a Google Calendar y Gmail
 */

const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly'
];

class GoogleAuthService {
  constructor() {
    this.accessToken = null;
    this.refreshToken = null;
    this.expiresAt = null;
  }

  /**
   * Inicializa el cliente de Google OAuth2
   */
  async initClient() {
    try {
      // Cargar el script de Google Identity Services
      if (!window.google) {
        await this.loadGoogleScript();
      }

      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        scope: SCOPES.join(' '),
        callback: (response) => {
          if (response.access_token) {
            this.accessToken = response.access_token;
            this.expiresAt = Date.now() + (response.expires_in * 1000);
            this.saveTokens();
          }
        },
      });

      return client;
    } catch (error) {
      console.error('Error inicializando cliente de Google:', error);
      throw error;
    }
  }

  /**
   * Carga el script de Google Identity Services
   */
  loadGoogleScript() {
    return new Promise((resolve, reject) => {
      if (document.getElementById('google-identity-script')) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.id = 'google-identity-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  /**
   * Solicita autorización al usuario
   */
  async authorize() {
    try {
      const client = await this.initClient();
      client.requestAccessToken();
    } catch (error) {
      console.error('Error en autorización:', error);
      throw error;
    }
  }

  /**
   * Verifica si el usuario está autenticado
   */
  isAuthenticated() {
    if (!this.accessToken || !this.expiresAt) {
      this.loadTokens();
    }
    return this.accessToken && this.expiresAt > Date.now();
  }

  /**
   * Obtiene el token de acceso actual
   */
  getAccessToken() {
    if (!this.isAuthenticated()) {
      return null;
    }
    return this.accessToken;
  }

  /**
   * Guarda los tokens en localStorage
   */
  saveTokens() {
    localStorage.setItem('google_access_token', this.accessToken);
    localStorage.setItem('google_token_expires_at', this.expiresAt.toString());
  }

  /**
   * Carga los tokens desde localStorage
   */
  loadTokens() {
    this.accessToken = localStorage.getItem('google_access_token');
    const expiresAt = localStorage.getItem('google_token_expires_at');
    this.expiresAt = expiresAt ? parseInt(expiresAt) : null;
  }

  /**
   * Obtiene el perfil del usuario autenticado
   */
  async getUserProfile() {
    if (!this.isAuthenticated()) {
      return null;
    }

    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Error obteniendo perfil de usuario');
      }

      const profile = await response.json();
      // Guardar email en localStorage
      if (profile.email) {
        localStorage.setItem('google_user_email', profile.email);
      }
      return profile;
    } catch (error) {
      console.error('Error obteniendo perfil:', error);
      return null;
    }
  }

  /**
   * Cierra la sesión y limpia los tokens
   */
  signOut() {
    this.accessToken = null;
    this.refreshToken = null;
    this.expiresAt = null;
    localStorage.removeItem('google_access_token');
    localStorage.removeItem('google_token_expires_at');
    localStorage.removeItem('google_user_email');
  }
}

export const googleAuthService = new GoogleAuthService();
