const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const checkUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    const users = await User.find({}, 'email');
    console.log('Registered Users:');
    users.forEach(u => console.log(`- ${u.email}`));
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
  }
};

checkUsers();
