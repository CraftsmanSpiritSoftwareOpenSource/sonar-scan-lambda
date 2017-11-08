const validateEvent = (event, callback) => {
    if (event === null){
       return callback(new Error('event can not be null'));
    }
    if (event === undefined){
       return callback(new Error('event can not be undefined'));
    }
    if (!event.hasOwnProperty("CodePipeline.job")) {
       return callback(new Error('Trigger event must be a code pipeline event'));
    }
    callback()
}

exports.handler = function(event, context, callback) {

   try {
      validateEvent(event, (err)=>{
         "use strict";
         if (err){
            return callback(err, null);
         }
         console.log("event = %j", event);
         return callback(null, "logged the event");
      });

   } catch (err) {
      console.error(err)
      return callback(err, null)
   }
};
