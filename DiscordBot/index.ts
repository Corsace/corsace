import { createConnection } from "typeorm";
import { discordClient } from "../Server/discord";
import guildMemberAdd from "./handlers/guildMemberAdd";
import guildMemberRemove from "./handlers/guildMemberRemove";
import messageCreate from "./handlers/messageCreate";
import ormConnectionOptions from "../ormconfig";

discordClient.on("guildMemberAdd", guildMemberAdd);

discordClient.on("guildMemberRemove", guildMemberRemove);

discordClient.on("message", messageCreate);

createConnection(ormConnectionOptions)
    .then((connection) => {
        console.log(`Connected to the ${connection.options.database} (${connection.options.name}) database!`);
    })
    .catch((error) => console.log("An error has occurred in connecting.", error));