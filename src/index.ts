import { App, BlockAction, ButtonAction, CheckboxesAction, ExpressReceiver, ExternalSelectAction, Option } from "@slack/bolt";
import dotenv from "dotenv";
import fs from "fs";
import mysql from "mysql2";
import { endMessage } from "./messages/end-message";
import { questionMessage } from "./messages/question-message";
import { answerQuestionModal } from "./modals/answer-question";
import { createQuestionModal } from "./modals/create-question";
import { helpModal } from "./modals/help";
import { scoreboardModal } from "./modals/scoreboard";
import { loadQuestions } from "./questions";
import { setupDb } from "./setupDb";

const MEDALS = ["🥇", "🥈", "🥉"];

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
                    view: {
                        ...createQuestionModal("subcategory_select"),
                        private_metadata: JSON.stringify({ channel: command.channel_id, scoreboard: scoreboardId })
                    }
                });

                break;
            } case "scoreboard": {
                let data = (await connection.execute("select * from scoreboard where channel = ? and end_date IS NULL", [command.channel_id]))[0] as mysql.RowDataPacket[];

                if (data.length === 0) {
                    return await respond(`There is no active scoreboard.`);
                }

                let placements = (await connection.execute(`
                with scores as
                (select rank () over (order by sum(case when a.answer = p.answer then 1 else 0 end) desc) ranking,
                a.owner,
                sum(case when a.answer = p.answer then 1 else 0 end) as score
                from question q, question_pool p, answer a
                where q.question = p.id and a.question = q.id and q.scoreboard = ?
                group by a.owner
                order by ranking)
                select ranking, owner, score from scores where owner = ?
                union all
                select ranking, owner, score from scores limit 10`, [data[0].id, body.user_id]))[0] as mysql.RowDataPacket[];

                await client.views.open({
                    trigger_id: body.trigger_id,
                    view: scoreboardModal(placements
                        .slice((placements.length > 0 && placements[0].owner === body.user_id) ? 1 : 0)
                        .map((placement) => `${placement.ranking}. <@${placement.owner}> | ${placement.score} Points`),
                        (placements.length > 0 && placements[0].owner === body.user_id && placements[0].ranking > 10) ?
                            `${placements[0].ranking}. <@${placements[0].owner}> | ${placements[0].score} Points` : ""
                    )
                });
                break;
            }
            case "end": {
                let data = (await connection.execute("select * from scoreboard where channel = ? and end_date IS NULL", [command.channel_id]))[0] as mysql.RowDataPacket[];

                if (data.length === 0) {
                    return await respond(`There is no active scoreboard.`);
                }

                // if (command.user_id !== data[0].owner) {
                //     return await respond(`You do not have permission to end the scoreboard.`);
                // }

                await connection.execute("update scoreboard set end_date = CURRENT_TIMESTAMP where id = ?", [data[0].id]);

                let placements = (await connection.execute(`
                with scores as
                (select rank () over (order by sum(case when a.answer = p.answer then 1 else 0 end) desc) ranking,
                a.owner,
                sum(case when a.answer = p.answer then 1 else 0 end) as score
                from question q, question_pool p, answer a
                where q.question = p.id and a.question = q.id and q.scoreboard = ?
                group by a.owner
                order by ranking)
                select ranking, owner, score from scores where ranking <= 3`, [data[0].id]))[0] as mysql.RowDataPacket[];

                await say({ blocks: endMessage(placements.map((placement) => `${MEDALS[placement.ranking - 1]}. <@${placement.owner}> | ${placement.score} Points`)) });
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
    let viewTemplate: any = undefined;
    let data = JSON.parse(body.view!.private_metadata);

    if (data.category_select !== body.actions[0].selected_option!.value) {
        viewTemplate = { ...createQuestionModal("subcategory_select" + Math.random()) };
        viewTemplate.private_metadata = JSON.stringify({ ...data, category_select: body.actions[0].selected_option!.value });
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
    let data = (await connection.execute("select * from subcategory where category = ?", [Number(JSON.parse(body.view!.private_metadata).category_select)]))[0] as mysql.RowDataPacket[];

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
                    value: subcategory.id.toString()
                } as Option;
            })
        ]
    });
});

app.view('create_question', async ({ ack, body, client }) => {
    let metadata = JSON.parse(body.view!.private_metadata);
    let category = Number(flatten(body.view.state.values).category_select.selected_option.value);
    let subcategory = Number(flatten(body.view.state.values).subcategory_select.selected_option.value);

    if (category === -1) {
        category = ((await connection.execute("select id from category order by RAND() limit 1", []))[0] as mysql.RowDataPacket[])[0].id;
    }

    if (subcategory === -1) {
        subcategory = ((await connection.execute("select id from subcategory where category = ? order by RAND() limit 1", [category]))[0] as mysql.RowDataPacket[])[0].id;
    }

    let question = ((await connection.execute("select * from question_pool where subcategory = ? order by RAND() limit 1", [subcategory]))[0] as mysql.RowDataPacket[])[0];
    let message = await client.chat.postMessage({ channel: metadata.channel, blocks: questionMessage(question.question), text: "A new question has been created." });

    (await connection.execute("insert into question (owner, scoreboard, question, message) values (?, ?, ?, ?)", [body.user.id, metadata.scoreboard, question.id, message.ts]))[0] as mysql.RowDataPacket[];

    await ack({ response_action: "clear" });
});

app.action<BlockAction<ButtonAction>>("answer_question", async ({ ack, client, body, respond, say }) => {
    await ack();
    let question = ((await connection.execute("select p.*, q.owner, q.id as question_id, q.message, q.reveal, p.answer_description from question_pool p, question q, scoreboard s where q.message = ? and s.channel = ? and q.scoreboard = s.id and p.id = q.question", [body.message!.ts, body.channel!.id]))[0] as mysql.RowDataPacket[])[0];
    let answer = ((await connection.execute("select answer from answer where question = ? and owner = ?", [question.question_id, body.user.id]))[0] as mysql.RowDataPacket[])[0];

    await client.views.open({
        trigger_id: body.trigger_id,
        view: {
            ...answerQuestionModal(
                question.question,
                ((question.reveal && answer && answer.answer == 0) ? (answer.answer === question.answer ? "✓ " : "✗ ") : "") + question.option0,
                ((question.reveal && answer && answer.answer == 1) ? (answer.answer === question.answer ? "✓ " : "✗ ") : "") + question.option1,
                ((question.reveal && answer && answer.answer == 2) ? (answer.answer === question.answer ? "✓ " : "✗ ") : "") + question.option2,
                ((question.reveal && answer && answer.answer == 3) ? (answer.answer === question.answer ? "✓ " : "✗ ") : "") + question.option3,
                question.owner === body.user.id,
                question.reveal,
                answer !== undefined,
                (answer && question.reveal) ? question.answer_description : "",
                (answer && question.reveal) ? (question.answer === 0 ? "primary" : "danger") : (answer && answer.answer === 0 ? "primary" : undefined),
                (answer && question.reveal) ? (question.answer === 1 ? "primary" : "danger") : (answer && answer.answer === 1 ? "primary" : undefined),
                (answer && question.reveal) ? (question.answer === 2 ? "primary" : "danger") : (answer && answer.answer === 2 ? "primary" : undefined),
                (answer && question.reveal) ? (question.answer === 3 ? "primary" : "danger") : (answer && answer.answer === 3 ? "primary" : undefined),
            ),
            private_metadata: JSON.stringify({ question: question.question_id, selectedOption: -1, answer: answer ? answer.answer : -1 })
        }
    });
});

app.action<BlockAction<CheckboxesAction>>("reveal", async ({ ack, client, body, respond, say }) => {
    await ack();
    let metadata = JSON.parse(body.view!.private_metadata);
    let question = ((await connection.execute("update question set reveal = ? where id = ?", [body.actions[0].selected_options.length > 0, metadata.question]))[0] as mysql.RowDataPacket[])[0];
});

app.action<BlockAction<ButtonAction>>(/select_option\d*/, async ({ ack, client, body, respond, say }) => {
    await ack();

    let metadata = JSON.parse(body.view!.private_metadata);
    if (metadata.answer !== -1) return;

    let question = ((await connection.execute("select p.*, q.owner, q.message, q.reveal, p.answer_description from question_pool p, question q where q.id = ? and p.id = q.question", [metadata.question]))[0] as mysql.RowDataPacket[])[0];

    metadata.selectedOption = Number(body.actions[0].value);

    await client.views.update({
        view_id: body.view?.id,
        hash: body.view?.hash,
        view: {
            ...answerQuestionModal(
                question.question,
                ((question.reveal && metadata.answer == 0) ? (metadata.answer === question.answer ? "✓ " : "✗ ") : "") + question.option0,
                ((question.reveal && metadata.answer == 1) ? (metadata.answer === question.answer ? "✓ " : "✗ ") : "") + question.option1,
                ((question.reveal && metadata.answer == 2) ? (metadata.answer === question.answer ? "✓ " : "✗ ") : "") + question.option2,
                ((question.reveal && metadata.answer == 3) ? (metadata.answer === question.answer ? "✓ " : "✗ ") : "") + question.option3,
                question.owner === body.user.id,
                question.reveal,
                metadata.answer !== -1,
                (metadata.answer !== -1 && question.reveal) ? question.answer_description : "",
                (metadata.answer !== -1 && question.reveal) ? (question.answer === 0 ? "primary" : "danger") : (metadata.selectedOption === 0 ? "primary" : undefined),
                (metadata.answer !== -1 && question.reveal) ? (question.answer === 1 ? "primary" : "danger") : (metadata.selectedOption === 1 ? "primary" : undefined),
                (metadata.answer !== -1 && question.reveal) ? (question.answer === 2 ? "primary" : "danger") : (metadata.selectedOption === 2 ? "primary" : undefined),
                (metadata.answer !== -1 && question.reveal) ? (question.answer === 3 ? "primary" : "danger") : (metadata.selectedOption === 3 ? "primary" : undefined),
            ),
            private_metadata: JSON.stringify(metadata)
        }
    });
});

app.view('answer_question', async ({ ack, body, client }) => {
    let metadata = JSON.parse(body.view!.private_metadata);

    if (metadata.selectedOption === -1) return;

    let answer = ((await connection.execute("insert into answer (owner, question, answer) select ?, ?, ? where not exists (select * from answer where owner = ? and question = ? LIMIT 1)", [
        body.user.id,
        metadata.question,
        metadata.selectedOption,
        body.user.id,
        metadata.question,
    ]))[0] as mysql.RowDataPacket[])[0];

    let question = ((await connection.execute("select p.*, q.owner, q.message, q.reveal, p.answer_description from question_pool p, question q where q.id = ? and p.id = q.question", [metadata.question]))[0] as mysql.RowDataPacket[])[0];

    if (!question.reveal) return await ack();

    metadata.answer = metadata.selectedOption;

    await ack({
        response_action: "update",
        view: {
            ...answerQuestionModal(
                question.question,
                ((question.reveal && metadata.answer == 0) ? (metadata.answer === question.answer ? "✓ " : "✗ ") : "") + question.option0,
                ((question.reveal && metadata.answer == 1) ? (metadata.answer === question.answer ? "✓ " : "✗ ") : "") + question.option1,
                ((question.reveal && metadata.answer == 2) ? (metadata.answer === question.answer ? "✓ " : "✗ ") : "") + question.option2,
                ((question.reveal && metadata.answer == 3) ? (metadata.answer === question.answer ? "✓ " : "✗ ") : "") + question.option3,
                question.owner === body.user.id,
                question.reveal,
                metadata.answer !== -1,
                (metadata.answer !== -1 && question.reveal) ? question.answer_description : "",
                (metadata.answer !== -1 && question.reveal) ? (question.answer === 0 ? "primary" : "danger") : (metadata.selectedOption === 0 ? "primary" : undefined),
                (metadata.answer !== -1 && question.reveal) ? (question.answer === 1 ? "primary" : "danger") : (metadata.selectedOption === 1 ? "primary" : undefined),
                (metadata.answer !== -1 && question.reveal) ? (question.answer === 2 ? "primary" : "danger") : (metadata.selectedOption === 2 ? "primary" : undefined),
                (metadata.answer !== -1 && question.reveal) ? (question.answer === 3 ? "primary" : "danger") : (metadata.selectedOption === 3 ? "primary" : undefined),
            ),
            private_metadata: JSON.stringify(metadata)
        }
    });
});


(async () => {
    await setupDb(connection);
    await loadQuestions(connection);
    await app.start(process.env.PORT || 3000, (process.env.TLS_PRIVATE_KEY && process.env.TLS_CERT) ? {
        key: fs.readFileSync(process.env.TLS_PRIVATE_KEY),
        cert: fs.readFileSync(process.env.TLS_CERT!)
    } : undefined);
    console.log(`Slack Trivia is running on port ${process.env.PORT || 3000}!`);
})();