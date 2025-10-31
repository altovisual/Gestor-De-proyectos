/**
 * Sistema de logging seguro para proteger datos sensibles en producción
 */

const isDevelopment = import.meta.env.DEV;

class SecureLogger {
  /**
   * Enmascara datos sensibles para producción
   */
  maskSensitiveData(data) {
    if (isDevelopment) {
      return data; // En desarrollo, mostrar todo
    }

    // En producción, enmascarar datos sensibles
    if (typeof data === 'string') {
      // Enmascarar emails
      if (data.includes('@')) {
        const [user, domain] = data.split('@');
        return `${user.substring(0, 2)}***@${domain}`;
      }
      // Enmascarar IDs largos
      if (data.length > 10 && /^\d+$/.test(data)) {
        return `${data.substring(0, 4)}***${data.substring(data.length - 4)}`;
      }
    }

    if (typeof data === 'object' && data !== null) {
      const masked = { ...data };
      
      // Enmascarar campos sensibles
      const sensitiveFields = ['email', 'correo', 'token', 'accessToken', 'refreshToken', 'password'];
      
      for (const field of sensitiveFields) {
        if (masked[field]) {
          if (field.includes('token') || field.includes('password')) {
            masked[field] = '***HIDDEN***';
          } else if (field.includes('email') || field.includes('correo')) {
            masked[field] = this.maskSensitiveData(masked[field]);
          }
        }
      }

      return masked;
    }

    return data;
  }

  /**
   * Log seguro para información general
   */
  info(message, data = null) {
    if (data) {
      console.log(message, this.maskSensitiveData(data));
    } else {
      console.log(message);
    }
  }

  /**
   * Log seguro para errores
   */
  error(message, error = null) {
    if (error) {
      // En producción, no mostrar stack traces completos
      const errorInfo = isDevelopment ? error : {
        message: error.message,
        name: error.name
      };
      console.error(message, errorInfo);
    } else {
      console.error(message);
    }
  }

  /**
   * Log seguro para warnings
   */
  warn(message, data = null) {
    if (data) {
      console.warn(message, this.maskSensitiveData(data));
    } else {
      console.warn(message);
    }
  }

  /**
   * Log seguro para debugging (solo en desarrollo)
   */
  debug(message, data = null) {
    if (isDevelopment) {
      if (data) {
        console.log(`🔍 DEBUG: ${message}`, data);
      } else {
        console.log(`🔍 DEBUG: ${message}`);
      }
    }
  }

  /**
   * Log para autenticación (especialmente sensible)
   */
  auth(message, userData = null) {
    if (userData) {
      const safeData = {
        ...userData,
        email: userData.email ? this.maskSensitiveData(userData.email) : undefined,
        accessToken: userData.accessToken ? '***HIDDEN***' : undefined,
        refreshToken: userData.refreshToken ? '***HIDDEN***' : undefined
      };
      console.log(`🔐 ${message}`, safeData);
    } else {
      console.log(`🔐 ${message}`);
    }
  }

  /**
   * Log para sincronización de datos
   */
  sync(message, count = null) {
    if (count !== null) {
      console.log(`🔄 ${message}`, `${count} elementos`);
    } else {
      console.log(`🔄 ${message}`);
    }
  }
}

export const secureLogger = new SecureLogger();
