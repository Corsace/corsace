import Jimp from "jimp";
import { promises } from "fs";
import { Team } from "../../../../Models/tournaments/team";


export async function saveTeamAvatar (team: Team, filepath: string) {
    // Make the file size 256x256
    const image = await Jimp.read(filepath);
    const size = Math.min(Math.min(image.getWidth(), image.getHeight()), 256);
    image
        .contain(size, size)
        .deflateLevel(3)
        .quality(75);

    // Remove previous avatar if it exists
    if (team.avatarURL)
        await promises.unlink(team.avatarURL);

    // Save the image
    const avatarPath = `./public/avatars/${team.ID}.png?${Date.now()}`;
    await image.writeAsync(avatarPath);

    return avatarPath;
}