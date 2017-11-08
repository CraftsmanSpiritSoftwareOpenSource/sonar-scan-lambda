"use strict";
let chai = require('chai')
    , expect = chai.expect;


describe('sonar-scan event handler', function () {

    let eventHandler;

    beforeEach(function () {
        eventHandler = require('./sonarScanLambda');
    });

    it("should should throw an error if the event is not a code pipeline event", function () {
        eventHandler.handler(
            {"blah": "blah blah"},
            undefined,
            (err, data)=>{
                expect(err).to.be.an('error');
                expect(err.message).to.equal('Trigger event must be a code pipeline event');
                expect(data).to.be.a('null');
            }
        )
    });
});