export const endMessage = () => {
    return [
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: "*That's a wrap on this round of Trivia, congratulations to the winners!*"
            }
        },
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: "🥇 <@U038JR46FEU> | 500 Points"
            }
        },
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: "🥈 @TC | 400 Points"
            }
        },
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: "🥉 @JDR | 300 Points"
            }
        }
    ];
};