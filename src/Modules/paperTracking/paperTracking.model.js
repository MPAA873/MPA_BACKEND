import mongoose from "mongoose";

const paperTrackingSchema = new mongoose.Schema(
{
    manuscriptId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Manuscript",
        required:true
    },

    action:{
        type:String,
        required:true
    },

    performedBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },

    role:{
        type:String
    },

    remarks:{
        type:String,
        default:""
    },

    meta:{
        type:mongoose.Schema.Types.Mixed,
        default:{}
    }

},
{
    timestamps:true
}
);

export default mongoose.model(
    "PaperTracking",
    paperTrackingSchema
);