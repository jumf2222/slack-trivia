import { ModalView } from "@slack/bolt";

export const helpModal = (): ModalView => {
    return {
        type: "modal",
        title: {
            type: "plain_text",
            text: "Shopify Trivia",
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
                    text: "*Commands*"
                }
            },
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: "Create a question \n`/trivia question`"
                }
            },
            {
                type: "divider"
            },
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: "Show the scoreboard \n`/trivia scoreboard`"
                }
            },
            {
                type: "divider"
            },
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: "End current scoreboard, and shout-out the top 3 \n`/trivia end`"
                }
            },
            {
                type: "divider"
            },
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: "List all commands \n`/trivia help`"
                }
            },
            {
                type: "divider"
            },
            {
                type: "section",
                text: {
                    type: "plain_text",
                    text: "Created by Julian de Rushe and Brian Latchman, 2022",
                    emoji: true
                }
            }
        ]
    };
};