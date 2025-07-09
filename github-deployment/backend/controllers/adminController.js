const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

// VASP Management
const getVasps = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, isActive } = req.query;
    const skip = (page - 1) * limit;
    
    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { legal_name: { contains: search, mode: 'insensitive' } },
        { jurisdiction: { contains: search, mode: 'insensitive' } },
        { compliance_email: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }
    
    const [vasps, total] = await Promise.all([
      prisma.vasp.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { name: 'asc' }
      }),
      prisma.vasp.count({ where })
    ]);
    
    res.json({
      vasps,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching VASPs:', error);
    res.status(500).json({ error: 'Failed to fetch VASPs' });
  }
};

const createVasp = async (req, res) => {
  try {
    const vasp = await prisma.vasp.create({
      data: {
        name: req.body.name,
        legal_name: req.body.legal_name,
        jurisdiction: req.body.jurisdiction,
        compliance_email: req.body.compliance_email,
        compliance_contact: req.body.compliance_contact,
        service_address: req.body.service_address,
        phone: req.body.phone,
        processing_time: req.body.processing_time || '5-10 business days',
        preferred_method: req.body.preferred_method,
        required_document: req.body.required_document,
        info_types: req.body.info_types || [],
        service_types: req.body.service_types || [],
        accepts_us_service: req.body.accepts_us_service || false,
        has_own_portal: req.body.has_own_portal || false,
        law_enforcement_url: req.body.law_enforcement_url,
        notes: req.body.notes,
        // Request type specific fields
        records_processing_time: req.body.records_processing_time,
        records_required_document: req.body.records_required_document,
        records_accepts_us: req.body.records_accepts_us,
        records_jurisdictions: req.body.records_jurisdictions || [],
        freeze_processing_time: req.body.freeze_processing_time,
        freeze_required_document: req.body.freeze_required_document,
        freeze_accepts_us: req.body.freeze_accepts_us,
        freeze_jurisdictions: req.body.freeze_jurisdictions || []
      }
    });
    
    res.status(201).json(vasp);
  } catch (error) {
    console.error('Error creating VASP:', error);
    res.status(500).json({ error: 'Failed to create VASP' });
  }
};

const updateVasp = async (req, res) => {
  try {
    const { id } = req.params;
    
    const vasp = await prisma.vasp.update({
      where: { id: parseInt(id) },
      data: {
        name: req.body.name,
        legal_name: req.body.legal_name,
        jurisdiction: req.body.jurisdiction,
        compliance_email: req.body.compliance_email,
        compliance_contact: req.body.compliance_contact,
        service_address: req.body.service_address,
        phone: req.body.phone,
        processing_time: req.body.processing_time,
        preferred_method: req.body.preferred_method,
        required_document: req.body.required_document,
        info_types: req.body.info_types,
        service_types: req.body.service_types || [],
        accepts_us_service: req.body.accepts_us_service,
        has_own_portal: req.body.has_own_portal,
        law_enforcement_url: req.body.law_enforcement_url,
        notes: req.body.notes,
        isActive: req.body.isActive,
        // Request type specific fields
        records_processing_time: req.body.records_processing_time,
        records_required_document: req.body.records_required_document,
        records_accepts_us: req.body.records_accepts_us,
        records_jurisdictions: req.body.records_jurisdictions || [],
        freeze_processing_time: req.body.freeze_processing_time,
        freeze_required_document: req.body.freeze_required_document,
        freeze_accepts_us: req.body.freeze_accepts_us,
        freeze_jurisdictions: req.body.freeze_jurisdictions || []
      }
    });
    
    res.json(vasp);
  } catch (error) {
    console.error('Error updating VASP:', error);
    res.status(500).json({ error: 'Failed to update VASP' });
  }
};

const deleteVasp = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Soft delete by setting isActive to false
    await prisma.vasp.update({
      where: { id: parseInt(id) },
      data: { isActive: false }
    });
    
    res.json({ message: 'VASP deactivated successfully' });
  } catch (error) {
    console.error('Error deleting VASP:', error);
    res.status(500).json({ error: 'Failed to delete VASP' });
  }
};

// User Management
const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role, isApproved } = req.query;
    const skip = (page - 1) * limit;
    
    const where = {};
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { agencyName: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (role) {
      where.role = role;
    }
    if (isApproved !== undefined) {
      where.isApproved = isApproved === 'true';
    }
    
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          agencyName: true,
          badgeNumber: true,
          title: true,
          phone: true,
          role: true,
          isApproved: true,
          createdAt: true,
          _count: {
            select: {
              documents: true,
              comments: true
            }
          }
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);
    
    res.json({
      users,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

const approveUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await prisma.user.update({
      where: { id: userId },
      data: { isApproved: true }
    });
    
    res.json({ message: 'User approved successfully', user });
  } catch (error) {
    console.error('Error approving user:', error);
    res.status(500).json({ error: 'Failed to approve user' });
  }
};

const rejectUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    await prisma.user.delete({
      where: { id: userId }
    });
    
    res.json({ message: 'User rejected and removed' });
  } catch (error) {
    console.error('Error rejecting user:', error);
    res.status(500).json({ error: 'Failed to reject user' });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    
    // Only MASTER_ADMIN can update roles
    if (req.userRole !== 'MASTER_ADMIN') {
      return res.status(403).json({ error: 'Only master admin can update user roles' });
    }
    
    if (!['USER', 'ADMIN'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    
    // Prevent changing MASTER_ADMIN role
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, email: true }
    });
    
    if (targetUser.role === 'MASTER_ADMIN') {
      return res.status(403).json({ error: 'Cannot modify master admin role' });
    }
    
    const user = await prisma.user.update({
      where: { id: userId },
      data: { role }
    });
    
    res.json({ message: 'User role updated successfully', user });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
};

// VASP Submissions
const getSubmissions = async (req, res) => {
  try {
    const { status = 'PENDING' } = req.query;
    
    const submissions = await prisma.vaspSubmission.findMany({
      where: { status },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            agencyName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(submissions);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
};

const approveSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    
    // Get the submission
    const submission = await prisma.vaspSubmission.findUnique({
      where: { id: submissionId }
    });
    
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    
    // Create the VASP
    const vasp = await prisma.vasp.create({
      data: {
        name: submission.name,
        legal_name: submission.legal_name,
        jurisdiction: submission.jurisdiction,
        compliance_email: submission.compliance_email,
        compliance_contact: submission.compliance_contact,
        service_address: submission.service_address,
        phone: submission.phone,
        processing_time: submission.processing_time,
        preferred_method: submission.preferred_method,
        required_document: submission.required_document,
        info_types: submission.info_types,
        service_types: submission.service_types || [],
        accepts_us_service: submission.accepts_us_service,
        has_own_portal: submission.has_own_portal,
        law_enforcement_url: submission.law_enforcement_url,
        notes: submission.notes
      }
    });
    
    // Update submission status
    await prisma.vaspSubmission.update({
      where: { id: submissionId },
      data: {
        status: 'APPROVED',
        reviewedAt: new Date(),
        reviewedBy: req.userId
      }
    });
    
    res.json({ message: 'Submission approved and VASP created', vasp });
  } catch (error) {
    console.error('Error approving submission:', error);
    res.status(500).json({ error: 'Failed to approve submission' });
  }
};

const rejectSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { reason } = req.body;
    
    await prisma.vaspSubmission.update({
      where: { id: submissionId },
      data: {
        status: 'REJECTED',
        rejectionReason: reason,
        reviewedAt: new Date(),
        reviewedBy: req.userId
      }
    });
    
    res.json({ message: 'Submission rejected' });
  } catch (error) {
    console.error('Error rejecting submission:', error);
    res.status(500).json({ error: 'Failed to reject submission' });
  }
};

// Dashboard Stats
const getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      pendingUsers,
      totalVasps,
      activeVasps,
      pendingSubmissions,
      totalDocuments
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isApproved: false } }),
      prisma.vasp.count(),
      prisma.vasp.count({ where: { isActive: true } }),
      prisma.vaspSubmission.count({ where: { status: 'PENDING' } }),
      prisma.document.count()
    ]);
    
    res.json({
      totalUsers,
      pendingUsers,
      totalVasps,
      activeVasps,
      pendingSubmissions,
      totalDocuments
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};

// Get VASP update requests
const getUpdateRequests = async (req, res) => {
  try {
    const { status = 'PENDING' } = req.query;
    
    const updateRequests = await prisma.vaspUpdateRequest.findMany({
      where: {
        status
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            agencyName: true
          }
        },
        vasp: {
          select: {
            name: true,
            legal_name: true,
            jurisdiction: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    res.json(updateRequests);
  } catch (error) {
    console.error('Error fetching update requests:', error);
    res.status(500).json({ error: 'Failed to fetch update requests' });
  }
};

// Process update request (approve/reject)
const processUpdateRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, adminNotes } = req.body;
    
    if (!['APPROVED', 'REJECTED'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }
    
    const updateRequest = await prisma.vaspUpdateRequest.findUnique({
      where: { id }
    });
    
    if (!updateRequest) {
      return res.status(404).json({ error: 'Update request not found' });
    }
    
    // If approved, apply the changes
    if (action === 'APPROVED') {
      const changes = updateRequest.proposedChanges;
      
      // Update VASP
      await prisma.vasp.update({
        where: { id: updateRequest.vaspId },
        data: {
          name: changes.name,
          legal_name: changes.legal_name,
          compliance_email: changes.compliance_email,
          compliance_contact: changes.compliance_contact,
          service_address: changes.service_address,
          jurisdiction: changes.jurisdiction,
          service_types: changes.service_types,
          law_enforcement_url: changes.law_enforcement_url,
          records_required_document: changes.records_required_document,
          freeze_required_document: changes.freeze_required_document
        }
      });
      
      // Points are awarded automatically through the leaderboard calculation
      // which counts approved update requests
    }
    
    // Update request status
    const updatedRequest = await prisma.vaspUpdateRequest.update({
      where: { id },
      data: {
        status: action,
        adminNotes,
        updatedAt: new Date()
      }
    });
    
    res.json(updatedRequest);
  } catch (error) {
    console.error('Error processing update request:', error);
    res.status(500).json({ error: 'Failed to process update request' });
  }
};

module.exports = {
  // VASP Management
  getVasps,
  createVasp,
  updateVasp,
  deleteVasp,
  
  // User Management
  getUsers,
  approveUser,
  rejectUser,
  updateUserRole,
  
  // VASP Submissions
  getSubmissions,
  approveSubmission,
  rejectSubmission,
  
  // Dashboard
  getDashboardStats,
  
  // Update Requests
  getUpdateRequests,
  processUpdateRequest
};