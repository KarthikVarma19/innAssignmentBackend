import mongoose from "mongoose";

export interface IKYCDocument {
  type: string;
  url: string;
  filename: string;
  filesize: number;
}

export interface IAdditionalDocument {
  name: string;
  url: string;
}

export interface IPersonalDetails {
  fullName: string;
  gender: string;
  languages: string[];
  phone: string;
  email: string;
  kycDocument: IKYCDocument;
  additionalDocuments: IAdditionalDocument[];
}

export interface IServiceDetails {
  type: string;
  organization: string;
  assignedHouseholds: string[];
  joinedOn: Date;
}

export interface IVehicleDetails {
  type: string;
  number?: string;
}

export interface IHelper extends Document {
  personalDetails: IPersonalDetails;
  serviceDetails: IServiceDetails;
  vehicleDetails: IVehicleDetails;
  employee: mongoose.Types.ObjectId;
}
