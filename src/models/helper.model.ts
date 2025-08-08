import mongoose, { Schema, Document } from "mongoose";

interface IKYCDocument {
  type: string;
  url: string;
  filename: string;
  filesize: number;
}

interface IAdditionalDocument {
  name: string;
  url: string;
}

interface IPersonalDetails {
  fullName: string;
  gender: string;
  languages: string[];
  phone: string;
  email: string;
  kycDocument: IKYCDocument;
  additionalDocuments: IAdditionalDocument[];
}

interface IServiceDetails {
  type: string;
  organization: string;
  assignedHouseholds: string[];
  joinedOn: Date;
}

interface IVehicleDetails {
  type: string;
  number?: string;
}

export interface IHelper extends Document {
  personalDetails: IPersonalDetails;
  serviceDetails: IServiceDetails;
  vehicleDetails: IVehicleDetails;
  employee: mongoose.Types.ObjectId;
}

const HelperSchema: Schema = new Schema<IHelper>(
  {
    personalDetails: {
      fullName: { type: String, required: true },
      gender: {
        type: String,
        enum: ["Male", "Female", "Other"],
        required: true,
      },
      languages: [{ type: String }],
      phone: { type: String, required: true },
      email: { type: String, required: true },
      kycDocument: {
        type: {
          type: String,
          enum: ["Aadhar Card", "PAN Card", "Voter ID", "Passport"],
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
        enum: ["Maid", "Cook", "Nurse", "Driver"],
        required: true,
      },
      organization: { type: String, required: true },
      assignedHouseholds: [{ type: String }],
      joinedOn: { type: Date, required: true },
    },
    vehicleDetails: {
      type: {
        type: String,
        enum: ["None", "Auto", "Bike", "Car"],
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
