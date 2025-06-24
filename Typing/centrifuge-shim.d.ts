import "centrifuge";
import { PublicationContext } from "centrifuge";
import { Matchup, MatchupMap } from "../Interfaces/matchup";
import { BaseTeam, TeamList } from "../Interfaces/team";
import { UserMessage } from "../Interfaces/user";

declare module "centrifuge" {

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
        user: UserMessage;
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
            team: "Blue" | "Red";
            ready: boolean;
        }[];
    }

    interface SelectMapData {
        type: "selectMap";
        map: MatchupMap;
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
        setWinner?: number;
        team1Score: number;
        team2Score: number;
        map: MatchupMap;
    }

    interface ClosedData {
        type: "closed";
    }

    interface InviteData {
        type: "invite";
        team: BaseTeam;
    }

    interface TeamRegisteredData {
        type: "teamRegistered";
        team: TeamList;
    }

    interface IpcStateData {
        type: "ipcState";
        ipcState: string;
    }

    interface UpdateMatchupData<K extends keyof Matchup = keyof Matchup> {
        type: "updateMatchup";
        key: K;
        value: Matchup[K];
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
        ClosedData |
        InviteData |
        TeamRegisteredData |
        IpcStateData |
        UpdateMatchupData;

    interface ExtendedPublicationContext extends PublicationContext {
        data: PublicationData;
    }
}
