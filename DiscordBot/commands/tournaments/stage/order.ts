import { randomUUID } from "crypto";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, Message, MessageComponentInteraction, PermissionFlagsBits, PermissionsBitField, SlashCommandBuilder } from "discord.js";
import { Command } from "../..";
import { MapOrderTeam, StageType } from "../../../../Interfaces/stage";
import { MapStatus } from "../../../../Interfaces/matchup";
import { MapOrder } from "../../../../Models/tournaments/mapOrder";
import { Round } from "../../../../Models/tournaments/round";
import { filter, timedOut } from "../../../functions/messageInteractionFunctions";
import { loginResponse } from "../../../functions/loginResponse";
import channelID from "../../../functions/channelID";
import commandUser from "../../../functions/commandUser";
import confirmCommand from "../../../functions/confirmCommand";
import getRound from "../../../functions/tournamentFunctions/getRound";
import getStage from "../../../functions/tournamentFunctions/getStage";
import getTournament from "../../../functions/tournamentFunctions/getTournament";
import getUser from "../../../../Server/functions/get/getUser";
import ormConfig from "../../../../ormconfig";
import respond from "../../../functions/respond";

async function run (m: Message | ChatInputCommandInteraction) {
    if (!m.guild || !(m.member!.permissions as Readonly<PermissionsBitField>).has(PermissionFlagsBits.Administrator))
        return;

    if (m instanceof ChatInputCommandInteraction)
        await m.deferReply();

    const user = await getUser(commandUser(m).id, "discord", false);
    if (!user) {
        await loginResponse(m);
        return;
    }

    const tournament = await getTournament(m, channelID(m), "channel", undefined, true);
    if (!tournament)
        return;

    const stage = await getStage(m, tournament, false, tournament.ID, "tournamentID");
    if (!stage)
        return;

    // If the stage is an elimination-type stage, then check if they want to make a map order for a specific round for the stage; otherwise, just make do it for the stage
    let round: Round | undefined = undefined;
    if (
        (stage.stageType === StageType.Doubleelimination || stage.stageType === StageType.Singleelimination) && 
        await confirmCommand(m, `Is this for a specific round in ${stage.abbreviation}?\n**If it's for the entire stage, select No**`)
    ) 
        round = await getRound(m, stage);

    // Check if a pickban order already exists
    const orderQ = await MapOrder
        .createQueryBuilder("order")
        .leftJoinAndSelect("order.round", "round")
        .leftJoinAndSelect("order.stage", "stage");
    if (round)
        orderQ.where("round.ID = :roundID", { roundID: round.ID });
    else
        orderQ.where("stage.ID = :stageID", { stageID: stage.ID });
    const oldOrder = await orderQ.getMany();

    if (oldOrder.length > 0) {
        oldOrder.sort((a, b) => a.order - b.order);
        const sets = oldOrder
            .map(o => o.set)
            .filter((v, i, a) => a.indexOf(v) === i)
            .map(s => ({
                set: s,
                order: oldOrder.filter(o => o.set === s).sort((a, b) => a.order - b.order),
            }));
        if (!await confirmCommand(m, `A pickban order already exists for ${round ? round.abbreviation : stage.abbreviation} which is currently:\n${sets.map(s => `${sets.length === 1 ? `Set ${s.set}: ` : ""}${s.order.map(o => `\`${MapOrderTeam[o.team]} ${MapStatus[o.status]}\``).join(" ")}`).join("\n")}\n\nU wanna overwrite it?`))
            return;
    }

    let set = 1;
    const order: MapOrder[] = [];
    let content = "To add a pickban order, type 1 or 2 for which team would be acting on a map based on roll order (roll winner is 1), and then the map action itself (B for Ban, P for pick, X for protect).\nIf the team is based on winner or loser at that current state in the matchup, then type W or L instead of 1 or 2.\nTiebreaker will be assumed, and does not need to be explicitly added.\nIf u want to use sets, then create a new line for each\n1 set is equivalent to no sets\n\n**Examples:**\n1B 2B 1P 2P: Pickban order for a BO2 game, where the first team bans, then the second team bans, then the first team picks, then the second team picks\n1B 2B 2P 1P 2P 1P: Pickban order for a 1 set BO3 game, where the first team bans, then the second team bans, then the second team picks, then the first team picks, then the second team picks, then the first team picks\n\n";
    const ids = {
        stop: randomUUID(),
        done: randomUUID(),
    };
    const orderMessage = await m.channel!.send({
        content,
        components: [
            new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(ids.stop)
                        .setLabel("STOP COMMAND")
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId(ids.done)
                        .setLabel("Done pickban order")
                        .setStyle(ButtonStyle.Success)
                ),
        ],
    });

    let stopped = false;
    const componentCollector = m.channel!.createMessageComponentCollector({ filter, time: 6000000 });
    const orderCollector = m.channel!.createMessageCollector({ filter, time: 6000000 });
    
    componentCollector.on("collect", async (i: MessageComponentInteraction) => {	
        if (i.customId === ids.stop) {
            await i.reply("Ok");
            setTimeout(async () => (await i.deleteReply()), 5000);
            await respond(m, "Pickban order creation stopped");
            stopped = true;
            componentCollector.stop();
            orderCollector.stop();
            return;	
        }
        if (i.customId === ids.done) {
            if (order.length === 0) {
                await i.reply("U don't have a pickban order rn What the hell .");
                setTimeout(async () => (await i.deleteReply()), 5000);
                return;
            }
            if (order.map(o => o.set).filter((v, i, a) => a.indexOf(v) === i).length % 2 === 0) {
                await i.reply("U have an even number of sets which is impossible to have a clear winner for the match.");
                setTimeout(async () => (await i.deleteReply()), 5000);
                return;
            }
            await i.reply("Pickban order created");
            setTimeout(async () => (await i.deleteReply()), 5000);
            stopped = true;
            componentCollector.stop();
            orderCollector.stop();
            await orderDone(m, order, oldOrder);
            return;
        }
    });
    orderCollector.on("collect", async (msg: Message) => {
        const orderMsg = msg.content.split(" ");
        const orderMade: MapOrder[] = [];

        let newOrder = "";
        for (let i = 0; i < orderMsg.length; i++) {
            const o = orderMsg[i];
            if (o.length !== 2) {
                const reply = await msg.reply(`Invalid pickban order: ${o}`);
                setTimeout(async () => {
                    await reply.delete();
                }, 5000);
                return;
            }

            const n = o[0].toLowerCase();
            const t = o[1].toLowerCase();
            if (n !== "1" && n !== "2" && n !== "w" && n !== "l") {
                const reply = await msg.reply(`Invalid pickban team in ${o}, must be 1, 2, W, or L`);
                setTimeout(async () => {
                    await reply.delete();
                }, 5000);
                return;
            }
            if (t !== "b" && t !== "p" && t !== "x") {
                const reply = await msg.reply(`Invalid pickban map action in ${o}, must be B, P, or X`);
                setTimeout(async () => {
                    await reply.delete();
                }, 5000);
                return;
            }

            const mapOrder = new MapOrder();
            mapOrder.set = set;
            mapOrder.order = orderMade.length + 1;
            mapOrder.team = n === "1" ? MapOrderTeam.Team1 : n === "2" ? MapOrderTeam.Team2 : n === "w" ? MapOrderTeam.TeamWinner : MapOrderTeam.TeamLoser;
            mapOrder.status = t === "b" ? MapStatus.Banned : t === "p" ? MapStatus.Picked : MapStatus.Protected;
            if (round)
                mapOrder.round = round;
            else
                mapOrder.stage = stage;
            orderMade.push(mapOrder);
        }

        newOrder = `Set ${set}: ${orderMade.map(o => `\`${MapOrderTeam[o.team]} ${MapStatus[o.status]}\``).join(" ")}\n`;
        order.push(...orderMade);

        const reply = await msg.reply(`Pickban order created: ${newOrder}${set === 1 ? "\nIf ur not using sets, then u can press `Done pickban order` to finish" : ""}`);
        setTimeout(async () => {
            await reply.delete();
            await msg.delete();
        }, 10000);

        content += newOrder;
        await orderMessage.edit(content);

        set++;
    });
    orderCollector.on("end", () => timedOut(orderMessage, stopped, "Pickban order creation"));
}

async function orderDone (m: Message | ChatInputCommandInteraction, order: MapOrder[], oldOrder: MapOrder[]) {
    await ormConfig.transaction(async transactionManager => {
        await Promise.all(oldOrder.map(o => transactionManager.remove(o)));
        await Promise.all(order.map(o => transactionManager.save(o)));
    });
    const sets = order
        .map(o => o.set)
        .filter((v, i, a) => a.indexOf(v) === i)
        .map(s => ({
            set: s,
            order: order.filter(o => o.set === s).sort((a, b) => a.order - b.order),
        }));
    await m.channel?.send(`U did it u made a pickban order\nHere's the pickban order:\n${sets.map(s => `${sets.length === 1 ? `Set ${s.set}: ` : ""}${s.order.map(o => `\`${MapOrderTeam[o.team]} ${MapStatus[o.status]}\``).join(" ")}`).join("\n")}`);
}

const data = new SlashCommandBuilder()
    .setName("stage_order")
    .setDescription("Add map pickban order for a stage/round.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false);

const stageOrder: Command = {
    data,
    alternativeNames: ["order_stage", "order-stage","orders", "sorder", "stageo", "ostage", "stage-order", "stageorder", "orderstage"],
    category: "tournaments",
    subCategory: "stages",
    run,
};
    
export default stageOrder;
