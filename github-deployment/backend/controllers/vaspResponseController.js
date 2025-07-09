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
      additionalNotes,
      // New fields
      documentWorked,
      failureReasons,
      requiredDocuments,
      contactEmailUsed,
      contactEmailWorked,
      suggestedEmailUpdate,
      directContactName,
      directContactEmail,
      directContactTitle,
      responseQuality,
      dataFormat,
      fees,
      additionalRequirements,
      leoFriendlinessRating
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
        additionalNotes,
        // New fields
        documentWorked,
        failureReasons: failureReasons || [],
        requiredDocuments: requiredDocuments || [],
        contactEmailUsed,
        contactEmailWorked,
        suggestedEmailUpdate,
        directContactName,
        directContactEmail,
        directContactTitle,
        responseQuality,
        dataFormat,
        fees,
        additionalRequirements,
        leoFriendlinessRating: leoFriendlinessRating ? parseInt(leoFriendlinessRating) : null
      }
    });

    res.status(201).json(response);
  } catch (error) {
    console.error('Create VASP response error:', error);
    res.status(500).json({ error: 'Failed to create VASP response' });
  }
};

// Helper function to get human-readable failure reason labels
const getFailureReasonLabel = (reason) => {
  const labels = {
    'missing_case_number': 'Missing case number',
    'missing_badge_info': 'Missing badge/credential info',
    'wrong_email_format': 'Wrong email domain/format',
    'requires_subpoena': 'Requires subpoena',
    'requires_search_warrant': 'Requires search warrant',
    'requires_mlat': 'Requires MLAT',
    'no_us_service': 'Does not accept US service',
    'incorrect_contact': 'Contact info was incorrect',
    'no_response': 'No response received',
    'other': 'Other reason'
  };
  return labels[reason] || reason;
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

    // Calculate document effectiveness
    const documentsWorked = responses.filter(r => r.documentWorked === true).length;
    const documentsFailed = responses.filter(r => r.documentWorked === false).length;
    const documentsUnknown = responses.filter(r => r.documentWorked === null).length;
    const effectivenessRate = documentsWorked + documentsFailed > 0 
      ? Math.round((documentsWorked / (documentsWorked + documentsFailed)) * 100)
      : null;
      
    // Calculate effectiveness by document type
    const recordsResponses = responses.filter(r => r.documentType === 'records_request');
    const freezeResponses = responses.filter(r => r.documentType === 'freeze_request');
    
    const calculateTypeEffectiveness = (typeResponses) => {
      const worked = typeResponses.filter(r => r.documentWorked === true).length;
      const failed = typeResponses.filter(r => r.documentWorked === false).length;
      const total = worked + failed;
      
      if (total === 0) return null;
      
      // Get failure reasons for this type
      const failureReasons = typeResponses
        .filter(r => r.failureReasons && r.failureReasons.length > 0)
        .flatMap(r => r.failureReasons);
      
      const reasonCounts = failureReasons.reduce((acc, reason) => {
        acc[reason] = (acc[reason] || 0) + 1;
        return acc;
      }, {});
      
      return {
        rate: Math.round((worked / total) * 100),
        worked,
        failed,
        total,
        topFailureReasons: Object.entries(reasonCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 3)
          .map(([reason, count]) => ({ 
            reason, 
            count,
            label: getFailureReasonLabel(reason)
          }))
      };
    };
    
    const recordsEffectiveness = calculateTypeEffectiveness(recordsResponses);
    const freezeEffectiveness = calculateTypeEffectiveness(freezeResponses);
    
    // Collect direct contacts before calculating score
    const directContacts = responses
      .filter(r => r.directContactEmail && r.directContactName)
      .map(r => ({
        name: r.directContactName,
        email: r.directContactEmail,
        title: r.directContactTitle || 'Unknown'
      }))
      .reduce((acc, contact) => {
        // De-duplicate by email
        if (!acc.find(c => c.email === contact.email)) {
          acc.push(contact);
        }
        return acc;
      }, []);
    
    // Helper function for turnaround labels
    const getTurnaroundLabel = (key) => {
      const labels = {
        'less_than_24h': '<24 hours',
        '2_3_days': '2-3 days',
        '1_week_or_less': '≤1 week',
        '1_4_weeks': '1-4 weeks',
        'more_than_4_weeks': '>4 weeks'
      };
      return labels[key] || key;
    };
    
    // Calculate LEO Friendly Score (0-100)
    const calculateLEOScore = () => {
      let score = 0;
      let factors = [];
      
      // 1. Document Effectiveness (30 points max)
      if (effectivenessRate !== null) {
        const effectivenessPoints = Math.round((effectivenessRate / 100) * 30);
        score += effectivenessPoints;
        factors.push({
          category: 'Document Success Rate',
          points: effectivenessPoints,
          max: 30,
          detail: `${effectivenessRate}% success rate`
        });
      } else {
        factors.push({
          category: 'Document Success Rate',
          points: 0,
          max: 30,
          detail: 'No data available'
        });
      }
      
      // 2. Response Time (25 points max)
      const turnaroundScore = {
        'less_than_24h': 25,
        '2_3_days': 20,
        '1_week_or_less': 15,
        '1_4_weeks': 10,
        'more_than_4_weeks': 5
      };
      const timePoints = turnaroundScore[mostCommonTurnaround] || 10;
      score += timePoints;
      factors.push({
        category: 'Response Time',
        points: timePoints,
        max: 25,
        detail: mostCommonTurnaround ? getTurnaroundLabel(mostCommonTurnaround) : 'Unknown'
      });
      
      // 3. US Service Acceptance (15 points max)
      const usServicePoints = usCompliantPercentage >= 75 ? 15 : 
                             usCompliantPercentage >= 50 ? 10 :
                             usCompliantPercentage >= 25 ? 5 : 0;
      score += usServicePoints;
      factors.push({
        category: 'US Service Acceptance',
        points: usServicePoints,
        max: 15,
        detail: `${usCompliantPercentage}% US compliant`
      });
      
      // 4. Contact Reliability (15 points max)
      const emailsWorked = responses.filter(r => r.contactEmailWorked === true).length;
      const emailsTotal = responses.filter(r => r.contactEmailWorked !== null).length;
      const emailReliability = emailsTotal > 0 ? (emailsWorked / emailsTotal) * 100 : 50;
      const contactPoints = Math.round((emailReliability / 100) * 15);
      score += contactPoints;
      factors.push({
        category: 'Contact Reliability',
        points: contactPoints,
        max: 15,
        detail: emailsTotal > 0 ? `${Math.round(emailReliability)}% emails worked` : 'Limited data'
      });
      
      // 5. Helpful Direct Contacts (10 points max)
      const hasDirectContacts = directContacts.length > 0;
      const directContactPoints = hasDirectContacts ? 10 : 0;
      score += directContactPoints;
      factors.push({
        category: 'Direct Contacts Available',
        points: directContactPoints,
        max: 10,
        detail: hasDirectContacts ? `${directContacts.length} contacts shared` : 'None shared yet'
      });
      
      // 6. Community Engagement (5 points max)
      // Based on number of responses submitted
      const engagementPoints = Math.min(Math.floor(totalResponses / 5), 5);
      score += engagementPoints;
      factors.push({
        category: 'Community Data',
        points: engagementPoints,
        max: 5,
        detail: `${totalResponses} responses submitted`
      });
      
      // 7. Subjective LEO Friendliness (15 points max)
      // Based on user ratings
      const ratingsWithScore = responses.filter(r => r.leoFriendlinessRating !== null);
      if (ratingsWithScore.length > 0) {
        const avgRating = ratingsWithScore.reduce((sum, r) => sum + r.leoFriendlinessRating, 0) / ratingsWithScore.length;
        const subjectivePoints = Math.round((avgRating / 10) * 15);
        score += subjectivePoints;
        factors.push({
          category: 'User Experience Rating',
          points: subjectivePoints,
          max: 15,
          detail: `${avgRating.toFixed(1)}/10 average rating`
        });
      } else {
        factors.push({
          category: 'User Experience Rating',
          points: 0,
          max: 15,
          detail: 'No ratings yet'
        });
      }
      
      // Adjust total to account for new maximum of 110 points
      const maxPossibleScore = 110;
      const normalizedScore = Math.round((score / maxPossibleScore) * 100);
      
      return {
        score: Math.min(normalizedScore, 100),
        factors: factors,
        grade: normalizedScore >= 90 ? 'A' : 
               normalizedScore >= 80 ? 'B' :
               normalizedScore >= 70 ? 'C' :
               normalizedScore >= 60 ? 'D' : 'F'
      };
    };
    
    const leoScore = calculateLEOScore();

    // Aggregate failure reasons
    const allFailureReasons = responses
      .filter(r => r.failureReasons && r.failureReasons.length > 0)
      .flatMap(r => r.failureReasons);
    
    const failureReasonCounts = allFailureReasons.reduce((acc, reason) => {
      acc[reason] = (acc[reason] || 0) + 1;
      return acc;
    }, {});

    // Check for email updates
    const emailUpdates = responses
      .filter(r => r.suggestedEmailUpdate && r.contactEmailWorked === false)
      .map(r => r.suggestedEmailUpdate);

    res.json({
      vaspId: parseInt(vaspId),
      responseCount: totalResponses,
      hasData: true,
      leoScore: leoScore,
      effectiveness: {
        rate: effectivenessRate,
        worked: documentsWorked,
        failed: documentsFailed,
        unknown: documentsUnknown,
        failureReasons: failureReasonCounts,
        topFailureReasons: Object.entries(failureReasonCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 3)
          .map(([reason, count]) => ({ reason, count })),
        byType: {
          records_request: recordsEffectiveness,
          freeze_request: freezeEffectiveness
        }
      },
      contactInfo: {
        emailUpdatesSuggested: emailUpdates.length > 0,
        suggestedEmails: [...new Set(emailUpdates)],
        directContacts: directContacts
      },
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