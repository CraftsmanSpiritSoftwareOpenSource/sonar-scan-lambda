"use strict";
let chai = require('chai')
    , expect = chai.expect;


describe('sonar-scan event handler', function () {

    let eventHandler;

    beforeEach(function () {
        eventHandler = require('./sonarScanLambda');
    });

    describe("should should throw an error if the event is not a code pipeline event", function () {

        it("will set error on callback if json event is not correct", function(){
            eventHandler.handler(
                {"blah": "blah blah"},
                undefined,
                (err, data)=>{
                    expect(err).to.be.an('error');
                    expect(err.message).to.equal('Trigger event must be a code pipeline event');
                    expect(data).to.be.a('null');
                }
            );
        });

        it("will set error on callback if event is null", function(){
            eventHandler.handler(
                null,
                undefined,
                (err, data)=>{
                    expect(err).to.be.an('error');
                    expect(err.message).to.equal('event can not be null');
                    expect(data).to.be.a('null');
                }
            );
        });

        it("will set error on callback if event is undefined", function(){
            eventHandler.handler(
                undefined,
                undefined,
                (err, data)=>{
                    expect(err).to.be.an('error');
                    expect(err.message).to.equal('event can not be undefined');
                    expect(data).to.be.a('null');
                }
            );
        });

    });
});