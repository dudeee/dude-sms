import { defaultsDeep } from 'lodash';


const DEFAULT_CONFIG = {
  request: {
    type: 'post',
    path: '/message',
  },
  params: {
    from: 'from',
    to: 'to',
    message: 'message'
  },
  validator: msg => true, // eslint-disable-line
  modifier: msg => msg,
  responseHandler: msg => null // eslint-disable-line
};

export default bot => {
  if (!bot.remote) {
    throw new Error('Remote server instance object not found');
  }
  const config = defaultsDeep(bot.config.sms, DEFAULT_CONFIG);

  // request type and path from config
  const { type, path } = config.request;


  bot.remote[type](path, async (req, res, next) => {
    // get methods have 'query' and the post ones have 'body'
    const params = type === 'get' ? req.query : req.body;
    // gather from and message data from params passed in request
    const { from: fromKey, message: messageKey } = config.params;
    const { modifier = null, validator = null, responseHandler = null } = config;

    // Temporary message object may change in modifier call
    let tempMessageObject = {
      from: params[fromKey],
      message: params[messageKey]
    };

    // Only let the validated messages pass
    if (validator) {
      if (!validator(tempMessageObject)) {
        return res.sendStatus(403);
      }
    }

    // Pass the message text to modifier
    if (modifier) {
      tempMessageObject = modifier(tempMessageObject);
    }

    const { from, message } = tempMessageObject;

    const slackUser = bot.users.find(user =>
      // Skip if user has no phone number in slack
      user.profile.phone && user.profile.phone.replace(/\+98/, '0') === from
    );

    // If there is no user with that phone in our slack it's 404
    if (!slackUser) {
      return res.sendStatus(404);
    }

    const { id } = slackUser;

    // Find or create user im with bot
    let im = (bot.ims.find(i => i.user === id) || {}).id;
    if (!im) {
      im = await bot.call('im.open', { user: id });
      im = im && im.channel ? im.channel.id : null;
    }

    // message event object
    const event = {
      text: message,
      user: id,
      channel: im
    };

    if (responseHandler) {
      // Do something with bot response
      const middleware = bot.modifiers.preprocess('sendMessage', (channel, text, props = {}) => {
        // Ignore if it's not our user
        if (channel !== event.channel) {
          bot.modifiers.remove('sendMessage', middleware);
          return [channel, text, props];
        }

        // It's our user! we should handle callback
        const responseData = {
          text,
          phone: from,
          user: event.id,
          channel: event.im
        };

        // Call handler with responseData
        responseHandler(responseData);

        // Remove the modifier to prevent handling all the requests after this one!
        bot.modifiers.remove('sendMessage', middleware);

        return [channel, text, props];
      });
    }

    bot.inject('message', event);

    res.status(200).send(event);

    return next();
  });

  return bot;
};
