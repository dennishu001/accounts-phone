var Future = Npm.require('fibers/future');
var Twilio = Npm.require('twilio');
var AliDaYu = Npm.require('alidayu-node');


SMS = {};
SMSTest = {};

var next_devmode_sms_id = 0;
var output_stream = process.stdout;

// Testing hooks
SMSTest.overrideOutputStream = function (stream) {
    next_devmode_sms_id = 0;
    output_stream = stream;
};

SMSTest.restoreOutputStream = function () {
    output_stream = process.stdout;
};

var devModeSend = function (options) {
    var devmode_sms_id = next_devmode_sms_id++;

    var stream = output_stream;

    // This approach does not prevent other writers to stdout from interleaving.
    stream.write("====== BEGIN SMS #" + devmode_sms_id + " ======\n");
    stream.write("(SMS not sent; to enable sending, set the TWILIO_CREDENTIALS " +
        "environment variable.)\n");
    var future = new Future;
    stream.write("From:" + options.from + "\n");
    stream.write("To:" + options.to + "\n");
    stream.write("Text:" + options.body + "\n");
    stream.write("====== END SMS #" + devmode_sms_id + " ======\n");
    future['return']();
};

/**
 * Mock out sms sending (eg, during a test.) This is private for now.
 *
 * f receives the arguments to SMS.send and should return true to go
 * ahead and send the email (or at least, try subsequent hooks), or
 * false to skip sending.
 */
var sendHooks = [];
SMSTest.hookSend = function (f) {
    sendHooks.push(f);
};

/**
 * Send an sms.
 *
 * Connects to twilio via the CONFIG_VARS environment
 * variable. If unset, prints formatted message to stdout. The "from" option
 * is required, and at least one of "to", "from", and "body" must be provided;
 * all other options are optional.
 *
 * @param options
 * @param options.from {String} - The sending SMS number
 * @param options.to {String} - The receiver SMS number
 * @param options.body {String}  - The content of the SMS
 */
SMS.send = function (options) {
    for (var i = 0; i < sendHooks.length; i++)
        if (!sendHooks[i](options))
            return;
    if (SMS.twilio) {
        var client = Twilio(SMS.twilio.ACCOUNT_SID, SMS.twilio.AUTH_TOKEN);
        // Send SMS  API async func
        var sendSMSSync = Meteor.wrapAsync(client.sendMessage, client);
        // call the sync version of our API func with the parameters from the method call
        var result = sendSMSSync(options, function (err, responseData) { //this function is executed when a response is received from Twilio
            if (err) { // "err" is an error received during the request, if any
                throw new Meteor.Error("Error sending SMS ", err);
            }
            return responseData;
        });

        return result;
    } 
    else if (Meteor.settings.sms === 'dayu') {
        //var key = Meteor.settings.alidayu_key;
        //var secret = Meteor.settings.alidayu_secret;
        // hardcoded
        var app = new AliDaYu('23304554', '7007b526fbb9936d80758b8b0ac1a871');
        var params = {
            sms_free_sign_name: '身份验证',
            rec_num: options.to.replace(/^\+86/, ''), // dayu only accepts local phone number
            sms_template_code: 'SMS_4980890', //SMS.dayuTemplates[options.action],
            sms_param: { code: options.code, product: '伟海精英' }
        };
        //console.log('params', params);   
        var sendSMSSync = Meteor.wrapAsync(app.smsSend, app);
        var result = sendSMSSync(params, function (res) {
            //console.log('res:', res);
            if (res.error_response) {
                throw new Meteor.Error('Error sending SMS', res.error_response);
            }
            return res;
        });
        //console.log('res:', result);
        return result;
    }
    else {
        devModeSend(options);
    }
};

SMS.phoneTemplates = {
    from: '+972545999999',
    text: function (user, code) {
        return 'Welcome your invitation code is: ' + code;
    }
};

///
/// alidayu
///

// template lookup
SMS.dayuTemplates = {
    create: 'SMS_4980887',
    reset: 'SMS_4980885',
    identify: 'SMS_4980890'
};