import * as SQLite from 'expo-sqlite';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

let db;
const initializeDatabase = async () => {
    db = await SQLite.openDatabaseAsync('expenses.db');
};

initializeDatabase();

export const backupService = {
    async exportToMongoDB() {
        await initializeDatabase();
        try {
            // Get user credentials
            const userDataStr = await SecureStore.getItemAsync('userData');
            if (!userDataStr) {
                throw new Error('User not authenticated');
            }
            const userData = JSON.parse(userDataStr);

            // Fetch all data from SQLite
            const expenses = await db.getAllAsync('SELECT * FROM expenses');
            
            // Transform and validate the data
            const transformedExpenses = expenses.map(expense => {
                const formattedDate = expense.date instanceof Date 
                    ? expense.date.toISOString() 
                    : new Date(expense.date).toISOString();

                return {
                    account: expense.account?.trim() || null,
                    amount: typeof expense.amount === 'string' 
                        ? parseFloat(expense.amount) 
                        : expense.amount,
                    category: expense.category?.trim() || null,
                    type: expense.type?.trim() || null,
                    date: formattedDate,
                    note: expense.note?.trim() || ''
                };
            });

            // Send to server with authentication
            const response = await axios.post(
                'http://172.29.49.198:8001/user/upload-expenses',
                { expenses: transformedExpenses },
                {
                    headers: {
                        Authorization: `Bearer ${userData.token}`
                    }
                }
            );
            
            return response.data;
        } catch (error) {
            throw new Error(`Export failed: ${error.message}`);
        }
    },

    async importFromQR(qrData) {
        await initializeDatabase();
        try {
            const { userId, token } = JSON.parse(qrData);

            // Fetch data from MongoDB using QR credentials
            const response = await axios.get(
                `http://172.29.49.198:8001/user/get-expenses/${userId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const transactions = response.data.expenses;

            // Import to SQLite
            await db.transactionAsync(async (tx) => {
                await tx.executeSqlAsync('DELETE FROM expenses');

                for (const transaction of transactions) {
                    await tx.executeSqlAsync(
                        'INSERT INTO expenses (amount, type, category, account, note, date) VALUES (?, ?, ?, ?, ?, ?)',
                        [
                            transaction.amount,
                            transaction.type,
                            transaction.category,
                            transaction.account,
                            transaction.note || '',
                            transaction.date
                        ]
                    );
                }
            });

            return { success: true, message: 'Data imported successfully' };
        } catch (error) {
            throw new Error(`Import failed: ${error.message}`);
        }
    }
};

export default backupService;