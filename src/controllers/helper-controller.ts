import { Response, Request } from "express";
import { Helper, IHelper } from "../models/helper-model";

import { Employee, IEmployee } from "../models/employee-model";

export const createHelper = async (req: Request, res: Response) => {
  try {
    const { personalDetails, serviceDetails, vehicleDetails, employeeDetails } =
      req.body;

    const newEmployee: Partial<IEmployee> = {
      employeeId: employeeDetails.employeeId,
      employeeName: personalDetails.fullName,
      employeeDepartment: employeeDetails.employeeDepartment,
      employeephotoUrl: employeeDetails.employeePhotoUrl,
      identificationCardUrl: employeeDetails.identificationCardUrl,
    };

    // Step 1: Save employee details first
    const createdEmployee = await Employee.create(newEmployee);

    const newHelper: Partial<IHelper> = {
      personalDetails,
      serviceDetails,
      vehicleDetails,
      employee: createdEmployee._id, // Reference
    };

    console.log(newHelper);

    // Step 2: Save helper with reference to employee
    const helper = await Helper.create(newHelper);

    return res.status(201).json({
      message: "Helper created successfully",
      data: helper,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to create helper" });
  }
};

export const getAllHelpers = async (_: Request, res: Response) => {
  const helpers = await Helper.find();
  console.log(helpers);
  res.json(helpers);
};

export const getAllHelpersMetaData = async (req: Request, res: Response) => {
  try {
    const helpers = await Helper.find({})
      .populate("employee", "employeeName employeephotoUrl")
      .select(
        "serviceDetails.type serviceDetails.assignedHouseholds employee _id"
      );
    const metadata = helpers.map((helper) => ({
      name: (helper.employee as any).employeeName,
      photoUrl: (helper.employee as any).employeephotoUrl,
      type: helper.serviceDetails.type,
      totalHouseholds: helper.serviceDetails.assignedHouseholds?.length || 0,
      helperObjectId: helper._id,
    }));
    res.status(200).json({ data: metadata });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch helpers metadata" });
  }
};

export const getHelperById = async (req: Request, res: Response) => {
  try {
    const helper = await Helper.find({ _id: req.params.id });
    res.status(200).json({ data: helper });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch helper by id" });
  }
};

export const updateHelper = async (req: Request, res: Response) => {
  try {
    const updated = await Helper.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updated) {
      return res.status(404).json({ error: "Helper Not Found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Update Failed" });
  }
};

export const deleteHelper = async (req: Request, res: Response) => {
  console.log(req.params.id);
  try {
    const deleted = await Helper.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Helper not found" });
      res.json({ message: "Helper Deleted" });
    }
  } catch (error) {
    res.status(500).json({ error: "Delete Failed" });
  }
};
