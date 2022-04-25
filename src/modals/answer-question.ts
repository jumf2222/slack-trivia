import { Block, KnownBlock, ModalView } from "@slack/bolt";

export const answerQuestionModal = (
    question: string,
    option0: string,
    option1: string,
    option2: string,
    option3: string,
    isCreator: boolean,
    reveal: boolean,
    answered: boolean,
    description: string,
    option0_style?: "danger" | "primary",
    option1_style?: "danger" | "primary",
    option2_style?: "danger" | "primary",
    option3_style?: "danger" | "primary",
): ModalView => {

    return {
        type: "modal",
        callback_id: "answer_question",
        title: {
            type: "plain_text",
            text: "Answer Trivia Question",
            emoji: true
        },
        ...(
            answered ? {} :
                {
                    submit: {
                        type: "plain_text",
                        text: "Answer",
                        emoji: true
                    },
                }
        ),
        close: {
            type: "plain_text",
            text: answered ? "Close" : "Cancel",
            emoji: true
        },
        blocks: [
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: question
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
                            text: option0,
                            emoji: true,
                        },
                        action_id: "select_option0",
                        value: "0",
                        style: option0_style,
                    },
                    {
                        type: "button",
                        text: {
                            type: "plain_text",
                            text: option1,
                            emoji: true
                        },
                        action_id: "select_option1",
                        value: "1",
                        style: option1_style,
                    },
                    {
                        type: "button",
                        text: {
                            type: "plain_text",
                            text: option2,
                            emoji: true
                        },
                        action_id: "select_option2",
                        value: "2",
                        style: option2_style,
                    },
                    {
                        type: "button",
                        text: {
                            type: "plain_text",
                            text: option3,
                            emoji: true
                        },
                        action_id: "select_option3",
                        value: "3",
                        style: option3_style,
                    }
                ]
            },
            ...(!description ? [] : [
                {
                    type: "section",
                    text: {
                        type: "mrkdwn",
                        text: description
                    }
                }] as (Block | KnownBlock)[]),
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
                            type: "checkboxes",
                            options: [
                                {
                                    text: {
                                        type: "plain_text",
                                        text: "Correct answer will be shown immediately after answering",
                                        emoji: true
                                    }
                                }
                            ],
                            ...(reveal ? {
                                initial_options: [
                                    {
                                        text: {
                                            type: "plain_text",
                                            text: "Correct answer will be shown immediately after answering",
                                            emoji: true
                                        }
                                    }
                                ]
                            } : {}),
                            action_id: "reveal"
                        }
                    }
                ] as (Block | KnownBlock)[]
            )
        ]
    };
};