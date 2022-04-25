export const questionMessage = (question: string) => {
    return [
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: `*Question:* ${question}`
            }
        },
        {
            type: "actions",
            elements: [
                {
                    type: "button",
                    text: {
                        type: "plain_text",
                        text: "Answer question",
                        emoji: true
                    },
                    action_id: "answer_question",
                    value: "click_me_123"
                }
            ]
        }
    ];
};