import Jimp from "jimp";
import { gets3Key } from "../../../utils/s3";
import { buckets } from "../../../s3";
import { Team } from "../../../../Models/tournaments/team";

const SIZE_RESTRICTION = 512;

export async function createTeamImage (filepath: string) {
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

    return image;
}

export async function uploadTeamAvatar (team: Team, filepath: string) {
    const image = await createTeamImage(filepath);

    const s3Key = `${team.ID}_${Date.now()}.${image.getExtension()}`;
    const imgBuffer = await image.getBufferAsync(image.getMIME());

    await buckets.teamAvatars.putObject(s3Key, imgBuffer, image.getMIME());
    const url = await buckets.teamAvatars.getPublicUrl(s3Key);
    return url;
}

export async function deleteTeamAvatar (team: Team) {
    if (!team.avatarURL)
        return;

    const s3Key = gets3Key("teamAvatars", team.avatarURL);
    if (s3Key)
        await buckets.teamAvatars.deleteObject(s3Key);

    team.avatarURL = null;
    await team.save();
}