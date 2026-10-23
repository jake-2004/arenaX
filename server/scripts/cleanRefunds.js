import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI;

async function cleanAllRefunds() {
  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(uri, { tls: true, family: 4 });
  const db = mongoose.connection.db;

  const collections = await db.listCollections().toArray();
  for (const col of collections) {
    const c = db.collection(col.name);
    
    // Check payments or registrations with refund status
    const filter = {
      $or: [
        { payment_status: { $regex: 'refund', $options: 'i' } },
        { status: { $regex: 'refund', $options: 'i' } },
        { refund_id: { $exists: true, $ne: null } }
      ]
    };

    const count = await c.countDocuments(filter);
    if (count > 0) {
      console.log(`Found ${count} refund records in collection: ${col.name}`);
      const docs = await c.find(filter).toArray();
      for (const doc of docs) {
        console.log(`- Document ID: ${doc._id}, current payment_status: ${doc.payment_status}, refund_id: ${doc.refund_id}`);
      }

      // Update payment_status to 'Success' and unset all refund fields
      const updateRes = await c.updateMany(filter, {
        $set: {
          payment_status: 'Success'
        },
        $unset: {
          refund_id: '',
          refund_amount: '',
          refund_reason: '',
          refund_status: '',
          refund_date: '',
          refund: ''
        }
      });
      console.log(`Updated ${updateRes.modifiedCount} records in ${col.name} to Success!`);
    }
  }

  console.log('Finished cleaning all refund records from MongoDB Atlas.');
  await mongoose.disconnect();
}

cleanAllRefunds().catch(console.error);
