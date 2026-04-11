import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/dok-db';

    await mongoose.connect(MONGO_URI);
    console.log('Connesso a MongoDB con successo!');
  } catch (error) {
    console.error('Errore di connessione a MongoDB:', error);
    process.exit(1);
  }
};

export default connectDB;