import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../Modals/UserSign.js';

dotenv.config();

// Ensure environment variables are provided, otherwise throw an error
const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;
const adminName = process.env.ADMIN_NAME || 'AirEase Admin';

if (!adminEmail || !adminPassword) {
  console.error("Error: ADMIN_EMAIL and ADMIN_PASSWORD must be set in environment variables.");
  process.exit(1);
}

const email = adminEmail.toLowerCase().trim();
const password = adminPassword;
const name = adminName;

const run = async () => {
  const mongoURI = process.env.MONGO_URI;
  if (!mongoURI) {
    console.error("Error: MONGO_URI must be set in environment variables.");
    process.exit(1);
  }
  
  await mongoose.connect(mongoURI);

  let user = await User.findOne({ email });

  if (user) {
    user.name = user.name || name;
    user.role = 'SuperAdmin';
    user.password = password;
    await user.save();
    console.log(`Super Admin updated: ${email}`);
  } else {
    user = await User.create({ name, email, password, role: 'SuperAdmin' });
    console.log(`Super Admin created: ${email}`);
  }

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
