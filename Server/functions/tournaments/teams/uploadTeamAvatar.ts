import Jimp from "jimp";
import { promises } from "fs";
import { Team } from "../../../../Models/tournaments/team";

const SIZE_RESTRICTION = 256;

export async function uploadTeamAvatar (team: Team, filepath: string) {
    // First resize the image where the smaller side is SIZE_RESTRICTIONpx if the image is larger than SIZE_RESTRICTIONpx
    const image = await Jimp.read(filepath);
    if (image.getWidth() > SIZE_RESTRICTION || image.getHeight() > SIZE_RESTRICTION) {
        if (image.getWidth() > image.getHeight())
            image.resize(SIZE_RESTRICTION, Jimp.AUTO);
        else
            image.resize(Jimp.AUTO, SIZE_RESTRICTION);
    }

    // Then crop it to a SIZE_RESTRICTIONxSIZE_RESTRICTION square
    const size = Math.min(Math.min(image.getWidth(), image.getHeight()), SIZE_RESTRICTION);
    const x = Math.round((image.getWidth() - size) / 2);
    const y = Math.round((image.getHeight() - size) / 2);
    image.crop(x, y, size, size);

    // Check if any avatar in the public folder exists with the team's ID
    const oldAvatars = await promises.readdir("./public/avatars");
    const oldAvatar = oldAvatars.filter(avatar => avatar.startsWith(`${team.ID}_`));
    await Promise.all(oldAvatar.map(avatar => promises.unlink(`./public/avatars/${avatar}`)));

    // Save the image
    const avatarPath = `./public/avatars/${team.ID}_${Date.now()}.${image.getExtension()}`;
    await image.writeAsync(avatarPath);

    return avatarPath;
}