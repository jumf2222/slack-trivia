import { ModalView } from "@slack/bolt";

export const createQuestionModal = (subCategoryID: string): ModalView => {
    return {
        type: "modal",
        callback_id: "create_question",
        title: {
            type: "plain_text",
            text: "Create Trivia Question",
            emoji: true
        },
        submit: {
            type: "plain_text",
            text: "Create",
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
                    text: "What type of question should be asked?"
                }
            },
            {
                type: "input",
                block_id: "category_select",
                dispatch_action: true,
                element: {
                    type: "external_select",
                    placeholder: {
                        type: "plain_text",
                        text: "Select a category",
                        emoji: true
                    },
                    action_id: "category_select",
                    min_query_length: 0,
                    initial_option: {
                        text: {
                            type: "plain_text",
                            text: "Random"
                        },
                        value: "-1"
                    }
                },
                label: {
                    type: "plain_text",
                    text: "Category",
                    emoji: true
                }
            },
            {
                type: "input",
                dispatch_action: true,
                block_id: subCategoryID,
                element: {
                    type: "external_select",
                    placeholder: {
                        type: "plain_text",
                        text: "Select a subcategory",
                        emoji: true
                    },
                    action_id: "subcategory_select",
                    min_query_length: 0,
                    initial_option: {
                        text: {
                            type: "plain_text",
                            text: "Random"
                        },
                        value: "-1"
                    }
                },
                label: {
                    type: "plain_text",
                    text: "Subcategory",
                    emoji: true
                }
            }
        ]
    };
};