exports.handler = function(event, context, callback) {
   console.log("event = %j", event);
   if (!event.hasOwnProperty("CodePipeline.job")){
      throw new Error('Trigger event must be a code pipeline event');
   }
   callback(null, "logged the event");
}
