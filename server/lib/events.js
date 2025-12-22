const EventEmitter = require('events');

// Single emitter shared across routes for simple in-process real-time updates
const emitter = new EventEmitter();

module.exports = emitter;
