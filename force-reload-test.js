// Clear require cache first
delete require.cache[require.resolve('./models/campaign.js')];
delete require.cache[require.resolve('./models/index.js')];

console.log('🔄 Cleared require cache...');

// Force reload models
const db = require('./models');

console.log('📦 Models loaded:', Object.keys(db));

// Test campaign loading
db.Campaign.findByPk(3).then(campaign => {
  if (campaign) {
    console.log('✅ Campaign found:', campaign.name);
    console.log('🔍 isReadyToPost type:', typeof campaign.isReadyToPost);
    
    // Check if method exists in constructor prototype
    console.log('🏗️ Constructor prototype methods:');
    console.log(Object.getOwnPropertyNames(campaign.constructor.prototype));
    
    // Try calling the method directly
    if (campaign.isReadyToPost) {
      console.log('✅ Method works! Result:', campaign.isReadyToPost());
    } else {
      console.log('❌ Method is missing from instance');
    }
  } else {
    console.log('❌ Campaign 3 not found');
  }
  process.exit(0);
}).catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});