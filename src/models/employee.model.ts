import mongoose, { Schema } from "mongoose";
import { employeeDepartment } from "../constants/enum";

export interface IEmployee {
  employeeId: number;
  employeeName: string;
  employeeDepartment: string;
  employeephotoUrl: string;
  identificationCardUrl: string;
}

const EmployeeSchema: Schema = new Schema(
  {
    employeeId: { type: Number, unique: true, index: true, required: true },
    employeeName: { type: String, required: true },
    employeeDepartment: {
      type: String,
      enum: Object.values(employeeDepartment),
      required: true,
      index: true,
    },
    employeephotoUrl: {
      type: String,
      required: true,
    },
    identificationCardUrl: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

export const Employee = mongoose.model<IEmployee>("Employee", EmployeeSchema);
