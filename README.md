socket.on('event', function) listens for events by each connected client and executes the associated function when events are triggered.

socket.emit('event', data) emits the event to the client who invoked the event containing this call.

socket.broadcast.to(room) broadcasts the event to everyone in the room except the person who sent the event which triggered this function. For example, in the gameEnded event handler, the person who emitted this event won’t be sent the gameEnd event. Everyone else in that room will receive this event.
