/**
 * Represents one chat column on the app
 */
class Chat {
    /**
     * Adds the chat column for channelName to the app
     *
     * @param {string} channelName Name of the channel
     */
    constructor(channelName) {
        /** @private */
        this.channelName_ = channelName;
    }

    get age() {
        return this._age;
    }

    set age(value) {
        if (value < 0) {
            console.log('We do not support undead animals');
        }

        this._age = value;
    }

    doSomething() {
        console.log('I\'m a ' + this.name);
    }
}
export default Chat;
