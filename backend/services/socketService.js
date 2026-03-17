const socketService = (io) => {
  io.on('connection', (socket) => {
    // Join order tracking room
    socket.on('join_order', (orderId) => {
      if (orderId) socket.join(`order_${orderId}`);
    });

    // Join chat room
    socket.on('join_chat', (orderId) => {
      if (orderId) socket.join(`chat_${orderId}`);
    });

    // Join restaurant notification room
    socket.on('join_restaurant', (restaurantId) => {
      if (restaurantId) socket.join(`restaurant_${restaurantId}`);
    });

    // Join user notification room
    socket.on('join_user', (userId) => {
      if (userId) socket.join(`user_${userId}`);
    });

    // Join admin room (for payment_pending notifications)
    socket.on('join_admin', () => {
      socket.join('admin_room');
    });

    // Rider broadcasts location — relay to order room
    socket.on('rider_location_update', ({ orderId, lat, lng }) => {
      if (orderId && lat && lng) {
        io.to(`order_${orderId}`).emit('rider_location', { lat, lng, orderId });
      }
    });

    // Typing indicators for chat
    socket.on('typing', ({ orderId, name }) => {
      if (orderId) socket.to(`chat_${orderId}`).emit('user_typing', { name });
    });
    socket.on('stop_typing', ({ orderId }) => {
      if (orderId) socket.to(`chat_${orderId}`).emit('user_stop_typing', {});
    });

    socket.on('disconnect', () => {});
  });
};

module.exports = socketService;
