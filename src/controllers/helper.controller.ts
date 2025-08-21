import puppeteer from "puppeteer";
import path from "path";
import ejs from "ejs";
import moment from "moment";
import { Request as ExpressRequest, Response as ExpressResponse } from "express";
import { Helper } from "../models/helper.model";
import { Employee, IEmployee } from "../models/employee.model";
import { Counter } from "../models/counter.model";
import { generatePdf } from "../utils/pdf-generator";
import { compressPdfBufferToBuffer } from "../utils/file-compressor";
import { SupabaseService } from "../services/supabase.service";
import { APP_CONFIG } from "../env";
import { IHelperIdCardData } from "../interfaces/idcard.interface";

// Generate ID card and save in the helper employee details identificard card
export const generateIDCard = async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const formatDate = (date: Date) => {
      const d = new Date(date);
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    };
    const extractCountryCodeAndLocalNumber = (phoneNumber: string): string => {
      // Returns both country code and the rest of the phone number
      if (!phoneNumber) {
        return "";
      }
      const countryCodes = [
        212, 213, 216, 218, 220, 221, 222, 223, 224, 225, 226, 227, 228, 229, 230, 231, 232, 233, 234, 235, 236, 237, 238, 239, 240, 241, 242, 243, 244, 245, 246, 247, 248, 249, 250, 251, 252, 253, 254, 255, 256, 257, 258, 260, 261, 262, 263, 264, 265, 266, 267, 268, 269, 290, 291, 297, 298, 299, 350, 351, 352, 353, 354, 355, 356, 357, 358, 359, 370, 371, 372, 373, 374, 375, 376, 377, 378, 379,
        380, 381, 382, 383, 385, 386, 387, 389, 590, 591, 592, 593, 594, 595, 596, 597, 598, 599, 670, 671, 672, 673, 674, 675, 676, 677, 678, 679, 680, 681, 682, 683, 685, 686, 687, 688, 689, 690, 691, 692, 850, 852, 853, 855, 856, 880, 886, 1, 20, 27, 30, 31, 32, 33, 34, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 7, 81, 82, 84, 86,
        90, 91, 92, 93, 94, 95, 98,
      ].sort((a, b) => b.toString().length - a.toString().length);

      let countryCode = 91;
      let restPhone = phoneNumber;

      for (const code of countryCodes) {
        const codeStr = code.toString();
        if (phoneNumber.startsWith(codeStr)) {
          countryCode = Number(codeStr);
          restPhone = phoneNumber.substring(codeStr.length);
          break;
        }
      }
      return "+" + countryCode + " " + restPhone;
    };

    const helper = await Helper.findById(req.params.id).populate("employee", "employeeName employeephotoUrl identificationCardUrl employeeId _id");

    const EMPLOYEE_MONGODB_ID = helper?.employee._id;

    if (!helper) {
      return res.status(404).json({ error: "Helper not found" });
    }

    const employee = helper.employee as unknown as IEmployee | undefined;
    const data = {
      apiBaseUrl: APP_CONFIG.API_URL,
      employee_id: helper.employee._id,
      helperName: helper.personalDetails.fullName,
      employeephotoUrl: employee && "employeephotoUrl" in employee ? employee.employeephotoUrl : `https://ui-avatars.com/api/?name=${helper.personalDetails.fullName}&background=random&color=fff&rounded=true&bold=true&size=32`,
      serviceType: helper.serviceDetails.type,
      empId: employee && "employeeId" in employee ? employee.employeeId : "",
      organization: helper.serviceDetails.organization,
      phoneNumber: extractCountryCodeAndLocalNumber(helper.personalDetails.phone),
      joinedDate: formatDate(helper.serviceDetails.joinedOn),
    };

    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.setHeader("Content-Security-Policy", "img-src 'self' data: https://res.cloudinary.com;");

    const templatePath = path.join(process.cwd(), "src/views/helperIdCard.ejs");
    const htmlContent = await ejs.renderFile(templatePath, data, { async: true });

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      width: "650px",
      height: "435px",
      printBackground: true,
    });

    await browser.close();

    const compressedPdfBuffer = await compressPdfBufferToBuffer(Buffer.from(pdfBuffer));

    const helperFileName = data.helperName.split(" ").join("-").toLowerCase() + "-id-card" + ".pdf";

    const supabaseIDCARDDocumentUrl = await SupabaseService.uploadFileBuffer(compressedPdfBuffer, helperFileName, "application/pdf", APP_CONFIG.SUPABASE_BUCKET_NAME, APP_CONFIG.SUPABASE_HELPER_IDENTIFICATIONCARD_PDFS_FOLDERNAME);

    const updatedEmployee = await Employee.findByIdAndUpdate(EMPLOYEE_MONGODB_ID, { identificationCardUrl: supabaseIDCARDDocumentUrl }, { new: true });

    res.status(200).json({ result: "Succesfully Fetched ID Card", data: updatedEmployee });
  } catch (error) {
    console.error("Get ID Card Error", error);
    res.status(500).json({ error: "Failed to get helper id card" });
  }
};

// Redirects User to the Request ID-Card
export const getIDCard = async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const EMPLOYEE_ID = req.params.id;
    const employee = await Employee.findById(EMPLOYEE_ID).select("identificationCardUrl");
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }
    if (employee.identificationCardUrl) {
      return res.redirect(employee.identificationCardUrl);
    } else {
      return res.status(404).json({ error: "Identification card URL not found" });
    }
  } catch (error) {
    console.log("Error in Verifing ID Card", error);
  }
};

export const createHelper = async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const { personalDetails, serviceDetails, vehicleDetails, employee } = req.body;

    // Parse joinedOn to Date if it's a string
    if (serviceDetails && typeof serviceDetails.joinedOn === "string") {
      serviceDetails.joinedOn = moment(req.body.serviceDetails.joinedOn, "DD/MM/YYYY").toDate();
    }

    const employeeId = await getNextEmployeeId();
    const newEmployee = new Employee({
      employeeId: employeeId,
      employeeName: personalDetails.fullName,
      employeeDepartment: "Helpers",
      employeephotoUrl: employee && employee.employeephotoUrl ? employee.employeephotoUrl : "",
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

    res.status(201).json({
      message: "Helper created successfully",
      data: {
        helper: createdHelper,
        employee: createdEmployee,
      },
    });
  } catch (error) {
    console.error("Post Error", error);
    res.status(500).json({ error: "Failed to create helper" });
  }
};

export const getAllHelpers = async (_: ExpressRequest, res: ExpressResponse) => {
  const helpers = await Helper.find().populate("employee", "employeeId employeephotoUrl identificationCardUrl").limit(100);
  res.json(helpers);
};

export const getAllHelpersMetaData = async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const helpers = await Helper.find({}).populate("employee", "employeeName employeephotoUrl").select("serviceDetails.type serviceDetails.assignedHouseholds employee _id");
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

export const getHelpersPaged = async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const { offset = 1, limit = 10 } = req.query;

    const { filterOptions } = req.body;

    let pageNumber = Number.isNaN(Number(offset)) ? 0 : parseInt(offset as string, 10);
    const pageSize = Number.isNaN(Number(limit)) ? 10 : parseInt(limit as string, 10);

    // Ensure pageNumber is at least 1
    pageNumber = pageNumber < 1 ? 1 : pageNumber;

    const skip = (pageNumber - 1) * pageSize;
    const total = await Helper.countDocuments();

    // Build aggregation pipeline for advanced filtering and sorting
    const pipeline: any[] = [];

    // Join with Employee collection
    pipeline.push({
      $lookup: {
        from: "employees",
        localField: "employee",
        foreignField: "_id",
        as: "employee",
      },
    });
    pipeline.push({ $unwind: "$employee" });

    // Filtering
    const match: any = {};

    if (filterOptions) {
      // Filter by serviceTypes
      if (Array.isArray(filterOptions.serviceTypes) && filterOptions.serviceTypes.length > 0) {
        match["serviceDetails.type"] = { $in: filterOptions.serviceTypes };
      }
      // Filter by organizations
      if (Array.isArray(filterOptions.organizations) && filterOptions.organizations.length > 0) {
        match["serviceDetails.organization"] = { $in: filterOptions.organizations };
      }
      // Filter by joining date range
      if (filterOptions.joiningStartDate || filterOptions.joiningEndDate) {
        const joinedOnFilter: any = {};
        if (filterOptions.joiningStartDate) {
          joinedOnFilter.$gte = new Date(filterOptions.joiningStartDate);
        }
        if (filterOptions.joiningEndDate) {
          joinedOnFilter.$lte = new Date(filterOptions.joiningEndDate);
        }
        if (Object.keys(joinedOnFilter).length > 0) {
          match["serviceDetails.joinedOn"] = joinedOnFilter;
        }
      }
      // Search by name, employeeId, or phone
      if (filterOptions.searchHelperBasedOnNameEmployeeIdPhone && typeof filterOptions.searchHelperBasedOnNameEmployeeIdPhone === "string" && filterOptions.searchHelperBasedOnNameEmployeeIdPhone.trim() !== "") {
        const search = filterOptions.searchHelperBasedOnNameEmployeeIdPhone.trim();
        if (!match.$or) match.$or = [];
        match.$or.push({ "personalDetails.fullName": { $regex: search, $options: "i" } }, { "personalDetails.phone": { $regex: search, $options: "i" } });
      }
      if (filterOptions.searchHelperBasedOnNameEmployeeIdPhone && !isNaN(Number(filterOptions.searchHelperBasedOnNameEmployeeIdPhone))) {
        const search = Number(filterOptions.searchHelperBasedOnNameEmployeeIdPhone);
        if (!match.$or) match.$or = [];
        match.$or.push({ "employee.employeeId": search });
      }
    }

    if (Object.keys(match).length > 0) {
      pipeline.push({ $match: match });
    }

    // Sorting
    let sort: any = {};
    if (filterOptions && filterOptions.sortby) {
      const allowedSortFields = ["employeeName", "employeeId"];
      if (allowedSortFields.includes(filterOptions.sortby)) {
        if (filterOptions.sortby === "employeeName") {
          sort["employee.employeeName"] = 1;
        } else if (filterOptions.sortby === "employeeId") {
          sort["employee.employeeId"] = 1;
        }
      }
    }
    if (Object.keys(sort).length > 0) {
      pipeline.push({ $sort: sort });
    } else {
      pipeline.push({ $sort: { "employee.employeeName": 1 } });
    }

    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: pageSize });

    const helpers = await Helper.aggregate(pipeline);
    const filteredTotalDocuments = helpers.length;

    res.status(200).json({
      data: helpers,
      meta: {
        total,
        filteredTotal: filteredTotalDocuments,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(filteredTotalDocuments / pageSize),
      },
    });
  } catch (error) {
    console.log("Error in Get Heleprs Paged", error);
  }
};

export const getHelperById = async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const helper = await Helper.findById(req.params.id).populate("employee", "employeeName employeephotoUrl identificationCardUrl employeeId");
    if (!helper) {
      return res.status(404).json({ error: "Helper not found" });
    }
    res.status(200).json({ data: helper });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch helper by id" });
  }
};

export const updateHelper = async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const helper = await Helper.findById(req.params.id);
    if (!helper) {
      return res.status(404).json({ message: "Helper not found" });
    }

    const employeeId = helper.employee;

    if (req.body.employee) {
      await Employee.findByIdAndUpdate(employeeId, { $set: req.body.employee }, { new: true });
    }

    const { employee, ...helperUpdates } = req.body;

    if (helperUpdates.serviceDetails && typeof helperUpdates.serviceDetails.joinedOn === "string") {
      helperUpdates.serviceDetails.joinedOn = moment(helperUpdates.serviceDetails.joinedOn, "DD/MM/YYYY").toDate();
    }

    const updatedHelper = await Helper.findByIdAndUpdate(req.params.id, { $set: helperUpdates }, { new: true }).populate("employee"); // optional: to return updated employee details too

    res.status(200).json({
      result: "Helper Succesfully Updated",
      data: updatedHelper,
    });
  } catch (error) {
    res.status(500).json({ error: "Update Failed" });
  }
};

export const deleteHelperById = async (req: ExpressRequest, res: ExpressResponse) => {
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
  const counter = await Counter.findByIdAndUpdate({ _id: "employeeId" }, { $inc: { seq: 1 } }, { new: true, upsert: true });
  return counter.seq;
};

export const downloadIdCard = async (req: ExpressRequest, res: ExpressResponse) => {
  const userData: IHelperIdCardData = req.body;

  try {
    const pdf = await generatePdf(userData);
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="id-card.pdf"',
    });
    res.send(pdf);
  } catch (err) {
    res.status(500).json({ error: "Failed to generate ID card" });
  }
};
