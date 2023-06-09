import Jimp from "jimp";
import { promises } from "fs";
import { Team } from "../../../../Models/tournaments/team";


export async function uploadTeamAvatar (team: Team, filepath: string) {
    // Make the file size 256x256
    const image = await Jimp.read(filepath);
    const size = Math.min(Math.min(image.getWidth(), image.getHeight()), 256);
    image
        .contain(size, size)
        .deflateLevel(3)
        .quality(75);

    // Check if any avatar in the public folder exists with the team's ID
    const oldAvatars = await promises.readdir("./public/avatars");
    const oldAvatar = oldAvatars.filter(avatar => avatar.startsWith(`${team.ID}_`));
    await Promise.all(oldAvatar.map(avatar => promises.unlink(`./public/avatars/${avatar}`)));

    // Save the image
    const avatarPath = `./public/avatars/${team.ID}_${Date.now()}.${image.getExtension()}`;
    await image.writeAsync(avatarPath);

    return avatarPath;
}