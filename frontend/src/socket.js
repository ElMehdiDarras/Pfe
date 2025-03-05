// This is a mock socket implementation 
// Replace with actual socket.io implementation when you have a socket server

// Create a mock socket object
const socket = {
    on: (event, callback) => {
      console.log(`Socket event '${event}' would be registered here`);
      return socket; // For chaining
    },
    off: (event) => {
      console.log(`Socket event '${event}' would be unregistered here`);
      return socket; // For chaining
    },
    emit: (event, data) => {
      console.log(`Socket would emit '${event}' with data:`, data);
    },
    // Add a flag to indicate this is not a real socket
    isMock: true
  };
  
  // Log that we're using a mock socket
  console.warn('Using mock socket implementation. Replace with actual socket.io when available.');
  
  export default socket;