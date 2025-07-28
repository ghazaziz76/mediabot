const { Campaign } = require('./models');

// Add method directly to loaded model
Campaign.prototype.isReadyToPost = function() {
  if (!this.isActive) {
    return false;
  }
  if (!this.nextPostAt) {
    return true;
  }
  return new Date() >= this.nextPostAt;
};

// Test it
Campaign.findByPk(3).then(campaign => {
  console.log('✅ Campaign found:', campaign.name);
  console.log('🔍 isReadyToPost type:', typeof campaign.isReadyToPost);
  if (campaign.isReadyToPost) {
    console.log('✅ Method result:', campaign.isReadyToPost());
  }
  process.exit(0);
});