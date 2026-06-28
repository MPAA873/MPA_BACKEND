import mongoose from "mongoose";

const issueSchema = new mongoose.Schema(
    {
        volume: {
            type: Number,
            required: true,
            index: true,
        },

        issueNumber: {
            type: Number,
            required: true,
        },

        label: {
            type: String,
            required: true,
            trim: true,
        },

        isAdHoc: {
            type: Boolean,
            default: true,
        },

        status: {
            type: String,
            enum: ["Active", "Archived"],
            default: "Active",
        },
    },
    {
        timestamps: true,
    }
);

issueSchema.index(
    {
        volume: 1,
        issueNumber: 1,
    },
    {
        unique: true,
    }
);
export default mongoose.model("Issue", issueSchema);