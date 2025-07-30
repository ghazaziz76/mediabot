const { Campaign } = require('../../models');

class ScheduleController {
  
  // Update campaign with advanced scheduling options
  async updateCampaignSchedule(req, res) {
    try {
      const { campaignId } = req.params;
      const {
        scheduleType,
        scheduledStartDate,
        scheduledEndDate,
        daysOfWeek,
        postingTimes,
        platformSchedules,
        isScheduleActive
      } = req.body;

      // Find the campaign
      const campaign = await Campaign.findByPk(campaignId);
      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      // Validate schedule data
      const validationError = this.validateScheduleData(req.body);
      if (validationError) {
        return res.status(400).json({ error: validationError });
      }

      // Update campaign with new schedule
      await campaign.update({
        scheduleType: scheduleType || 'interval',
        scheduledStartDate: scheduledStartDate || null,
        scheduledEndDate: scheduledEndDate || null,
        daysOfWeek: Array.isArray(daysOfWeek) ? daysOfWeek.join(',') : daysOfWeek,
        postingTimes: JSON.stringify(postingTimes || ['09:00']),
        platformSchedules: JSON.stringify(platformSchedules || {}),
        isScheduleActive: isScheduleActive !== undefined ? isScheduleActive : true
      });

      // Calculate next post time based on new schedule
      const nextPostTime = this.calculateNextPostTime(campaign);
      if (nextPostTime) {
        await campaign.update({ nextPostAt: nextPostTime });
      }

      res.json({
        success: true,
        message: 'Campaign schedule updated successfully',
        campaign: {
          id: campaign.id,
          name: campaign.name,
          scheduleType: campaign.scheduleType,
          scheduledStartDate: campaign.scheduledStartDate,
          scheduledEndDate: campaign.scheduledEndDate,
          daysOfWeek: campaign.daysOfWeek,
          postingTimes: JSON.parse(campaign.postingTimes || '["09:00"]'),
          platformSchedules: JSON.parse(campaign.platformSchedules || '{}'),
          isScheduleActive: campaign.isScheduleActive,
          nextPostAt: campaign.nextPostAt
        }
      });

    } catch (error) {
      console.error('Error updating campaign schedule:', error);
      res.status(500).json({ error: 'Failed to update campaign schedule' });
    }
  }

  // Get campaign schedule details
  async getCampaignSchedule(req, res) {
    try {
      const { campaignId } = req.params;

      const campaign = await Campaign.findByPk(campaignId);
      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      res.json({
        success: true,
        schedule: {
          id: campaign.id,
          name: campaign.name,
          scheduleType: campaign.scheduleType,
          scheduledStartDate: campaign.scheduledStartDate,
          scheduledEndDate: campaign.scheduledEndDate,
          daysOfWeek: campaign.daysOfWeek ? campaign.daysOfWeek.split(',').map(Number) : [1,2,3,4,5,6,7],
          postingTimes: JSON.parse(campaign.postingTimes || '["09:00"]'),
          platformSchedules: JSON.parse(campaign.platformSchedules || '{}'),
          isScheduleActive: campaign.isScheduleActive,
          nextPostAt: campaign.nextPostAt,
          intervalMinutes: campaign.intervalMinutes
        }
      });

    } catch (error) {
      console.error('Error getting campaign schedule:', error);
      res.status(500).json({ error: 'Failed to get campaign schedule' });
    }
  }

  // Check if campaign should post now based on advanced schedule
  async shouldCampaignPost(req, res) {
    try {
      const { campaignId } = req.params;

      const campaign = await Campaign.findByPk(campaignId);
      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      const shouldPost = this.checkIfShouldPost(campaign);
      const nextPostTime = this.calculateNextPostTime(campaign);

      res.json({
        success: true,
        shouldPost: shouldPost,
        nextPostTime: nextPostTime,
        currentTime: new Date(),
        scheduleActive: campaign.isScheduleActive
      });

    } catch (error) {
      console.error('Error checking if campaign should post:', error);
      res.status(500).json({ error: 'Failed to check posting schedule' });
    }
  }

  // HELPER METHODS

  validateScheduleData(data) {
    const { scheduleType, scheduledStartDate, scheduledEndDate, daysOfWeek, postingTimes } = data;

    // Validate schedule type
    const validTypes = ['interval', 'daily', 'weekly', 'custom'];
    if (scheduleType && !validTypes.includes(scheduleType)) {
      return 'Invalid schedule type. Must be: interval, daily, weekly, or custom';
    }

    // Validate dates
    if (scheduledStartDate && scheduledEndDate) {
      const startDate = new Date(scheduledStartDate);
      const endDate = new Date(scheduledEndDate);
      if (startDate >= endDate) {
        return 'Start date must be before end date';
      }
    }

    // Validate days of week
    if (daysOfWeek) {
      const days = Array.isArray(daysOfWeek) ? daysOfWeek : daysOfWeek.split(',').map(Number);
      const validDays = days.every(day => day >= 1 && day <= 7);
      if (!validDays) {
        return 'Invalid days of week. Must be numbers 1-7 (1=Monday, 7=Sunday)';
      }
    }

    // Validate posting times
    if (postingTimes && Array.isArray(postingTimes)) {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      const validTimes = postingTimes.every(time => timeRegex.test(time));
      if (!validTimes) {
        return 'Invalid posting times. Must be in HH:MM format (e.g., "09:00", "17:30")';
      }
    }

    return null; // No validation errors
  }

  checkIfShouldPost(campaign) {
    const now = new Date();

    // Check if schedule is active
    if (!campaign.isScheduleActive) {
      return false;
    }

    // Check start/end dates
    if (campaign.scheduledStartDate && now < new Date(campaign.scheduledStartDate)) {
      return false;
    }
    if (campaign.scheduledEndDate && now > new Date(campaign.scheduledEndDate)) {
      return false;
    }

    // Check day of week (1=Monday, 7=Sunday)
    const currentDay = now.getDay(); // 0=Sunday, 6=Saturday
    const dayOfWeekNumber = currentDay === 0 ? 7 : currentDay; // Convert to 1-7 format
    
    const allowedDays = campaign.daysOfWeek ? 
      campaign.daysOfWeek.split(',').map(Number) : 
      [1,2,3,4,5,6,7];
    
    if (!allowedDays.includes(dayOfWeekNumber)) {
      return false;
    }

    // For interval-based posting, use existing logic
    if (campaign.scheduleType === 'interval') {
      if (!campaign.nextPostAt) return true;
      return now >= new Date(campaign.nextPostAt);
    }

    // For time-based posting, check if current time matches posting times
    if (campaign.scheduleType === 'daily' || campaign.scheduleType === 'weekly') {
      const postingTimes = JSON.parse(campaign.postingTimes || '["09:00"]');
      const currentTime = now.toTimeString().substring(0, 5); // "HH:MM"
      
      return postingTimes.includes(currentTime);
    }

    return false;
  }

  calculateNextPostTime(campaign) {
    const now = new Date();

    if (campaign.scheduleType === 'interval') {
      // Use interval-based calculation
      const intervalMs = (campaign.intervalMinutes || 60) * 60 * 1000;
      return new Date(now.getTime() + intervalMs);
    }

    if (campaign.scheduleType === 'daily') {
      // Find next posting time today or tomorrow
      const postingTimes = JSON.parse(campaign.postingTimes || '["09:00"]');
      const allowedDays = campaign.daysOfWeek ? 
        campaign.daysOfWeek.split(',').map(Number) : 
        [1,2,3,4,5,6,7];

      return this.findNextTimeSlot(now, postingTimes, allowedDays);
    }

    return null;
  }

  findNextTimeSlot(now, postingTimes, allowedDays) {
    const currentTime = now.toTimeString().substring(0, 5);
    
    // Check if there's a posting time later today
    for (const time of postingTimes.sort()) {
      if (time > currentTime) {
        const today = new Date(now);
        const [hours, minutes] = time.split(':').map(Number);
        today.setHours(hours, minutes, 0, 0);
        
        // Check if today is an allowed day
        const todayNumber = today.getDay() === 0 ? 7 : today.getDay();
        if (allowedDays.includes(todayNumber)) {
          return today;
        }
      }
    }

    // Find next allowed day
    for (let i = 1; i <= 7; i++) {
      const nextDay = new Date(now);
      nextDay.setDate(now.getDate() + i);
      const nextDayNumber = nextDay.getDay() === 0 ? 7 : nextDay.getDay();
      
      if (allowedDays.includes(nextDayNumber)) {
        const firstTime = postingTimes.sort()[0];
        const [hours, minutes] = firstTime.split(':').map(Number);
        nextDay.setHours(hours, minutes, 0, 0);
        return nextDay;
      }
    }

    return null;
  }
}

module.exports = new ScheduleController();