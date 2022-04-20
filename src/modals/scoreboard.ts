import { ModalView } from "@slack/bolt";

export const scoreboardModal = (): ModalView => {
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
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: "1. Brian Latchman | 500 Points"
                }
            },
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: "2. Tomasz Cieslak | 400 Points"
                }
            },
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: "3. Julian de Rushe | 300 Points"
                }
            },
            {
                type: "divider"
            },
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: "27. You | 0 Points"
                }
            }
        ]
    };
};