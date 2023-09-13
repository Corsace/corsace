import "centrifuge";
import { PublicationContext } from "centrifuge";
import { MapStatus } from "../Interfaces/matchup";
import { MappoolMap } from "../Models/tournaments/mappools/mappoolMap";
import { MatchupMap } from "../Models/tournaments/matchupMap";

declare module "centrifuge" {
    interface MapData {
        ID: number;
        map: MappoolMap;
        order: number;
        status: MapStatus;
    }

    interface CreatedData {
        type: "created";
        mpID: number;
        baseURL: string;
        firstSet: {
            ID: number;
            order: number;
            first?: number;
            maps: MatchupMap[];
            team1Score: number;
            team2Score: number;
        }
    }

    interface MessageData {
        type: "message";
        timestamp: Date;
        content: string;
        user: {
            ID: number;
            osu: {
                userID: string;
                username: string;
            };
        }
    }

    interface FirstData {
        type: "first";
        first?: number;
    }

    interface SettingsData {
        type: "settings";
        slots: {
            playerOsuID: number;
            slot: number;
            mods: string;
            team: string;
            ready: boolean;
        }[];
    }

    interface SelectMapData {
        type: "selectMap";
        map: MapData;
    }

    interface BeatmapData {
        type: "beatmap";
        beatmapID: number;
    }

    interface MatchStartedData {
        type: "matchStarted";
    }

    interface MatchAbortedData {
        type: "matchAborted";
    }

    interface MatchFinishedData {
        type: "matchFinished";
        setTeam1Score: number;
        setTeam2Score: number;
        team1Score: number;
        team2Score: number;
        map: MapData;
    }

    interface ClosedData {
        type: "closed";
    }

    type PublicationData =
        CreatedData |
        MessageData |
        FirstData |
        SettingsData |
        SelectMapData |
        BeatmapData |
        MatchStartedData |
        MatchAbortedData |
        MatchFinishedData |
        ClosedData;

    interface ExtendedPublicationContext extends PublicationContext {
        data: PublicationData;
    }
}