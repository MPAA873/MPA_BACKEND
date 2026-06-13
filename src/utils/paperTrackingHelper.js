import PaperTracking from "../Modules/paperTracking/paperTracking.model.js";

export const addPaperLog = async ({
    manuscriptId,
    action,
    user,
    remarks = "",
    meta = {}
}) => {

    console.log("Creating Log :", manuscriptId, action);

    await PaperTracking.create({

        manuscriptId,

        action,

        performedBy: user?._id,

        role: user?.role,

        remarks,

        meta

    });

}