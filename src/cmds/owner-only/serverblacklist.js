const Commando = require("discord.js-commando");
const disbut = require("discord-buttons");
const guildBlacklistSchema = require("../../models/guild-blacklist-schema");

const confirmId = "confirmGuildBlacklist";
const abortId = "cancelGuildBlacklist";

module.exports = class ServerBlacklistCommand extends Commando.Command {
  constructor(client) {
    super(client, {
      name: "server-blacklist",
      aliases: ["guild-blacklist", "server-ban"],
      group: "owner-only",
      memberName: "server-blacklist",
      description: "Blacklist a server from inviting me.",
      details:
        "Use --force to skip guild checking. Good for blacklisting a guild that I'm not in.\nOnly the bot owner(s) may use this command.",
      argsType: "multiple",
      format: "<guildId> [--force]",
      examples: [
        "blacklist 692346925428506777",
        "blacklist 692346925428506777 --force",
      ],
      clientPermissions: ["EMBED_LINKS"],
      hidden: true,
    });
  }

  async run(message, args) {
    if (!this.client.isOwner(message.author))
      return message.reply(
        "<:scrubred:797476323169533963> Messing with this command is unauthorized by regulars.\nOnly intended for bot owner(s)."
      );

    if (!args[0])
      return message.reply(
        "<:scrubnull:797476323533783050> You need a valid Guild ID in order to continue."
      );

    let target;
    let guildId;

    if (!args[1]) {
      try {
        target = await this.client.guilds.fetch(args[0]);
      } catch (err) {
        return message.reply(
          "<:scrubred:797476323169533963> What is this ID. Please explain.\nBut if the guild you provided DOES exist, use `--force` alongside with the Guild ID."
        );
      }
      guildId = target.id;
    } else if (args[1] && args[1].toLowerCase() === "--force") {
      guildId = args[0];
    } else {
      return message.reply(
        "<:scrubred:797476323169533963> Did you type in the wrong flag? Please try again."
      );
    }

    const results = await guildBlacklistSchema.findOne({
      guildId,
    });

    if (results)
      return message.reply(
        `The guild with this ID: **${guildId}** has already been blacklisted. What are you trying to do?`
      );

    let response = "";
    if (!args[1]) {
      response = `
You will attempt to blacklist this guild: **${target.name}**.
Please confirm your choice by clicking one of the buttons below.         
      `;
    } else if (args[1] && args[1].toLowerCase() === "--force") {
      response = `
You will attempt to blacklist this guild: **${guildId}**.
Please confirm your choice by clicking one of the buttons below.      
      `;
    }

    const confirmBtn = new disbut.MessageButton()
      .setStyle("green")
      .setLabel("Confirm")
      .setID(confirmId);

    const abortBtn = new disbut.MessageButton()
      .setStyle("red")
      .setLabel("Abort")
      .setID(abortId);

    const row = new disbut.MessageActionRow().addComponents([
      confirmBtn,
      abortBtn,
    ]);

    const msg = await message.reply(response, row);

    const filter = (button) => button.clicker.user.id === message.author.id;

    msg
      .awaitButtons(filter, { max: 1, time: 30000 })
      .then(async (collected) => {
        const confirmBtnEdit = new disbut.MessageButton()
          .setStyle("green")
          .setLabel("Confirm")
          .setID(confirmId)
          .setDisabled();

        const abortBtnEdit = new disbut.MessageButton()
          .setStyle("red")
          .setLabel("Abort")
          .setID(abortId)
          .setDisabled();

        const rowEdit = new disbut.MessageActionRow().addComponents([
          confirmBtnEdit,
          abortBtnEdit,
        ]);

        switch (collected.first().id) {
          case confirmId:
            try {
              await new guildBlacklistSchema({
                guildId,
              }).save();
            } finally {
              await collected
                .first()
                .message.edit(
                  "You've made your choice to blacklist **that following guild**.\nOperation complete.",
                  rowEdit
                );
            }
            break;
          case abortId:
            await collected.first().message.edit("Operation aborted.", rowEdit);
            break;
        }

        collected.first().reply.defer();
      })
      .catch(() => {
        message.channel.send(
          `${message.author}, No reaction after 30 seconds, operation aborted.`
        );
      });
  }
};
