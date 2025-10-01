const express = require('express');
const twilio = require('twilio');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();
app.use(express.json());
app.use(cors());
require('dotenv').config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = new twilio(accountSid, authToken);

// Corrected MongoDB connection string
const mongoURI = 'mongodb+srv://wrapper:wrapper@wrapper1.gm5kg.mongodb.net/'; // Added database name

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

app.post('/send-otp', async (req, res) => {
  const { phoneNumber, otp } = req.body;
  try {
    const message = await client.messages.create({
      from: '+12513334882', // Your Twilio SMS number
      body: `Your OTP is: ${otp}`,
      to: `+${phoneNumber}`, // Sending via SMS, no whatsapp: prefix
    });
    res.status(200).send({ message: 'OTP sent successfully', sid: message.sid });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).send({ error: 'Failed to send OTP' });
  }
});

// Transaction Schema
const transactionSchema = new mongoose.Schema({
  date: { 
      type: String, 
      required: true,
      validate: {
          validator: function(v) {
              return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(v);
          },
          message: props => `${props.value} is not a valid ISO date string!`
      }
  },
  type: { 
      type: String, 
      required: true,
      enum: ['income', 'expense'] // Add your valid transaction types here
  },
  category: { 
      type: String, 
      required: true,
      trim: true
  },
  amount: { 
      type: Number, 
      required: true,
      validate: {
          validator: function(v) {
              return !isNaN(v) && v !== 0;
          },
          message: props => `${props.value} is not a valid amount!`
      }
  },
  account: { 
      type: String, 
      required: true,
      trim: true
  },
  note: { 
      type: String, 
      default: '',
      trim: true
  }
}, {
  timestamps: true // Adds createdAt and updatedAt timestamps
});

const Transaction = mongoose.model('Transaction', transactionSchema);

// Upload transactions endpoint
app.post('/upload-transactions', async (req, res) => {
  try {
      // Validate request body
      if (!req.body.expenses || !Array.isArray(req.body.expenses)) {
          return res.status(400).json({
              success: false,
              message: 'Invalid request format. Expected an array of expenses.'
          });
      }

      // Validate and clean each transaction before insertion
      const cleanedTransactions = req.body.expenses.map((transaction, index) => ({
          date: transaction.date,
          type: transaction.type.toLowerCase(),
          category: transaction.category.trim(),
          amount: parseFloat(transaction.amount),
          account: transaction.account.trim(),
          note: transaction.note ? transaction.note.trim() : ''
      }));

      // Insert transactions
      const result = await Transaction.insertMany(cleanedTransactions, { 
          ordered: false, // Continues insertion even if some documents fail
          lean: true 
      });

      res.status(200).json({
          success: true,
          message: 'Transactions saved successfully',
          count: result.length,
          transactions: result
      });

  } catch (error) {
      console.error('Error saving transactions:', error);
      
      // Handle validation errors
      if (error.name === 'ValidationError') {
          return res.status(400).json({
              success: false,
              message: 'Validation failed',
              errors: Object.values(error.errors).map(err => ({
                  field: err.path,
                  message: err.message
              }))
          });
      }

      // Handle other errors
      res.status(500).json({
          success: false,
          message: 'Error saving transactions to database',
          error: error.message
      });
  }
});

// Download transactions endpoint
app.get('/download-transactions', async (req, res) => {
  try {
      // Add query parameters for filtering
      const query = {};
      const { startDate, endDate, type, category, account } = req.query;

      // Build query based on parameters
      if (startDate && endDate) {
          query.date = { $gte: startDate, $lte: endDate };
      }
      if (type) query.type = type;
      if (category) query.category = category;
      if (account) query.account = account;

      // Fetch transactions with pagination
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 100;
      const skip = (page - 1) * limit;

      const transactions = await Transaction.find(query)
          .sort({ date: -1 }) // Sort by date descending
          .skip(skip)
          .limit(limit)
          .lean(); // Convert documents to plain objects

      // Get total count for pagination
      const total = await Transaction.countDocuments(query);

      res.status(200).json({
          success: true,
          data: {
              transactions,
              pagination: {
                  total,
                  page,
                  limit,
                  pages: Math.ceil(total / limit)
              }
          }
      });

  } catch (error) {
      console.error('Error retrieving transactions:', error);
      res.status(500).json({
          success: false,
          message: 'Error retrieving transactions from database',
          error: error.message
      });
  }
});

// Add a cleanup endpoint for maintenance
app.delete('/cleanup-transactions', async (req, res) => {
  try {
      // Add authentication check here
      if (!req.headers.authorization) {
          return res.status(401).json({
              success: false,
              message: 'Authentication required'
          });
      }

      const result = await Transaction.deleteMany({
          date: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Older than 30 days
      });

      res.status(200).json({
          success: true,
          message: 'Old transactions cleaned up successfully',
          deletedCount: result.deletedCount
      });

  } catch (error) {
      console.error('Error during cleanup:', error);
      res.status(500).json({
          success: false,
          message: 'Error during cleanup operation',
          error: error.message
      });
  }
});

// Import and use the user route
const userRoute = require('./userroute');
app.use('/user', userRoute);

app.listen(8001, () => console.log('Server running on port 8001'));