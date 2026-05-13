const mongoose = require('mongoose');
const User = require('./Backend/src/models/User');
const Staff = require('./Backend/src/models/Staff');
require('dotenv').config({ path: './Backend/.env' });

async function checkData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const users = await User.find({ role: 'staff' });
    console.log(`Found ${users.length} users with role 'staff'`);

    for (const user of users) {
      const staff = await Staff.findOne({ userId: user._id });
      console.log(`User: ${user.email} (ID: ${user._id}) -> Staff Record: ${staff ? 'EXISTS' : 'MISSING'}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkData();
