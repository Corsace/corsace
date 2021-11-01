import { Message } from "discord.js";
import { getPoolData, updatePoolRow } from "../../../Server/sheets";
import { Command } from "../index";
import { roundAcronyms, roundNames } from "../../../Interfaces/rounds";
import mappoolFunctions from "../../functions/mappoolFunctions";

async function command (m: Message) {
    if (!(await mappoolFunctions.privilegeChecks(m, false, false)))
        return;

    const waiting = await m.channel.send("Swapping...");
    try {
        // The parseParams function in mappoolFunctions typically handles this, but due to the nature of 2 slots + 2 rounds required it's manually done here
        let pool: "openMappool" | "closedMappool" = mappoolFunctions.poolCheck(m);
        let round1 = "";
        let slot1 = "";
        let round2 = "";
        let slot2 = "";
        
        // Find pool + slots and rounds to swap
        const msgContent = m.content.toLowerCase();
        const parts = msgContent.split(" ");
        for (const part of parts) {
            if (part[0] === "!")
                continue;
            const translation = mappoolFunctions.identifierToPool(part);
            if (translation)
                pool = translation;
            else if (roundNames.some(name => name === part))
                if (round1 === "")
                    round1 = roundAcronyms[roundNames.findIndex(name => name === part)];
                else
                    round2 = roundAcronyms[roundNames.findIndex(name => name === part)];
            else if (roundAcronyms.some(name => name === part))
                if (round1 === "")
                    round1 = part;
                else
                    round2 = part;
            else if (slot1 === "")
                slot1 = part;
            else
                slot2 = part;
        }

        // check if slot and round were given
        if (slot1 === "" || slot2 === "") {
            m.channel.send("Missing slot(s)");
            return;
        }
        if (round1 === "" || round2 === "") {
            m.channel.send("Missing round(s)");
            return;
        }
        round1 = round1.toUpperCase();
        round2 = round2.toUpperCase();

        // Get pool data and iterate thru
        const [rows1, rows2] = await Promise.all([
            getPoolData(pool, round1),
            getPoolData(pool, round2),
        ]);
        if (!rows1) {
            m.channel.send(`Could not find round **${round1.toUpperCase()}** in the **${pool === "openMappool" ? "Corsace Open" : "Corsace Closed"}** pool`);
            return;
        }
        if (!rows2) {
            m.channel.send(`Could not find round **${round2.toUpperCase()}** in the **${pool === "openMappool" ? "Corsace Open" : "Corsace Closed"}** pool`);
            return;
        }
        let i1 = -1;
        let i2 = -1;
        for (let i = 0; i < rows1.length; i++) {
            const row = rows1[i];
            if (slot1.toLowerCase() === row[0].toLowerCase()) {
                i1 = i;
                break;
            }
        }
        for (let i = 0; i < rows2.length; i++) {
            const row = rows2[i];
            if (slot2.toLowerCase() === row[0].toLowerCase()) {
                i2 = i;
                break;
            }
        }

        if (i1 === -1) {
            m.channel.send(`Could not find round **${round1.toUpperCase()}** on **${pool === "openMappool" ? "Corsace Open" : "Corsace Closed"}**`);
            return;
        }
        if (i2 === -1) {
            m.channel.send(`Could not find round **${round2.toUpperCase()}** on **${pool === "openMappool" ? "Corsace Open" : "Corsace Closed"}**`);
            return;
        }

        let [firstRow, secondRow] = [rows1[i1], rows2[i2]];
        firstRow.shift();
        secondRow.shift();
        if (secondRow.length < firstRow.length)
            secondRow = firstRow.map(() => "");
        else if (firstRow.length < secondRow.length)
            firstRow = secondRow.map(() => "");

        await Promise.all([
            updatePoolRow(pool, `'${round1}'!B${i1 + 2}:P${i1 + 2}`, secondRow),
            updatePoolRow(pool, `'${round2}'!B${i2 + 2}:P${i2 + 2}`, firstRow),
        ]);

        m.channel.send(`Swapped **${slot1.toUpperCase()}** from **${round1.toUpperCase()}** with **${slot2.toUpperCase()}** from **${round2.toUpperCase()}** on **${pool === "openMappool" ? "Corsace Open" : "Corsace Closed"}**`);
    } finally {
        waiting.delete();
    }
}

const mappoolSwap: Command = {
    name: ["pswap", "poolswap", "swapp", "swappool"], 
    description: "Allows mappool heads to swap slots / rounds",
    usage: "!pswap <round1> <slot1> <round2> <slot2>", 
    category: "mappool",
    command,
};

export default mappoolSwap;