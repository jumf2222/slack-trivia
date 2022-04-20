export const endMessage = () => {
    return {
        blocks: [
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: "*Question:* <Question?>"
                }
            },
            {
                type: "divider"
            },
            {
                type: "actions",
                elements: [
                    {
                        type: "button",
                        text: {
                            type: "plain_text",
                            text: "Answer",
                            emoji: true
                        },
                        value: "click_me_123"
                    }
                ]
            }
        ]
    };
};