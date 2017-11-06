exports.handler = function(event, context, callback) {
   console.log("event = %j", event);
   callback(null, "logged the event");
}
