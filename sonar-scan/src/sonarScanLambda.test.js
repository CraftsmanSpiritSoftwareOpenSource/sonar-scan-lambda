"use strict";
let chai = require('chai')
    , expect = chai.expect;


describe('sonar-scan event handler', function () {

    let eventHandler;

    beforeEach(function () {
        eventHandler = require('./sonarScanLambda');
    });

    it("should should throw an error if the event is not a code pipeline event", function () {
        expect(
            eventHandler.handler.bind(eventHandler.handler,
                {"blah": "blah blah"},
                ()=>{},
                (err, data)=>{}
            )
        ).to.throw('Trigger event must be a code pipeline event');
    });
});