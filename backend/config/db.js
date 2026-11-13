const mongoose = require('mongoose');

/**
 * The MongoDB connection.
 *
 * On a serverless runtime the process is started up for a request and
 * thrown away afterwards, so the connection is kept on the global object:
 * a warm instance reuses it instead of opening a new one for every
 * request. Opening a connection per request would exhaust the cluster's
 * connection limit quickly.
 */
let connecting = null;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return mongoose.connection;

  if (!connecting) {
    connecting = mongoose
      .connect(process.env.MONGO_URI)
      .then(() => {
        console.log('MongoDB Connected...');
        return mongoose.connection;
      })
      .catch((error) => {
        // The next attempt should try again rather than keep the failure.
        connecting = null;
        throw error;
      });
  }

  return connecting;
};

module.exports = connectDB;
