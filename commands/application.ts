import { Command } from 'discord-akairo';
import { MessageEmbed, Message } from 'discord.js';
import { db } from '../db';
import { AppConfig, APP_CONFIG_COLLECTION } from './appConfig';

export default class ApplicationCommand extends Command {
  constructor() {
    super('apply', {
      aliases: ['apply', 'app', 'application'],
      channel: 'guild',
    });
  }

  notConfigured = (message: Message) => {
    message.reply('The administrators of this discord have not yet configured applications. Please use the `appConfig` command to do so.');
  }

  async *args(message: Message) {
    if (!message || !message.guild) return;

    const config = await db.collection(APP_CONFIG_COLLECTION).findOne<AppConfig>({ id: message.guild.id });

    if (!config) {
      this.notConfigured(message);
      return null;
    }

    const answers = [];
    for (const question of config.questions) {
      const answer = yield {
        type: 'content',
        prompt: {
          start: question,
        }
      };
      answers.push({
        question: question,
        answer,
      });
    }

    return {
      answers
    }
  }

  async exec(message: Message, args: any) {
    if (!message.guild || !args) return;
    
    const config = await db.collection(APP_CONFIG_COLLECTION).findOne<AppConfig>({ id: message.guild.id });
    
    if (!config) {
      this.notConfigured(message);
      return;
    }
    
    this.client.channels
      .fetch(config.appChannel)
      .then((channel: any) => channel.send(new MessageEmbed()
        .setColor("#FF0000")
        .setTitle(`New Application for ${message.author.username}`)
        .addFields(args.answers.map((a: { question: string; answer: string}) => ({ name: a.question, value: a.answer })))
        .addField('ID', message.author)
        .addField('Channel', message.channel)
      ));
    
      return message.reply(`Thank you, your application was submitted. Please wait while it is processed someone will get back with you soon.`);
  }
}