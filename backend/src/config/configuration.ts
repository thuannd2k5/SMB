export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/smb_inventory',
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
  },
});
