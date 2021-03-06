/**
 * @param data
 * @param data.getUsers
 * @param data.getUsers.display_name
 * @param data.logo
 * @param ffzGlobal.default_sets
 * @param data.chatter_count
 * @param data.chatters
 * @param chatters.moderators
 * @param chatters.viewers
 * @param chatters.global_mods
 * @param chatters.admins
 * @param chatters.staff
 */


'use strict';

import ChatMessage from './ChatMessage.js';
import RoomStateMessage from './RoomStateMessage.js';
import UserMessage from './UserMessage.js';
import NameColorManager from './NameColorManager.js';

/**
 * Parser for parsing IRC messages sent by Twitch
 */
class MessageParser {
    /**
     * @param {EmoteManager} emoteManager
     * @param {BadgeManager} badgeManager
     * @constructor
     */
    constructor(emoteManager, badgeManager) {
        /** @private */
        this.emoteManager_ = emoteManager;
        /** @private */
        this.badgeManager_ = badgeManager;
    }

    /**
     * Parses an IRC message from Twitch and appends it to the corresponding chat.
     *
     * @param {string} msg Single raw chat message sent by Twitch
     * @return {Array.<ChatMessage>} Array of ChatMessage and UserMessage
     */
    parseMessage(msg) {
        let msgParts = msg.split(' ');
        //console.log(msg);

        let chatName = MessageParser.parseChatName_(msgParts);

        if (msgParts[2].localeCompare('WHISPER') === 0) {
            // ToDo: Implement whisper
            return [];
        } else if (msgParts[2].startsWith('GLOBALUSERSTATE')) {
            return [];
        } else if (chatName.length < 1) {
            // console.log('Message with no Chat specified: ' + msg);
            return [];
        }
        /** @type {Array.<ChatMessage>} */
        let chatMessages = [];
        if (msgParts[1].localeCompare('JOIN') === 0) {
            // Ignore JOINs (a user joined a channel)
        } else if (msgParts[1].localeCompare('PART') === 0) {
            // Ignore PARTs (a user left a channel)
        } else if (msgParts[1].localeCompare('353') === 0) {
            // Ignore name list
        } else if (msgParts[1].localeCompare('366') === 0) {
            // Ignore end of name list
        } else if (msgParts[1].localeCompare('MODE') === 0) {
            // Ignore gain/lose of Moderator rights
        } else if (msgParts[2].localeCompare('ROOMSTATE') === 0) {
            chatMessages = MessageParser.parseRoomState_(msg, chatName);
        } else if (msgParts[2].localeCompare('USERSTATE') === 0) {
            // Ignore user state
        } else if (msgParts[2].localeCompare('USERNOTICE') === 0) {
            chatMessages = this.parseUserNotice_(msg, chatName);
        } else if (msgParts[2].localeCompare('CLEARCHAT') === 0) {
            // ToDo: Bans/Timeouts
        } else if (msgParts[1].localeCompare('HOSTTARGET') === 0) {
            // Ignore hosting message
        } else if (msgParts[2].localeCompare('NOTICE') === 0
            || msgParts[1].localeCompare('PRIVMSG') === 0) {
            chatMessages = MessageParser.parseNotice_(msgParts, chatName);
        } else if (msgParts[2].localeCompare('PRIVMSG') === 0) {
            chatMessages = this.parsePrivmsg_(msgParts, chatName);
        } else if (chatName.length >= 1) {
            chatMessages = [new ChatMessage(chatName, msg)];
        } else {
            alert('Error');
        }
        return chatMessages;
    }

    /**
     * @param {Array} msgParts
     * @param {string} chatName channel the ROOMSTATE belongs to
     * @return {Array.<ChatMessage>} newMessages
     */
    parsePrivmsg_(msgParts, chatName) {
        let username = msgParts[1].split('!', 1);
        username = username[0].substring(1, username[0].length);

        let metaInfoRaw = msgParts[0].substring(1, msgParts[0].length);
        let metaInfo = MessageParser.getMetaInfoWithColor_(metaInfoRaw.split(';'), username);
        if (metaInfo.username != null) {
            username = metaInfo.username;
        }

        let userMessage = msgParts.slice(4).join(' ');
        userMessage = userMessage.substring(1, userMessage.length);

        let action = false;
        if (userMessage.startsWith('\x01ACTION')) {
            action = true;
            userMessage = userMessage.substring(8, userMessage.length - 2);
        }
        let messageContent = userMessage;
        let emotePositions = metaInfo.emotes;
        let badges = metaInfo.badges;
        let color = metaInfo.color;
        return [
            new UserMessage(chatName, messageContent, badges,
                emotePositions, username, color, action, this.emoteManager_, this.badgeManager_),
        ];
    }

    /**
     * @param {string} msg ROOMSTATE message
     * @param {string} chatName channel the ROOMSTATE belongs to
     * @return {Array.<ChatMessage>} newMessages
     * @private
     */
    static parseRoomState_(msg, chatName) {
        let roomStateMsg = msg.split(' ')[0];
        roomStateMsg = roomStateMsg.substring(1, roomStateMsg.length);
        let roomStates = roomStateMsg.split(';');
        let infoMessage = '';
        let chatInput = $('#' + chatName + ' .chatInput');
        chatInput.find('p').remove();
        for (let j = 0; j < roomStates.length; j++) {
            let info = roomStates[j].split('=');
            let infoKeyword = info[0];
            switch (infoKeyword) {
                case 'broadcaster-lang':
                    infoMessage += info[1] + '  ';
                    break;
                case 'emote-only':
                    if (info[1].localeCompare('1') === 0) {
                        infoMessage += 'EMOTE-ONLY  ';
                    }
                    break;
                case 'followers-only':
                    if (info[1].localeCompare('-1') !== 0) {
                        infoMessage += 'FOLLOW ' + info[1] + 'm  ';
                    }
                    break;
                case 'r9k':
                    if (info[1].localeCompare('1') === 0) {
                        infoMessage += 'R9K  ';
                    }
                    break;
                case 'slow':
                    if (info[1].localeCompare('0') !== 0) {
                        infoMessage += 'SLOW ' + info[1] + 's  ';
                    }
                    break;
                case 'subs-only':
                    if (info[1].localeCompare('1') === 0) {
                        infoMessage += 'SUB  ';
                    }
                    break;
            }
        }
        return [new RoomStateMessage(chatName, infoMessage)];
    }

    /**
     * @param {string} msg USERNOTICE message
     * @param {string} chatName channel the ROOMSTATE belongs to
     * @return {Array.<ChatMessage>} newMessages
     * @private
     */
    parseUserNotice_(msg, chatName) {
        let userNoticeMessageParts = msg.split(' ');
        let userNoticeMessage = userNoticeMessageParts.slice(4).join(' ');
        let metaInfoRaw = msg.substring(1, msg.length).split(' ')[0].split(';');
        let metaInfo = MessageParser.getMetaInfo_(metaInfoRaw);
        let chatMessages = [];
        chatMessages.push(new ChatMessage(chatName,
            ((metaInfo.systemMsg != null) ? (metaInfo.systemMsg + ' ') : '')));
        if (userNoticeMessage.length > 0) {
            chatMessages.push(this.parseMessage(msg.split(' ')[0] + ' :' +
                metaInfo.username.toLowerCase() + '!' +
                metaInfo.username.toLowerCase() + '@' +
                metaInfo.username.toLowerCase() + '.tmi.twitch.tv PRIVMSG #'
                + chatName + ' ' + userNoticeMessage)[0]);
        }
        return chatMessages;
    }

    /**
     * @param {Array.<string>} msgParts
     * @param {string} chatName channel the ROOMSTATE belongs to
     * @return {Array.<ChatMessage>} newMessages
     * @private
     */
    static parseNotice_(msgParts, chatName) {
        let slicePoint = msgParts[2].localeCompare('NOTICE') === 0 ? 4 : 3;
        let noticeMessage = msgParts.slice(slicePoint).join(' ');
        return [new ChatMessage(chatName, noticeMessage.substring(1, noticeMessage.length))];
    }

    /**
     * @param {Array.<string>} msgParts
     * @return {string} chatName the message belongs to
     * @private
     */
    static parseChatName_(msgParts) {
        let chatName = '';
        // Parse chat channel name the message is for
        for (let j = 0; j < msgParts.length; j++) {
            if (msgParts[j].startsWith('#')) {
                chatName = msgParts[j].slice(1, msgParts[j].length);
                chatName = chatName.trim();
                break;
            }
        }
        return chatName;
    }

    /**
     * Parses the meta information part of a chat message.
     *
     * @param {string[]} metaMsg [{@badges=<badges>},{color=<color>},...]
     * @param {string} username user from whom the message was sent
     * @return {Object} Object with one property for every meta information
     * @private
     */
    static getMetaInfoWithColor_(metaMsg, username) {
        let metaInfo = {};

        metaInfo.color = '#acacbf';
        metaInfo.emotes = '';
        metaInfo.badges = '';

        let gotColor = false;
        for (let j = 0; j < metaMsg.length; j++) {
            let info = metaMsg[j].split('=');
            if (info.length <= 1 || info[1].localeCompare('') === 0) {
                continue;
            }

            if (info[0].localeCompare('color') === 0) {
                metaInfo.color = info[1];
                if (metaInfo.color.localeCompare('') === 0
                    && !(NameColorManager.getUserColors().hasOwnProperty(username))) {
                    metaInfo.color = NameColorManager.randomColor();
                    NameColorManager.addUserColor(username, metaInfo.color);
                } else if (metaInfo.color.localeCompare('') === 0
                    && NameColorManager.getUserColors().hasOwnProperty(username)) {
                    metaInfo.color = NameColorManager.getUserColors()[username];
                }
                gotColor = true;
            } else if (info[0].localeCompare('display-name') === 0) {
                metaInfo.username = info[1];
            } else if (info[0].localeCompare('emotes') === 0) {
                metaInfo.emotes = info[1].split('/');
            } else if (info[0].localeCompare('badges') === 0) {
                metaInfo.badges = info[1].split(',');
            } else if (info[0].localeCompare('system-msg') === 0) {
                metaInfo.systemMsg = info[1].replace(/\\s/g, ' ');
            } else if (info[0].localeCompare('emote-sets') === 0) {
                metaInfo.emoteSets = info[1].split(',');
            }
        }

        if (!gotColor) {
            if (NameColorManager.getUserColors().hasOwnProperty(username)) {
                metaInfo.color = NameColorManager.getUserColors()[username];
            } else {
                metaInfo.color = NameColorManager.randomColor();
                NameColorManager.addUserColor(username, metaInfo.color);
            }
        }

        // Color contrast correction
        metaInfo.color = NameColorManager.colorCorrection(metaInfo.color);

        return metaInfo;
    }

    /**
     * Parses the meta information part of a chat message.
     *
     * @param {string[]} metaMsg [{@badges=<badges>},{color=<color>},...]
     * @return {Object} Object with one property for every meta information
     * @private
     */
    static getMetaInfo_(metaMsg) {
        let metaInfo = {};

        metaInfo.emotes = '';
        metaInfo.badges = '';

        for (let j = 0; j < metaMsg.length; j++) {
            let info = metaMsg[j].split('=');
            if (info.length <= 1 || info[1].localeCompare('') === 0) {
                continue;
            }

            if (info[0].localeCompare('display-name') === 0) {
                metaInfo.username = info[1];
            } else if (info[0].localeCompare('emotes') === 0) {
                metaInfo.emotes = info[1].split('/');
            } else if (info[0].localeCompare('badges') === 0) {
                metaInfo.badges = info[1].split(',');
            } else if (info[0].localeCompare('system-msg') === 0) {
                metaInfo.systemMsg = info[1].replace(/\\s/g, ' ');
            } else if (info[0].localeCompare('emote-sets') === 0) {
                metaInfo.emoteSets = info[1].split(',');
            }
        }
        return metaInfo;
    }
}
export default MessageParser;
