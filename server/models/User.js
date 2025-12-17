import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // Keeping string ID to match frontend UUIDs
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true, enum: ['SUPER_ADMIN', 'CITY_ADMIN', 'CITIZEN'] },
  phone: { type: String },
  city: { type: String },
  state: { type: String },
  address: { type: String },
  country: { type: String, default: 'India' },
  createdAt: { type: Number, default: Date.now }
});

export default mongoose.model('User', userSchema);