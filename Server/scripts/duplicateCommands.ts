import { commands } from "../../DiscordBot/commands";

// Find all duplicate names and alternative names in the commands array
const allNames = commands
    .map((command) => [command.data.name, ...command.alternativeNames])
    .flat();

// Find all duplicate names
const duplicateNames = allNames.filter((name, index) => allNames.indexOf(name) !== index);

// Find all duplicate alternative names
const duplicateAlternativeNames = commands
    .map((command) => command.alternativeNames)
    .flat()
    .filter((name, index, allNames) => allNames.indexOf(name) !== index);

// Find all duplicate names and alternative names
const duplicateNamesAndAlternativeNames = [...duplicateNames, ...duplicateAlternativeNames];

// Find all commands with duplicate names and alternative names
const duplicateCommands = commands.filter((command) =>
    duplicateNamesAndAlternativeNames.includes(command.data.name) ||
    command.alternativeNames.some((name) => duplicateNamesAndAlternativeNames.includes(name))
);

console.log(`Duplicate commands: ${duplicateCommands.length}\n${duplicateCommands.map((command) => command.data.name).join("\n")}\n\n Duplicate alternative names: ${duplicateAlternativeNames.length}\n${duplicateAlternativeNames.join("\n")}\n\n Duplicate names: ${duplicateNames.length}\n${duplicateNames.join("\n")}`);

// Exit
process.exit(0);