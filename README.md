Accounts-Phone
=========================

An account login system forked from accounts-phone meteor package.

## Work with accounts-password

We have adjusted the package to make it work with accounts-password package. To make it work, the accounts-password package must be added at application level but not the package level. Probably this has something to do with the loading order of the packages.

_update:_ As we have added email address to user identifier in this package, do we really need accounts-password?

## Alidayu-node

We use alidayu-node to send sms through alidayu sms service. See document https://github.com/hanqingnan/alidayu-node .

## Configuration

Modify SMS.phoneTemplates in sms_server.js to change the message templates.

## Workflows

### Create new user

1. Client calls 'createUserWithPhone'.
2. Server inserts new user to users collection. 
2. Server sets and sends verification code to user if so defined.
3. User enters verification code and logs in.

### Request verification code

1. Client calls 'requestPhoneVerification'.
2. Server sets and sends new verification code. Waits if the request is too often or exceeds limit.
3. User enters code.
4. Client calls 'verifyPhone' to verify the code. If new password is submitted, password will be reset after verification.
