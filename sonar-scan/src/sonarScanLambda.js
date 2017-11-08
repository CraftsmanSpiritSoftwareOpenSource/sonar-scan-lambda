exports.handler = function(event, context, callback) {
   console.log("event = %j", event);
   function validateEvent() {
      if (!event.hasOwnProperty("CodePipeline.job")) {
         throw new Error('Trigger event must be a code pipeline event');
      }
   }

   try {
      validateEvent();
      return callback(null, "logged the event");
   } catch (err) {
      console.error(err)
      return callback(err, null)
   }
};
