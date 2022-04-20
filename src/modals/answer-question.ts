import { Block, KnownBlock, ModalView } from "@slack/bolt";

export const answerQuestionModal = (isCreator: boolean): ModalView => {
    return {
        type: "modal",
        title: {
            type: "plain_text",
            text: "Answer Trivia Question",
            emoji: true
        },
        submit: {
            type: "plain_text",
            text: "Answer",
            emoji: true
        },
        close: {
            type: "plain_text",
            text: "Cancel",
            emoji: true
        },
        blocks: [
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: "What art movement is Andy Warhol most closely associated with?"
                }
            },
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: "*Select an answer*"
                }
            },
            {
                type: "actions",
                elements: [
                    {
                        type: "button",
                        text: {
                            type: "plain_text",
                            text: "Realism",
                            emoji: true
                        },
                        value: "click_me_123"
                    },
                    {
                        type: "button",
                        text: {
                            type: "plain_text",
                            text: "Pop Art",
                            emoji: true
                        },
                        value: "click_me_123"
                    },
                    {
                        type: "button",
                        text: {
                            type: "plain_text",
                            text: "Expressionism",
                            emoji: true
                        },
                        value: "click_me_123"
                    },
                    {
                        type: "button",
                        text: {
                            type: "plain_text",
                            text: "Surrealism",
                            emoji: true
                        },
                        value: "click_me_123"
                    }
                ]
            },
            ...(!isCreator ? [] :
                [
                    {
                        type: "divider"
                    },
                    {
                        type: "section",
                        text: {
                            type: "mrkdwn",
                            text: "*Reveal answer*"
                        },
                        accessory: {
                            type: "radio_buttons",
                            options: [
                                {
                                    text: {
                                        type: "plain_text",
                                        text: "Correct answer will be shown immediately after answering",
                                        emoji: true
                                    },
                                    value: "value-0"
                                }
                            ],
                            action_id: "radio_buttons-action"
                        }
                    }
                ] as (Block | KnownBlock)[]
            )
        ]
    };
};