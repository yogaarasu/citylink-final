import mongoose from 'mongoose';

const issueSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['PENDING', 'IN_PROGRESS', 'RESOLVED'], default: 'PENDING' },
  category: { type: String, required: true },
  latitude: { type: Number },
  longitude: { type: Number },
  address: { type: String, required: true },
  imageUrls: [{ type: String }], // Array of Base64 strings or URLs
  resolutionImageUrl: { type: String },
  resolutionDate: { type: Number },
  rating: { type: Number },
  ratingComment: { type: String },
  authorId: { type: String, required: true },
  authorName: { type: String, required: true },
  city: { type: String, required: true },
  createdAt: { type: Number, default: Date.now },
  updatedAt: { type: Number, default: Date.now }
});

export default mongoose.model('Issue', issueSchema);