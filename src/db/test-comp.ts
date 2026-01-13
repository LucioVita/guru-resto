import bcrypt from 'bcryptjs';

async function test() {
    const pass = 'password123';
    const hash = '$2a$10$rZ4VKmXGKFdJKp4j6hQj3OxWr7VnB5KpBP.xOYqH0mB8sKkXBYvNK';
    const match = await bcrypt.compare(pass, hash);
    console.log('Match:', match);
    process.exit();
}

test();
