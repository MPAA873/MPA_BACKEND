import Issue from "./issue.model.js";


// Current volume
const getCurrentVolume = () => {
  const baseYear = 2026;
  return new Date().getFullYear() - baseYear + 1;
};



// Create Ad-Hoc Issue
export const createAdHocIssue = async (req, res) => {
  try {

    const { label } = req.body;

    if (!label) {
      return res.status(400).json({
        success: false,
        message: "Issue title is required",
      });
    }

    const currentVolume = getCurrentVolume();

    const lastIssue = await Issue.findOne({
      volume: currentVolume,
    }).sort({ issueNumber: -1 });

    const issueNumber = lastIssue
      ? lastIssue.issueNumber + 1
      : 1;

    const issue = await Issue.create({
      volume: currentVolume,
      issueNumber,
      label,
      isAdHoc: true,
    });

    res.status(201).json({
      success: true,
      message: "Ad-Hoc Issue created successfully",
      issue,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



// Get All Issues
export const getAdHocIssues = async (req, res) => {
  try {

    const issues = await Issue.find()
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: issues.length,
      issues,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


export const getAvailableIssues = async (req, res) => {

  try {

    const currentVolume = getCurrentVolume();

    const regularIssues =
      currentVolume === 1
        ? [
            { issueNumber: 1, label: "Apr-Jun" },
            { issueNumber: 2, label: "Jul-Sep" },
            { issueNumber: 3, label: "Oct-Dec" },
          ]
        : [
            { issueNumber: 1, label: "Jan-Mar" },
            { issueNumber: 2, label: "Apr-Jun" },
            { issueNumber: 3, label: "Jul-Sep" },
            { issueNumber: 4, label: "Oct-Dec" },
          ];

    const adHocIssues = await Issue.find({
      volume: currentVolume,
      status: "Active",
    });

    res.status(200).json({
      success: true,
      volume: currentVolume,
      regularIssues,
      adHocIssues,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};


// Update Issue
export const updateAdHocIssue = async (req, res) => {
  try {

    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: "Issue not found",
      });
    }

    issue.label = req.body.label || issue.label;
    issue.status = req.body.status || issue.status;

    await issue.save();

    res.status(200).json({
      success: true,
      message: "Issue updated successfully",
      issue,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



// Delete
export const deleteAdHocIssue = async (req, res) => {
  try {

    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: "Issue not found",
      });
    }

    await Issue.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Issue deleted successfully",
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};