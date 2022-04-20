import { App, BlockAction, ExpressReceiver, ExternalSelectAction, Option } from "@slack/bolt";
import dotenv from "dotenv";
import fs from "fs";
import mysql from "mysql2";
import { answerQuestionModal } from "./modals/answer-question";
import { createQuestionModal } from "./modals/create-question";
import { endMessage } from "./modals/end-message";
import { helpModal } from "./modals/help";
import { scoreboardModal } from "./modals/scoreboard";
import { setupDb } from "./setupDb";

dotenv.config();

const connection = mysql.createConnection({
    host: process.env.DATABASE_URL,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_DATABASE
}).promise();

const receiver = new ExpressReceiver({ signingSecret: process.env.SLACK_SIGNING_SECRET || "" });
const app = new App({ token: process.env.SLACK_BOT_TOKEN, receiver });

receiver.router.get("/services/ping", (req, res) => {
    console.log("HERE");
    res.status(200).json({ status: "ok" });
});

const flatten = (obj: any): any => {
    let output = {};

    for (const key of Object.keys(obj)) {
        output = { ...output, ...obj[key] };
    }

    return output;
};

app.command('/trivia', async ({ command, ack, client, body, respond, say }) => {
    await ack();

    try {
        let tokens = command.text.toLowerCase().trim().split(/\s+/);

        if (tokens.length !== 1) return await respond(`Unknown command ${command.text}.`);

        switch (tokens[0]) {
            case "help":
            case "": {
                await client.views.open({
                    trigger_id: body.trigger_id,
                    view: helpModal()
                });
                break;
            }
            case "question": {
                let scoreboardId = -1;
                let owner = "";
                let data = (await connection.execute("select * from scoreboard where channel = ? and end_date IS NULL", [command.channel_id]))[0] as mysql.RowDataPacket[];

                if (data.length === 0) {
                    scoreboardId = ((await connection.execute("insert into scoreboard (owner, channel) values (?, ?)", [command.user_id, command.channel_id]))[0] as mysql.ResultSetHeader).insertId;
                    owner = command.user_id;
                } else {
                    scoreboardId = data[0].id;
                    owner = data[0].owner;
                }

                await client.views.open({
                    trigger_id: body.trigger_id,
                    view: createQuestionModal("subcategory_select")
                });

                // await client.views.open({
                //     trigger_id: body.trigger_id,
                //     view: answerQuestionModal()
                // });
                break;
            } case "scoreboard": {
                await client.views.open({
                    trigger_id: body.trigger_id,
                    view: scoreboardModal()
                });
                break;
            } case "answer": {
                await client.views.open({
                    trigger_id: body.trigger_id,
                    view: answerQuestionModal(true)
                });
                break;
            }
            case "end": {
                let data = (await connection.execute("select * from scoreboard where channel = ? and end_date IS NULL", [command.channel_id]))[0] as mysql.RowDataPacket[];

                if (data.length === 0) {
                    return await respond(`There is no active scoreboard.`);
                }

                if (command.user_id !== data[0].owner) {
                    return await respond(`You do not have permission to end the scoreboard.`);
                }

                await connection.execute("update scoreboard set end_date = CURRENT_TIMESTAMP where id = ?", [data[0].id]);
                await say(endMessage());
                break;
            }
            default:
                await respond(`Unknown command ${command.text}.`);
                break;
        }
    }
    catch (error) {
        console.log(error);
    }
});

app.action<BlockAction<ExternalSelectAction>>("category_select", async ({ ack, client, body, respond, say }) => {
    await ack();
    let viewTemplate = undefined;

    if (JSON.parse(body.view!.private_metadata || "{}").category_select !== body.actions[0].selected_option!.value) {
        viewTemplate = JSON.parse(JSON.stringify(createQuestionModal("subcategory_select" + Math.random())));
        viewTemplate.private_metadata = JSON.stringify({ category_select: body.actions[0].selected_option!.value });
    }

    await client.views.update({
        view_id: body.view!.id,
        hash: body.view!.hash,
        view: viewTemplate,
    });
});

app.options("category_select", async ({ ack, client, body }) => {
    let data = (await connection.execute("select * from category", []))[0] as mysql.RowDataPacket[];

    await ack({
        options: [
            {
                text: {
                    type: "plain_text",
                    text: "Random"
                },
                value: "-1"
            },
            ...data.map(category => {
                return {
                    text: {
                        type: "plain_text",
                        text: category.name
                    },
                    value: category.id.toString()
                } as Option;
            })
        ]
    });
});

app.action<BlockAction<ExternalSelectAction>>("subcategory_select", async ({ ack, client, body, respond, say }) => {
    await ack();
});

app.options("subcategory_select", async ({ ack, client, body }) => {
    let data = (await connection.execute("select * from subcategory where category = ?", [Number(JSON.parse(body.view!.private_metadata || "{}").category_select)]))[0] as mysql.RowDataPacket[];

    await ack({
        options: [
            {
                text: {
                    type: "plain_text",
                    text: "Random"
                },
                value: "-1"
            },
            ...data.map(subcategory => {
                return {
                    text: {
                        type: "plain_text",
                        text: subcategory.name
                    },
                    value: subcategory.name
                } as Option;
            })
        ]
    });
});

app.view('create_question', async ({ ack, body }) => {
    console.log(body);
    await ack({ response_action: "clear" });
});

(async () => {
    await setupDb(connection);
    await app.start(process.env.PORT || 3000, {
        key: process.env.TLS_PRIVATE_KEY ? fs.readFileSync(process.env.TLS_PRIVATE_KEY) : undefined,
        cert: process.env.TLS_CERT ? fs.readFileSync(process.env.TLS_CERT) : undefined
    });
    console.log(`Slack Trivia is running on port ${process.env.PORT || 3000}!`);
})();