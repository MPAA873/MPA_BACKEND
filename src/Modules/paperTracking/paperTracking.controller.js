import PaperTracking from "./paperTracking.model.js";
import Manuscript from "../manuscript/manuscript.model.js";
import Review from "../review/review.model.js";

export const getPaperTracking = async (req, res) => {
  try {

   
    const tracking = await PaperTracking.find({
      manuscriptId: req.params.id
    })
      .populate("performedBy", "name email role")
      .sort({ createdAt: 1 });

  
    if (tracking.length > 0) {
      return res.status(200).json({
        success: true,
        tracking
      });
    }

    // 2. Old papers fallback timeline
    const manuscript = await Manuscript.findById(req.params.id)
      .populate("submittedBy", "name email role")
      .populate("assignedEditor", "name email role");

    if (!manuscript) {
      return res.status(404).json({
        success: false,
        message: "Manuscript not found"
      });
    }

    let fallbackTracking = [];

    // Paper Submitted
    fallbackTracking.push({
      action: "Paper Submitted",
      createdAt: manuscript.createdAt,
      performedBy: manuscript.submittedBy,
      role: manuscript.submittedBy?.role || "researcher"
    });

    // Editor Assigned
    if (manuscript.assignedEditor) {
      fallbackTracking.push({
        action: "Editor Assigned",
        createdAt: manuscript.updatedAt,
        performedBy: manuscript.assignedEditor,
        role: manuscript.assignedEditor?.role || "editor"
      });
    }

    // Review data
    const reviews = await Review.find({
      manuscriptId: manuscript._id
    })
      .populate("reviewerId", "name email role")
      .sort({ createdAt: 1 });

    // Reviewer invited
    if (reviews.length > 0) {
      fallbackTracking.push({
        action: "Reviewers Assigned",
        createdAt: reviews[0].createdAt,
        role: "editor"
      });
    }

    // Invitation accepted
    reviews
      .filter(r => r.invitationStatus === "Accepted")
      .forEach(r => {
        fallbackTracking.push({
          action: "Invitation Accepted",
          createdAt: r.updatedAt,
          performedBy: r.reviewerId,
          role: "reviewer"
        });
      });

    // Review submitted
    reviews
      .filter(r => r.reviewStatus === "Completed")
      .forEach(r => {
        fallbackTracking.push({
          action: "Review Submitted",
          createdAt: r.updatedAt,
          performedBy: r.reviewerId,
          role: "reviewer",
          meta: {
            recommendation: r.recommendation
          }
        });
      });

    // Revision submitted
    if (manuscript.isRevised) {
      fallbackTracking.push({
        action: "Revision Submitted",
        createdAt: manuscript.updatedAt,
        role: "researcher"
      });
    }

    // Accepted
    if (manuscript.acceptedAt) {
      fallbackTracking.push({
        action: "Paper Accepted",
        createdAt: manuscript.acceptedAt,
        role: "masterAdmin"
      });
    }

    // Published
    if (manuscript.publishedAt) {
      fallbackTracking.push({
        action: "Paper Published",
        createdAt: manuscript.publishedAt,
        role: "masterAdmin"
      });
    }

    // Sort by time
    fallbackTracking.sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    );

    return res.status(200).json({
      success: true,
      tracking: fallbackTracking
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message
    });

  }
};