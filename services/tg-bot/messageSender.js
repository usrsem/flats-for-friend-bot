const request = require('request-promise');
const settings = require('../../config/settings.json');

const chatIds = [
    209493779,
    402122176,
]

const sendMessages = async (post) => {
    chatIds.forEach(async (chatId) => {
        const options = settings.tgBotMessage;
        options.qs.chat_id = chatId;
        options.qs.text = `Время: ${post.postTime}\nТекст: ${post.postText}\nСсылка: ${post.postLink}`;
        sendRequest(options, post);
    });
    
};

const sendRequest = async (options) => {
    return request(options)
        .then(() => {
            console.log("Message sended");
        })
        .catch(() => {
            options.qs.text = "Слишком большой))"
            return sendRequest(options);
        })
}

module.exports = sendMessages;
