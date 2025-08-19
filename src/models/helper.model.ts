import mongoose, { Schema, Document } from "mongoose";
import { gender, kycDocumentType, serviceType, vehicleType } from "../constants/enum";
import { IHelper } from "../interfaces/helper.interface";

const HelperSchema: Schema = new Schema<IHelper>(
  {
    personalDetails: {
      fullName: { type: String, required: true },
      gender: {
        type: String,
        enum: Object.values(gender),
        required: true,
      },
      languages: [{ type: String }],
      phone: { type: String, required: true },
      email: { type: String, required: true },
      kycDocument: {
        type: {
          type: String,
          enum: Object.values(kycDocumentType),
          required: true,
        },
        url: { type: String, required: true },
        filename: { type: String, required: true },
        filesize: { type: Number, required: true },
      },
      additionalDocuments: [
        {
          name: { type: String },
          url: { type: String },
        },
      ],
    },
    serviceDetails: {
      type: {
        type: String,
        enum: Object.values(serviceType),
        required: true,
      },
      organization: { type: String, required: true },
      assignedHouseholds: [{ type: String }],
      joinedOn: { type: Date, required: true },
    },
    vehicleDetails: {
      type: {
        type: String,
        enum: Object.values(vehicleType),
        required: true,
      },
      number: { type: String },
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
  },
  { timestamps: true }
);

export const Helper = mongoose.model<IHelper>("Helper", HelperSchema);
