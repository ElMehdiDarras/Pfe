// src/utils/soundUtils.js

/**
 * Utility for playing notification sounds
 */

// Cache for audio elements
const audioCache = {};

/**
 * Play a sound file
 * @param {string} sound - The sound file path (relative to public folder)
 * @param {Object} options - Options for playing the sound
 * @param {number} options.volume - Volume level (0.0 to 1.0)
 * @returns {Promise} Promise that resolves when sound starts playing or rejects on error
 */
// In src/utils/soundUtils.js
// Modify the playSound function:

export const playSound = (soundPath) => {
  try {
    console.log(`Playing sound: ${soundPath}`);
    const audio = new Audio(soundPath);
    audio.volume = 0.5;
    
    // Add this to handle autoplay restrictions
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        // Autoplay was prevented
        if (error.name === 'NotAllowedError') {
          console.log('Sound autoplay prevented by browser policy. User interaction required.');
          // We can ignore this error instead of showing a dialog
        } else {
          console.error(`Error playing sound (${soundPath}):`, error);
        }
      });
    }
  } catch (error) {
    console.error(`Failed to play sound (${soundPath}):`, error);
  }
};
/**
 * Play an alarm sound based on severity
 * @param {string} severity - The severity level ('CRITICAL', 'MAJOR', 'WARNING', 'INFO')
 * @returns {Promise} Promise from playSound
 */
export const playAlarmSound = (severity) => {
  switch (severity) {
    case 'CRITICAL':
      return playSound('/sounds/critical-alarm.mp3', { volume: 0.8 });
    case 'MAJOR':
      return playSound('/sounds/major-alarm.mp3', { volume: 0.6 });
    case 'WARNING':
      return playSound('/sounds/warning-alarm.mp3', { volume: 0.4 });
    default:
      return playSound('/sounds/notification.mp3', { volume: 0.3 });
  }
};

/**
 * Check if browser supports audio
 * @returns {boolean} True if browser supports audio
 */
export const isAudioSupported = () => {
  return typeof Audio !== 'undefined';
};

/**
 * Check if browser allows autoplay
 * @returns {Promise<boolean>} Promise that resolves to true if autoplay is allowed
 */
export const checkAutoplayPermission = async () => {
  if (!isAudioSupported()) return false;
  
  try {
    // Create a silent audio element
    const audio = new Audio();
    audio.src = 'data:audio/mpeg;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAAHQAAA1N3aXRjaCBQbHVzIMKpIE5DSCBTb2Z0d2FyZQBUSVQyAAAABgAAAzIyMzUAVFNTRQAAAA8AAANMYXZmNTcuODMuMTAwAAAAAAAAAAAAAAD/80DEAAAAA0gAAAAATEFNRTMuMTAwVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsRbAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';
    audio.volume = 0.01; // Set volume to minimal
    
    // Try to play it
    await audio.play();
    
    // If we get here, autoplay is allowed
    audio.pause();
    return true;
  } catch (err) {
    // Autoplay not allowed
    console.warn('Autoplay not allowed:', err);
    return false;
  }
};

// Create a named export object
const soundUtils = {
  playSound,
  playAlarmSound,
  isAudioSupported,
  checkAutoplayPermission
};

// Export the named object
export default soundUtils;