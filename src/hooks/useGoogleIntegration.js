/**
 * Hook personalizado para manejar las integraciones de Google
 * Facilita el uso de Google Calendar y Gmail en los componentes
 */

import { useState, useEffect, useCallback } from 'react';
import { googleAuthService } from '../services/googleAuth';
import { googleCalendarService } from '../services/googleCalendar';
import { emailNotificationService } from '../services/emailNotifications';

export function useGoogleIntegration() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = useCallback(() => {
    const authenticated = googleAuthService.isAuthenticated();
    setIsAuthenticated(authenticated);
    return authenticated;
  }, []);

  const authorize = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await googleAuthService.authorize();
      // Esperar un momento para que se complete la autorización
      setTimeout(() => {
        checkAuthStatus();
        setIsLoading(false);
      }, 2000);
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
      throw err;
    }
  }, [checkAuthStatus]);

  const signOut = useCallback(() => {
    googleAuthService.signOut();
    setIsAuthenticated(false);
  }, []);

  const syncTaskToCalendar = useCallback(async (task, participants, calendarEventId = null) => {
    if (!isAuthenticated) {
      throw new Error('No estás autenticado con Google');
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await googleCalendarService.syncTask(task, participants, calendarEventId);
      setIsLoading(false);
      return result;
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
      throw err;
    }
  }, [isAuthenticated]);

  const sendTaskNotifications = useCallback(async (task, participants) => {
    if (!isAuthenticated) {
      throw new Error('No estás autenticado con Google');
    }

    setIsLoading(true);
    setError(null);

    try {
      const results = await emailNotificationService.sendTaskNotifications(task, participants);
      setIsLoading(false);
      return results;
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
      throw err;
    }
  }, [isAuthenticated]);

  const sendSingleNotification = useCallback(async (task, participant) => {
    if (!isAuthenticated) {
      throw new Error('No estás autenticado con Google');
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await emailNotificationService.sendTaskNotification(task, participant);
      setIsLoading(false);
      return result;
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
      throw err;
    }
  }, [isAuthenticated]);

  const syncAndNotify = useCallback(async (task, participants) => {
    if (!isAuthenticated) {
      throw new Error('No estás autenticado con Google');
    }

    setIsLoading(true);
    setError(null);

    try {
      // Sincronizar con Calendar
      const calendarResult = await googleCalendarService.syncTask(task, participants);
      
      // Enviar notificaciones por email
      const emailResults = await emailNotificationService.sendTaskNotifications(task, participants);
      
      setIsLoading(false);
      return {
        calendar: calendarResult,
        emails: emailResults
      };
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
      throw err;
    }
  }, [isAuthenticated]);

  return {
    isAuthenticated,
    isLoading,
    error,
    authorize,
    signOut,
    checkAuthStatus,
    syncTaskToCalendar,
    sendTaskNotifications,
    sendSingleNotification,
    syncAndNotify
  };
}
