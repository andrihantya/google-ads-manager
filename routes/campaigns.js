const express = require('express');
const router = express.Router();
const Campaign = require('../models/Campaign'); // Import model Campaign
const googleAds = require('../services/googleAdsService'); // Import Google Ads service

// Get all campaigns
router.get('/', async (req, res) => {
  try {
    const campaigns = await Campaign.find({ userId: req.user.id }); // Fetch campaigns for current user
    res.json(campaigns);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

// Create a new campaign (draft)
router.post('/', async (req, res) => {
  try {
    const newCampaign = new Campaign({
      ...req.body, 
      userId: req.user.id 
    }); 
    await newCampaign.save();

    // Send request to Google Ads API to create a draft campaign
    const response = await googleAds.createCampaignDraft(newCampaign); 
    // Assuming `googleAds.createCampaignDraft` returns a response object with status and data
    if (response.status === 'success') {
      // Update the draft status in the database
      newCampaign.draftStatus = 'pending'; 
      await newCampaign.save();
      res.status(201).json({ message: 'Campaign created successfully', campaignId: newCampaign.id, draftStatus: newCampaign.draftStatus });
    } else {
      // Handle errors from Google Ads API
      res.status(400).json({ error: 'Failed to create campaign' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

// Get a specific campaign
router.get('/:id', async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id); 
    if (campaign && campaign.userId === req.user.id) {
      res.json(campaign);
    } else {
      res.status(404).json({ error: 'Campaign not found' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch campaign' });
  }
});

// Update a campaign
router.put('/:id', async (req, res) => {
  try {
    const campaign = await Campaign.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (campaign && campaign.userId === req.user.id) {
      res.json(campaign);
    } else {
      res.status(404).json({ error: 'Campaign not found' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to update campaign' });
  }
});

// Delete a campaign
router.delete('/:id', async (req, res) => {
  try {
    const campaign = await Campaign.findByIdAndDelete(req.params.id);
    if (campaign && campaign.userId === req.user.id) {
      res.json({ message: 'Campaign deleted successfully' });
    } else {
      res.status(404).json({ error: 'Campaign not found' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete campaign' });
  }
});

module.exports = router;
