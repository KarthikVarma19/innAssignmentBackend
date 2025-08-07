import { Response, Request } from "express";
import { Helper, IHelper } from "../models/helper-model";

import { Employee, IEmployee } from "../models/employee-model";
import { Counter } from "../models/counter-model";


export const createHelper = async (req: Request, res: Response) => {
  /*

  {
    personalDetails: {
      kycDocument: {
        type: 'PAN Card',
        url: 'https://res.cloudinary.com/karthikvarma/image/upload/v1754557244/inn-assignment/user_pdfs/GS-EEA-02-2526.pdf',
        filesize: 4107079,
        filename: 'GS-EEA-02-2526.pdf'
      },
      fullName: 'Karthik Varma Ganaraju',
      gender: 'male',
      languages: [ 'Telugu' ],
      phone: '91919676502330',
      email: 'ganarajukarthikvarma.le23.it@anits.edu.in',
      additionalDocuments: []
    },
    serviceDetails: {
      type: 'Cook',
      organization: 'Springs Helpers',
      assignedHouseholds: [],
      joinedOn: '07/08/2025'
    },
    vehicleDetails: { type: 'None' },
    employee: {
      employeephotoUrl: 'https://res.cloudinary.com/karthikvarma/image/upload/v1754560628/inn-assignment/user_images/Karthik%20Varma%20Ganaraju.jpg'
    }
  }

  const EmployeeSchema: Schema = new Schema(
    {
      employeeId: { type: Number, unique: true, index: true },
      employeeName: { type: String, required: true },
      employeeDepartment: { type: String, required: true, index: true },
      employeephotoUrl: { type: String, required: true },
      identificationCardUrl: { type: String, required: true },
    },
    {
      timestamps: true,
    }
  );
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
        phone: { type: String, required: true, unique: true },
        email: { type: String, required: true, unique: true },
        kycDocument: {
          type: {
            type: String,
            enum: ["Aadhar Card", "Pan Card", "Voter Id", "Passport"],
            required: true,
          },
          url: { type: String, required: true },
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
          enum: ["Maid", "Cook", "Nurse", "Doctor"],
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

  */
  try {
    const { personalDetails, serviceDetails, vehicleDetails, employee } =
      req.body;

    console.log(req.body);

    /*
    {
      personalDetails: {
        kycDocument: {
          type: 'PAN Card',
          url: 'https://res.cloudinary.com/karthikvarma/image/upload/v1754563185/inn-assignment/user_pdfs/GS-EEA-02-2526.pdf',
          filesize: 4107079,
          filename: 'GS-EEA-02-2526.pdf'
        },
        fullName: 'Karthik Varma Ganaraju',
        gender: 'male',
        languages: [ 'Telugu' ],
        phone: '91919676502330',
        email: 'ganarajukarthikvarma.le23.it@anits.edu.in',
        additionalDocuments: []
      },
      serviceDetails: {
        type: 'Cook',
        organization: 'Springs Helpers',
        assignedHouseholds: [],
        joinedOn: '07/08/2025'
      },
      vehicleDetails: { type: 'None' },
      employee: {
        employeephotoUrl: 'https://res.cloudinary.com/karthikvarma/image/upload/v1754563184/inn-assignment/user_images/Karthik%20Varma%20Ganaraju.jpg'
      }
    }


    */

    // Parse joinedOn to Date if it's a string
    if (serviceDetails && typeof serviceDetails.joinedOn === "string") {
      serviceDetails.joinedOn = new Date(serviceDetails.joinedOn);
    }

    const employeeId = await getNextEmployeeId();
    const newEmployee = new Employee({
      employeeId: employeeId,
      employeeName: personalDetails.fullName,
      employeeDepartment: "Helpers",
      employeephotoUrl: employee.employeephotoUrl,
      identificationCardUrl: "N/A",
    });

    const createdEmployee = await newEmployee.save();

    const newHelper = new Helper({
      personalDetails: {
        fullName: personalDetails.fullName,
        gender: personalDetails.gender,
        languages: personalDetails.languages,
        phone: personalDetails.phone,
        email: personalDetails.email,
        kycDocument: {
          type: personalDetails.kycDocument.type,
          url: personalDetails.kycDocument.url,
          filename: personalDetails.kycDocument.filename,
          filesize: personalDetails.kycDocument.filesize,
        },
        additionalDocuments: personalDetails.additionalDocuments || [],
      },
      serviceDetails: {
        type: serviceDetails.type,
        organization: serviceDetails.organization,
        assignedHouseholds: serviceDetails.assignedHouseholds || [],
        joinedOn: serviceDetails.joinedOn,
      },
      vehicleDetails: {
        type: vehicleDetails.type,
        number: vehicleDetails.number || "",
      },
      employee: createdEmployee._id,
    });

    const createdHelper = await newHelper.save();

    return res.status(201).json({
      message: "Helper created successfully",
      data: {
        helper: createHelper,
        employee: createdEmployee
      }
    });
  } catch (error) {
    console.error("Post Error", error);
    res.status(500).json({ error: "Failed to create helper" });
  }
};

export const getAllHelpers = async (_: Request, res: Response) => {
  const helpers = await Helper.find().populate(
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
    const helper = await Helper.findById(req.params.id)
      .populate("employee", "employeeName employeephotoUrl identificationCardUrl employeeId");
    if (!helper) {
      return res.status(404).json({ error: "Helper not found" });
    }
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

export const deleteHelperById = async (req: Request, res: Response) => {
  console.log("deleted controller");
  console.log(req.params.id);
  const id = req.params.id;
  try {
    const deleted = await Helper.findOneAndDelete({ _id: id });
    if (!deleted) {
      return res.status(404).json({ error: "Helper not found" });
    }
    res.json({ message: "Helper Deleted", data: deleted });
  } catch (error) {
    res.status(500).json({ error: "Delete Failed" });
  }
};


const getNextEmployeeId = async (): Promise<number> => {
  const counter = await Counter.findByIdAndUpdate(
    { _id: "employeeId" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter.seq;
};