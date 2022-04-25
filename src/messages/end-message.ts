export const endMessage = (top3: string[]) => {
    return [
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: "*That's a wrap on this round of Trivia, congratulations to the winners!*"
            }
        },
        ...top3.map((placement) => {
            return {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: placement
                }
            };
        }),
    ];
};