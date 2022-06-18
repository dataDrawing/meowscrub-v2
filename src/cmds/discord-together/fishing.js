const Commando = require("discord.js-commando");
const disbut = require("discord-buttons");

module.exports = class TogetherCommand extends Commando.Command {
  constructor(client) {
    super(client, {
      name: "fishing",
      group: "discord-together",
      memberName: "fishing",
      description: "Generate an invite to play \"Fishington.io\" together!",
      details:
        "The command would generate an invite in the voice channel you're in.",
      throttling: {
        usages: 1,
        duration: 5,
      },
      guildOnly: true,
    });
  }

  async run(message) {
    const voiceChannel = message.member.voice.channel;

    if (!voiceChannel)
      return message.reply(
        "<:scrubnull:797476323533783050> Join an appropriate voice channel to use this command."
      );

    const together = await this.client.discordTogether.createTogetherCode(
      message.member.voice.channelID,
      "fishing"
    );

    const togetherCode = new disbut.MessageButton()
      .setStyle("url")
      .setURL(together.code)
      .setLabel("Initiate the activity: Fishington.io");

    await message.reply(
      "Click on the button to start the activity. ONLY APPLICABLE FOR DESKTOP USERS!",
      togetherCode
    );
  }
};
