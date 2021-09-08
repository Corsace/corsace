import { discordClient } from "../Server/discord";
import guildMemberAdd from "./handlers/guildMemberAddHandler";
import message from "./handlers/messageHandler";

discordClient.on("guildMemberAdd", guildMemberAdd);

discordClient.on("messageCreate", message);
