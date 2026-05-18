const dotenv = require('dotenv');

// Polyfill for Object.hasOwn to support older Node.js versions (v14)
if (!Object.hasOwn) {
  Object.hasOwn = function(object, property) {
    return Object.prototype.hasOwnProperty.call(object, property);
  };
}

const User = require('./models/User');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const seedAdmin = async () => {
  try {
    const adminExists = await User.findOne({ username: 'admin' });
    if (!adminExists) {
      await User.create({
        username: 'admin',
        password: 'adminpassword',
        capability: 'admin'
      });
      console.log('Admin user created: admin / adminpassword');
    } else {
      console.log('Admin user already exists');
    }
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedAdmin();
