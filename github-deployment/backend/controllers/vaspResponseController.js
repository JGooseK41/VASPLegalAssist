const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Create a new VASP response
const createVaspResponse = async (req, res) => {
  try {
    const {
      documentId,
      vaspId,
      documentType,
      isUsCompliant,
      recordsRequestMethod,
      freezeRequestMethod,
      turnaroundTime,
      additionalNotes
    } = req.body;

    // Validate required fields
    if (!documentId || !vaspId || !documentType || isUsCompliant === undefined || !turnaroundTime) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify the document belongs to the user
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        userId: req.userId
      }
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found or access denied' });
    }

    // Check if user already submitted a response for this document
    const existingResponse = await prisma.vaspResponse.findFirst({
      where: {
        documentId,
        userId: req.userId
      }
    });

    if (existingResponse) {
      return res.status(400).json({ error: 'Response already submitted for this document' });
    }

    // Create the response
    const response = await prisma.vaspResponse.create({
      data: {
        userId: req.userId,
        vaspId: parseInt(vaspId),
        documentId,
        documentType,
        isUsCompliant,
        recordsRequestMethod,
        freezeRequestMethod,
        turnaroundTime,
        additionalNotes
      }
    });

    res.status(201).json(response);
  } catch (error) {
    console.error('Create VASP response error:', error);
    res.status(500).json({ error: 'Failed to create VASP response' });
  }
};

// Get aggregated VASP response data
const getVaspAggregatedData = async (req, res) => {
  try {
    const { vaspId } = req.params;

    // Get all responses for this VASP
    const responses = await prisma.vaspResponse.findMany({
      where: {
        vaspId: parseInt(vaspId)
      }
    });

    if (responses.length === 0) {
      return res.json({
        vaspId: parseInt(vaspId),
        responseCount: 0,
        hasData: false
      });
    }

    // Calculate aggregated data
    const totalResponses = responses.length;
    const usCompliantCount = responses.filter(r => r.isUsCompliant).length;
    const usCompliantPercentage = Math.round((usCompliantCount / totalResponses) * 100);

    // Aggregate records request methods
    const recordsResponses = responses.filter(r => r.recordsRequestMethod);
    const recordsMethodCounts = recordsResponses.reduce((acc, r) => {
      acc[r.recordsRequestMethod] = (acc[r.recordsRequestMethod] || 0) + 1;
      return acc;
    }, {});

    // Aggregate freeze request methods
    const freezeResponses = responses.filter(r => r.freezeRequestMethod);
    const freezeMethodCounts = freezeResponses.reduce((acc, r) => {
      acc[r.freezeRequestMethod] = (acc[r.freezeRequestMethod] || 0) + 1;
      return acc;
    }, {});

    // Aggregate turnaround times
    const turnaroundCounts = responses.reduce((acc, r) => {
      acc[r.turnaroundTime] = (acc[r.turnaroundTime] || 0) + 1;
      return acc;
    }, {});

    // Find most common turnaround time
    const mostCommonTurnaround = Object.entries(turnaroundCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0];

    res.json({
      vaspId: parseInt(vaspId),
      responseCount: totalResponses,
      hasData: true,
      usCompliant: {
        percentage: usCompliantPercentage,
        count: usCompliantCount,
        total: totalResponses
      },
      recordsRequest: {
        total: recordsResponses.length,
        methods: recordsMethodCounts,
        mostCommon: Object.entries(recordsMethodCounts)
          .sort(([,a], [,b]) => b - a)[0]?.[0] || null
      },
      freezeRequest: {
        total: freezeResponses.length,
        methods: freezeMethodCounts,
        mostCommon: Object.entries(freezeMethodCounts)
          .sort(([,a], [,b]) => b - a)[0]?.[0] || null
      },
      turnaroundTime: {
        distribution: turnaroundCounts,
        mostCommon: mostCommonTurnaround,
        averageCategory: mostCommonTurnaround
      }
    });
  } catch (error) {
    console.error('Get VASP aggregated data error:', error);
    res.status(500).json({ error: 'Failed to get VASP response data' });
  }
};

// Get user's VASP responses
const getUserVaspResponses = async (req, res) => {
  try {
    const responses = await prisma.vaspResponse.findMany({
      where: {
        userId: req.userId
      },
      include: {
        vasp: {
          select: {
            id: true,
            name: true,
            legal_name: true
          }
        },
        document: {
          select: {
            id: true,
            documentType: true,
            caseNumber: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(responses);
  } catch (error) {
    console.error('Get user VASP responses error:', error);
    res.status(500).json({ error: 'Failed to get user responses' });
  }
};

// Check if user has submitted response for a document
const checkDocumentResponse = async (req, res) => {
  try {
    const { documentId } = req.params;

    const response = await prisma.vaspResponse.findFirst({
      where: {
        documentId,
        userId: req.userId
      }
    });

    res.json({
      hasResponse: !!response,
      response
    });
  } catch (error) {
    console.error('Check document response error:', error);
    res.status(500).json({ error: 'Failed to check document response' });
  }
};

module.exports = {
  createVaspResponse,
  getVaspAggregatedData,
  getUserVaspResponses,
  checkDocumentResponse
};