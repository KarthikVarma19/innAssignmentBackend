import { Response, Request } from "express";
import { Helper, IHelper } from "../models/helper-model";

import { Employee, IEmployee } from "../models/employee-model";

/* Employee Collection

_id
688db9b7a96e1b84a3c63ba9
ObjectId

employeeId
EMP-105
String

employeeName
Meera Reddy
String

employeeDepartment
Maintenance
String

employeephotoUrl
https://randomuser.me/api/portraits/women/8.jpg
String

identificationCardUrl
https://cdn.example.com/idcards/emp105.png
String

createdAt
2025-08-01T07:23:22.444+00:00
Date

updatedAt
2025-08-01T07:23:22.444+00:00
Date

__v
0
Int32


*/


/* Helper Collection

_id
688dba24a96e1b84a3c63baa
ObjectId

personalDetails
Object

Object

fullName
Tanya Mehta
String

gender
Female
String

languages
Array (2)

Array
0
Gujarati
String
1
English
String

phone
9876543298
String

email
tanya.mehta@example.com
String

kycDocument
Object

Object
type
Aadhar Card
String

url
https://kyc.example.com/tanya_aadhar.pdf
String

additionalDocuments
Array (empty)

Array

serviceDetails
Object

Object
type
Maid

String
organization
CareWell Hospital

String

assignedHouseholds
Array (1)

Array
0
HH-1800

String
joinedOn
2023-08-30T00:00:00.000+00:00

Date

vehicleDetails
Object

Object
type
None
String

employee
688c6b6a39a3dd9fdb50b42e
ObjectId

createdAt
2025-08-01T07:23:23.091+00:00
Date

updatedAt
2025-08-01T07:23:23.091+00:00
Date

__v
0
Int32



*/

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
  const helpers = await Helper.find()
    .populate(
      "employee",
      "employeeId employeephotoUrl identificationCardUrl"
    );
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

