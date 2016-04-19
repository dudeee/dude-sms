# bolt-sms

`bolt-sms` is a sms control plugin for [Bolt](https://github.com/slack-bolt/bolt) slack bot based on [bolt-remote](https://github.com/slack-bolt/bolt-remote) plugin. You can use this plugin to pass the commands from outside with a sms provider to your slack bot.


## Installation

First install Bolt and make it work. Then use `npm` and install it:

```bash
npm install --save bolt-sms
```

*note that you should config both this plugin and bolt-remote in order to make it work.*


## Setup

Bolt knows the plugins by their package name prefix. It's loading all `bolt-*` modules as plugin and pass them a Bolt instance. They can modify the bot or do anything else with the instance.

This plugin only needs some configuration in your Bolt `config.js` file. You can modify the config in the runtime by editing your bot `.config.sms` property. It's usefull for `validator` and `modifier` config key which we'll mention below. The config properties are:

```js
{
  request: {
    type: 'post',
    path: '/message',
  },
  params: {
    from: 'from',
    to: 'to',
    message: 'message'
  },
  validator: msg => true,
  modifier: msg => msg,
  responseHandler: msg => null
}
```

* **request**: The request type and path for setting for our message receiver webhook.


* **params**: SMS message params that SMS provider is passing to our hook. If `request.type` config be `post`, it should be in request `body` and if it's `get` it should be in request `query`. The params object parameters are:
  * **from**: The SMS sender phone number
  * **to**: Our SMS phone number (useless for now :/ xD)
  * **message**: The SMS text content itself


* **validator**: A function that takes message object and should return true to respond and act. If it returns false, the http request will receive a `403` error. This function takes the following SMS object signature:

  ```js
  {
    from: '+989999999',
    message: 'Hey, I will be there soon!'
  }
  ```

  *example*:

  ```js
  myBot.config.sms.validator = msg => {
    const spammer = '+988888888'
    if (msg.from === spammer) {
      return false; // stop him!
    }
    return true; // he's not the spammer
  }
  ```

* **modifier**: A function that can modify our message before we pass it to our slack bot. It receive message object and return message object. It runs after validator and before emitting message to bot. Input signature looks like validator function.

  *example*:

  ```js
  myBot.config.sms.modifier = msg => {
    const adminPhoneNumber = '+989876543';
    if (msg.from === adminPhoneNumber) {
      msg.message = `admin: ${msg.message}`;
    }
    return msg;
  }
  ```

* **responseHandler**: A function that will be called before bot sends user response back to the user in slack. You can use this function to send the user SMS or some other additional message. The object passed to this function looks like this:

```js
{
  text: 'Some messsage text', // our slack bot response that he'll send to user in react to the message came
  phone: '09309999999', // sms sender phone number
  user: 'U123456', // some Slack user id
  channel: 'D654321' // user channel id that can be used to send additional message
}
```

  *example*:

  ```js
  myBot.config.sms.responseHandler = msg => {
    const { text, phone } = msg;
    // do something with phone and sms with your own functions like sendSMS(phone, text) or etc.
  }
  ```


## Contribution

You can fork the repository, improve or fix some part of it and then send the pull requests back if you want to see them here. I really appreciate that. :heart:

Remember to lint your code before sending pull requests. Run the Grunt eslint task with the following command and fix the lint errors if you get any.

```bash
grunt eslint
```
