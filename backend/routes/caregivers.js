const express = require('express');
const { body, validationResult } = require('express-validator');
const CaregiverConnection = require('../models/CaregiverConnection');
const User = require('../models/User');
const { auth, requireCaregiver } = require('../middleware/auth');

const router = express.Router();

// Connect to elder by phone number
router.post('/connect-elder', auth, requireCaregiver, [
  body('contactNumber').trim().isLength({ min: 10 }).withMessage('Valid contact number is required')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { contactNumber } = req.body;
    const caregiverId = req.user.userId;

    // Find elder by contact number
    const elder = await User.findOne({ 
      contactNumber: contactNumber.trim(), 
      role: 2,
      isActive: true
    });

    if (!elder) {
      return res.status(404).json({
        success: false,
        message: 'No elder found with this contact number'
      });
    }

    // Check if already connected
    const existingConnection = await CaregiverConnection.findOne({
      caregiverId,
      elderId: elder.userId,
      connectionStatus: 'active'
    });

    if (existingConnection) {
      return res.status(400).json({
        success: false,
        message: 'Already connected to this elder'
      });
    }

    // Create connection
    const connection = new CaregiverConnection({
      caregiverId,
      elderId: elder.userId,
      elderName: elder.name,
      elderContactNumber: elder.contactNumber,
      elderEmail: elder.email,
      elderAge: elder.age
    });

    await connection.save();

    res.status(201).json({
      success: true,
      message: 'Successfully connected to elder',
      connection: {
        id: connection._id,
        elderId: elder.userId,
        elderName: elder.name,
        elderContactNumber: elder.contactNumber,
        elderEmail: elder.email,
        elderAge: elder.age,
        connectedAt: connection.connectedAt
      }
    });

  } catch (error) {
    console.error('Error connecting to elder:', error);
    res.status(500).json({
      success: false,
      message: 'Server error connecting to elder'
    });
  }
});

// Get caregiver's connected elders
router.get('/connections', auth, requireCaregiver, async (req, res) => {
  try {
    const caregiverId = req.user.userId;
    const { status = 'active' } = req.query;

    let query = { caregiverId };
    if (status !== 'all') {
      query.connectionStatus = status;
    }

    const connections = await CaregiverConnection.find(query)
      .sort({ connectedAt: -1 });

    res.json({
      success: true,
      connections: connections.map(conn => ({
        id: conn._id,
        elderId: conn.elderId,
        elderName: conn.elderName,
        elderContactNumber: conn.elderContactNumber,
        elderEmail: conn.elderEmail,
        elderAge: conn.elderAge,
        connectionStatus: conn.connectionStatus,
        connectedAt: conn.connectedAt,
        lastInteraction: conn.lastInteraction,
        notes: conn.notes
      }))
    });

  } catch (error) {
    console.error('Error fetching connections:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching connections'
    });
  }
});

// Get specific connection details
router.get('/connections/:connectionId', auth, requireCaregiver, async (req, res) => {
  try {
    const { connectionId } = req.params;
    const caregiverId = req.user.userId;

    const connection = await CaregiverConnection.findOne({
      _id: connectionId,
      caregiverId
    });

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: 'Connection not found'
      });
    }

    res.json({
      success: true,
      connection: {
        id: connection._id,
        elderId: connection.elderId,
        elderName: connection.elderName,
        elderContactNumber: connection.elderContactNumber,
        elderEmail: connection.elderEmail,
        elderAge: connection.elderAge,
        connectionStatus: connection.connectionStatus,
        connectedAt: connection.connectedAt,
        lastInteraction: connection.lastInteraction,
        notes: connection.notes
      }
    });

  } catch (error) {
    console.error('Error fetching connection details:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching connection details'
    });
  }
});

// Update connection (notes, status, etc.)
router.put('/connections/:connectionId', auth, requireCaregiver, [
  body('notes').optional().isLength({ max: 500 }).withMessage('Notes must be less than 500 characters'),
  body('connectionStatus').optional().isIn(['active', 'inactive', 'pending']).withMessage('Invalid status')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { connectionId } = req.params;
    const caregiverId = req.user.userId;
    const { notes, connectionStatus } = req.body;

    const updates = {};
    if (notes !== undefined) updates.notes = notes;
    if (connectionStatus !== undefined) updates.connectionStatus = connectionStatus;

    const connection = await CaregiverConnection.findOneAndUpdate(
      { _id: connectionId, caregiverId },
      updates,
      { new: true, runValidators: true }
    );

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: 'Connection not found'
      });
    }

    res.json({
      success: true,
      message: 'Connection updated successfully',
      connection: {
        id: connection._id,
        elderId: connection.elderId,
        elderName: connection.elderName,
        elderContactNumber: connection.elderContactNumber,
        elderEmail: connection.elderEmail,
        elderAge: connection.elderAge,
        connectionStatus: connection.connectionStatus,
        connectedAt: connection.connectedAt,
        lastInteraction: connection.lastInteraction,
        notes: connection.notes
      }
    });

  } catch (error) {
    console.error('Error updating connection:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating connection'
    });
  }
});

// Remove connection
router.delete('/connections/:connectionId', auth, requireCaregiver, async (req, res) => {
  try {
    const { connectionId } = req.params;
    const caregiverId = req.user.userId;

    const connection = await CaregiverConnection.findOneAndDelete({
      _id: connectionId,
      caregiverId
    });

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: 'Connection not found'
      });
    }

    res.json({
      success: true,
      message: 'Connection removed successfully'
    });

  } catch (error) {
    console.error('Error removing connection:', error);
    res.status(500).json({
      success: false,
      message: 'Server error removing connection'
    });
  }
});

// Search for elders by contact number (for connection)
router.get('/search-elders', auth, requireCaregiver, [
  body('contactNumber').trim().isLength({ min: 10 }).withMessage('Valid contact number is required')
], async (req, res) => {
  try {
    const { contactNumber } = req.query;

    if (!contactNumber) {
      return res.status(400).json({
        success: false,
        message: 'Contact number is required'
      });
    }

    const elder = await User.findOne({
      contactNumber: contactNumber.trim(),
      role: 2,
      isActive: true
    }).select('-password');

    if (!elder) {
      return res.status(404).json({
        success: false,
        message: 'No elder found with this contact number'
      });
    }

    // Check if already connected
    const existingConnection = await CaregiverConnection.findOne({
      caregiverId: req.user.userId,
      elderId: elder.userId,
      connectionStatus: 'active'
    });

    res.json({
      success: true,
      elder: {
        userId: elder.userId,
        name: elder.name,
        contactNumber: elder.contactNumber,
        email: elder.email,
        age: elder.age
      },
      alreadyConnected: !!existingConnection
    });

  } catch (error) {
    console.error('Error searching for elder:', error);
    res.status(500).json({
      success: false,
      message: 'Server error searching for elder'
    });
  }
});

module.exports = router;

