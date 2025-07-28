const db = require('./models');

console.log('Available models:', Object.keys(db));
console.log('Campaign model loaded:', !!db.Campaign);

if (db.Campaign) {
  db.Campaign.findByPk(3).then(campaign => {
    if (campaign) {
      console.log('Campaign found:', campaign.name);
      console.log('Has isReadyToPost method:', typeof campaign.isReadyToPost);
      console.log('Campaign prototype methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(campaign)));
    } else {
      console.log('Campaign 3 not found');
    }
    process.exit(0);
  }).catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
} else {
  console.log('Campaign model not found in db object');
  process.exit(1);
}