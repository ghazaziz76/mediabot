const { Campaign } = require('./models');

Campaign.findByPk(3).then(campaign => {
  if (campaign) {
    console.log('Before update:', {
      name: campaign.name,
      isActive: campaign.isActive, 
      nextPostAt: campaign.nextPostAt
    });
    
    campaign.nextPostAt = null;
    return campaign.save();
  }
}).then(campaign => {
  if (campaign) {
    console.log('After update:', {
      name: campaign.name,
      isActive: campaign.isActive,
      nextPostAt: campaign.nextPostAt
    });
  }
  process.exit(0);
}).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});