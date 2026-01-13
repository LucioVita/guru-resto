import 'dotenv/config';
import { db } from './index';
import { users } from './schema';

async function listUsers() {
    const allUsers = await db.query.users.findMany();
    console.log(JSON.stringify(allUsers, null, 2));
    process.exit();
}

listUsers();
