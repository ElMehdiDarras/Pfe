// backend/routes/settings.js
const express = require('express');
const multer = require('multer');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { spawn } = require('child_process');
const RetentionSettings = require('../models/retentionSettings');
const { auth, isAdmin } = require('../middleware/auth');

// Get current retention settings
router.get('/retention', auth, async (req, res) => {
  try {
    const settings = await RetentionSettings.getSettings();
    res.json(settings);
  } catch (error) {
    console.error('Error fetching retention settings:', error);
    res.status(500).json({ error: 'Failed to fetch retention settings' });
  }
});
// Alternative backup method using MongoDB directly
router.get('/backup', auth, isAdmin, async (req, res) => {
  try {
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const filename = `backup-${timestamp}.json`;
    
    // Get all collections in the database
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    // Create a backup object with all collections
    const backup = {};
    
    for (const collection of collections) {
      const name = collection.name;
      const data = await mongoose.connection.db.collection(name).find({}).toArray();
      backup[name] = data;
    }
    
    // Set headers for file download
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.setHeader('Content-Type', 'application/json');
    
    // Send the backup data as JSON
    res.json(backup);
  } catch (error) {
    console.error('Backup error:', error);
    res.status(500).json({ error: 'Failed to create backup' });
  }
});

// Update retention settings (admin only)
router.put('/retention', auth, isAdmin, async (req, res) => {
  try {
    const { retentionPeriod } = req.body;
    
    // Validate input
    if (!retentionPeriod || isNaN(retentionPeriod)) {
      return res.status(400).json({ error: 'Valid retention period is required' });
    }
    
    // Convert to number and validate range
    const period = parseInt(retentionPeriod, 10);
    if (period < 1 || period > 365) {
      return res.status(400).json({ error: 'Retention period must be between 1 and 365 days' });
    }
    
    // Get existing settings
    let settings = await RetentionSettings.findOne();
    
    if (settings) {
      // Update existing
      settings.retentionPeriod = period;
      settings.updatedBy = req.user.username;
      settings.updatedAt = new Date();
    } else {
      // Create new
      settings = new RetentionSettings({
        retentionPeriod: period,
        updatedBy: req.user.username
      });
    }
    
    await settings.save();
    
    res.json(settings);
  } catch (error) {
    console.error('Error updating retention settings:', error);
    res.status(500).json({ error: 'Failed to update retention settings' });
  }
});
const upload = multer({
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit for backup files
  }
});

// Database restore endpoint
router.post('/restore', auth, isAdmin, upload.single('backupFile'), async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ error: 'No backup file provided' });
    }
    
    console.log('Processing uploaded backup file...');
    
    // Parse the JSON backup file
    let backup;
    try {
      backup = JSON.parse(req.file.buffer.toString('utf8'));
    } catch (parseError) {
      console.error('Error parsing backup file:', parseError);
      return res.status(400).json({ error: 'Invalid backup file format. File must contain valid JSON.' });
    }
    
    // Validate backup structure
    if (!backup || typeof backup !== 'object' || Object.keys(backup).length === 0) {
      return res.status(400).json({ error: 'Invalid backup structure. File must contain collection data.' });
    }
    
    console.log(`Backup contains ${Object.keys(backup).length} collections`);
    
    // Get MongoDB connection
    const db = mongoose.connection.db;
    
    // Array to store restore results for each collection
    const results = [];
    
    // IMPORTANT CHANGE: Better transaction support detection
    let transactionSupported = false;
    let session = null;
    
    try {
      // Check if we're running in replica set mode (required for transactions)
      const adminDb = mongoose.connection.db.admin();
      const serverInfo = await adminDb.serverStatus();
      
      if (serverInfo.repl && serverInfo.repl.setName) {
        // We have a replica set, try to create a session
        session = await mongoose.startSession();
        transactionSupported = true;
        console.log('Replica set detected, will use transactions for restore');
      } else {
        console.log('Not running in replica set mode, transactions will not be used');
      }
    } catch (err) {
      console.log('Error checking replica set status, will not use transactions:', err.message);
    }
    
    // Now proceed with or without transactions based on our detection
    if (transactionSupported && session) {
      try {
        console.log('Using transaction for restore process');
        await session.withTransaction(async () => {
          await performRestore(backup, db, results, session);
        });
      } catch (err) {
        console.error('Transaction failed, falling back to non-transactional restore:', err.message);
        // Reset results and try without transactions
        results.length = 0;
        await performRestore(backup, db, results);
      } finally {
        session.endSession();
      }
    } else {
      // Proceed without transactions
      console.log('Performing restore without transactions');
      await performRestore(backup, db, results);
    }
    
    // Log the restore operation for audit
    console.log(`Database restore completed by user ${req.user.username}`);
    
    // Return results
    res.json({
      success: true,
      message: 'Database restore completed successfully',
      collectionsRestored: results.length,
      details: results
    });
    
  } catch (error) {
    console.error('Database restore error:', error);
    res.status(500).json({ 
      error: 'Failed to restore database', 
      details: error.message 
    });
  }
});

// Helper function to perform the restore
async function performRestore(backup, db, results, session = null) {
  // Process each collection
  for (const [collectionName, documents] of Object.entries(backup)) {
    try {
      console.log(`Processing collection: ${collectionName}`);
      
      // Skip system collections (those with a "system." prefix)
      if (collectionName.startsWith('system.')) {
        console.log(`Skipping system collection: ${collectionName}`);
        results.push({
          collection: collectionName,
          status: 'skipped',
          reason: 'System collection'
        });
        continue;
      }
      
      // Validate documents array
      if (!Array.isArray(documents)) {
        console.log(`Invalid data for collection ${collectionName}, not an array`);
        results.push({
          collection: collectionName,
          status: 'error',
          reason: 'Invalid document format, expected array'
        });
        continue;
      }
      
      // Drop existing collection if it exists
      try {
        if (session) {
          await db.dropCollection(collectionName, { session });
        } else {
          await db.dropCollection(collectionName);
        }
        console.log(`Dropped existing collection: ${collectionName}`);
      } catch (dropError) {
        // Collection might not exist, which is fine
        console.log(`Collection ${collectionName} does not exist or couldn't be dropped: ${dropError.message}`);
      }
      
      // Skip if no documents to restore
      if (documents.length === 0) {
        console.log(`No documents to restore for collection: ${collectionName}`);
        results.push({
          collection: collectionName,
          status: 'success',
          docsRestored: 0
        });
        continue;
      }
      
      // Insert documents in batches for better performance
      const batchSize = 1000;
      const totalDocs = documents.length;
      let restoredCount = 0;
      
      // Process documents in batches
      for (let i = 0; i < totalDocs; i += batchSize) {
        const batch = documents.slice(i, i + batchSize);
        
        // Fix MongoDB _id fields (convert string _id back to ObjectId if needed)
        const processedBatch = batch.map(doc => {
          // Create a new object without __v and with proper _id
          const processedDoc = { ...doc };
          
          // Convert string _id to ObjectId if it has the right format
          if (doc._id && typeof doc._id === 'string' && /^[0-9a-fA-F]{24}$/.test(doc._id)) {
            try {
              processedDoc._id = new mongoose.Types.ObjectId(doc._id);
            } catch (err) {
              // Keep the original _id if conversion fails
            }
          }
          
          return processedDoc;
        });
        
        // Insert batch
        try {
          if (session) {
            await db.collection(collectionName).insertMany(processedBatch, { session });
          } else {
            await db.collection(collectionName).insertMany(processedBatch);
          }
          restoredCount += batch.length;
          console.log(`Restored ${restoredCount}/${totalDocs} documents in ${collectionName}`);
        } catch (insertError) {
          // Continue without transactions if a specific batch fails
          if (session) {
            throw insertError; // With transactions, rethrow to trigger rollback
          } else {
            console.error(`Error restoring batch in ${collectionName}:`, insertError);
            results.push({
              collection: collectionName,
              status: 'partial',
              docsRestored: restoredCount,
              error: insertError.message
            });
            continue;
          }
        }
      }
      
      // Add successful result
      results.push({
        collection: collectionName,
        status: 'success',
        docsRestored: restoredCount
      });
      
    } catch (collectionError) {
      console.error(`Error restoring collection ${collectionName}:`, collectionError);
      
      // Add error result
      results.push({
        collection: collectionName,
        status: 'error',
        error: collectionError.message
      });
      
      // With transactions, rethrow to trigger rollback
      if (session) throw collectionError;
    }
  }
}


module.exports = router;