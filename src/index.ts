import { connectDatabase } from "./database/mongodb";
import app from './app';
import { PORT } from './config';

async function startServer() {
    await connectDatabase();

    app.listen(
        PORT,
        '0.0.0.0',
        () => {
            console.log(`Server: http://localhost:${PORT}`);
        }
    );
}

startServer();