import { Block, KnownBlock, ModalView } from "@slack/bolt";

export const scoreboardModal = (top10: string[], placement: string): ModalView => {
    return {
        type: "modal",
        title: {
            type: "plain_text",
            text: "Scoreboard",
            emoji: true
        },
        close: {
            type: "plain_text",
            text: "Close",
            emoji: true
        },
        blocks: [
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: "*Top 10*"
                }
            },
            ...top10.map((placement) => {
                return {
                    type: "section",
                    text: {
                        type: "mrkdwn",
                        text: placement
                    }
                };
            }),
            ...(!placement ? [] : [
                {
                    type: "divider"
                },
                {
                    type: "section",
                    text: {
                        type: "mrkdwn",
                        text: placement
                    }
                }
            ] as (Block | KnownBlock)[]),
        ]
    };
};