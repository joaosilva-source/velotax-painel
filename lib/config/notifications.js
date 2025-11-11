// Configurações de notificações
export const NOTIFICATION_SOUND_FREQ = 880; // Frequência em Hz
export const NOTIFICATION_SOUND_DURATION = 200; // Duração em ms
export const NOTIFICATION_OPTIONS = {
  // Opções adicionais para notificações
  icon: '/favicon.ico',
  badge: '/favicon.ico'
};

// Verifica se as notificações são suportadas
export const isNotificationSupported = () => {
  return typeof window !== 'undefined' && 'Notification' in window;
};

// Solicita permissão para notificações
export const requestNotificationPermission = async () => {
  if (!isNotificationSupported()) return false;
  
  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Erro ao solicitar permissão de notificação:', error);
    return false;
  }
};

// Toca um som de notificação
export const playNotificationSound = () => {
  try {
    if (typeof window === 'undefined') return;
    
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(NOTIFICATION_SOUND_FREQ, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.start();
    gainNode.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
    
    setTimeout(() => {
      gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.1);
      oscillator.stop(audioCtx.currentTime + 0.11);
    }, NOTIFICATION_SOUND_DURATION);
    
    return () => {
      oscillator.disconnect();
      gainNode.disconnect();
    };
  } catch (error) {
    console.error('Erro ao reproduzir som de notificação:', error);
  }
};

// Exibe uma notificação
// Retorna true se a notificação foi exibida, false caso contrário
export const showNotification = async (title, options = {}) => {
  if (!isNotificationSupported()) return false;
  
  try {
    if (Notification.permission === 'granted') {
      new Notification(title, { ...NOTIFICATION_OPTIONS, ...options });
      return true;
    } else if (Notification.permission !== 'denied') {
      const permission = await requestNotificationPermission();
      if (permission) {
        new Notification(title, { ...NOTIFICATION_OPTIONS, ...options });
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('Erro ao exibir notificação:', error);
    return false;
  }
};

// Exibe uma notificação com som
export const notifyWithSound = async (title, options = {}) => {
  const notificationShown = await showNotification(title, options);
  if (notificationShown) {
    playNotificationSound();
  }
  return notificationShown;
};
