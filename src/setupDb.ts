import { Connection } from "mysql2/promise";

export const setupDb = async (connection: Connection) => {
    await connection.query(`CREATE TABLE IF NOT EXISTS category (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL
    )`);

    await connection.query(`CREATE TABLE IF NOT EXISTS subcategory (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        category INT NOT NULL,
        name VARCHAR(255) NOT NULL
    )`);

    await connection.query(`CREATE TABLE IF NOT EXISTS question_pool (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        subcategory INT NOT NULL,
        question TEXT NOT NULL,
        option0 TEXT NOT NULL,
        option1 TEXT NOT NULL,
        option2 TEXT NOT NULL,
        option3 TEXT NOT NULL,
        answer INT NOT NULL,
        answer_description TEXT NOT NULL
    )`);

    await connection.query(`CREATE TABLE IF NOT EXISTS scoreboard (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        owner VARCHAR(11) NOT NULL,
        channel VARCHAR(11) NOT NULL,
        end_date TIMESTAMP,
        created_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);

    await connection.query(`CREATE TABLE IF NOT EXISTS question (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        scoreboard INT NOT NULL,
        question INT NOT NULL,
        reveal BOOLEAN NOT NULL,
        created_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);

    await connection.query(`CREATE TABLE IF NOT EXISTS answer (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        owner VARCHAR(11) NOT NULL,
        question INT NOT NULL,
        answer INT NOT NULL,
        created_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);
};