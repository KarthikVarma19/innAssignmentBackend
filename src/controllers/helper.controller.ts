import puppeteer from "puppeteer";
import path from "path";
import ejs from "ejs";
import { Response, Request } from "express";
import { Helper, IHelper } from "../models/helper.model";
import { Employee, IEmployee } from "../models/employee.model";
import { Counter } from "../models/counter.model";
import { generatePdf } from "../utils/pdf-generator";
import { compressPdfBufferToBuffer } from "../utils/file-compressor";
import { SupabaseService } from "../services/supabase.service";
import { config } from "../env";
import { Readable } from "stream";

export const getIDCard = async (req: Request, res: Response) => {
  try {
    // Generate ID card and save in the helper employee details identificard card
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
        212, 213, 216, 218, 220, 221, 222, 223, 224, 225, 226, 227, 228, 229, 230, 231, 232, 233,
        234, 235, 236, 237, 238, 239, 240, 241, 242, 243, 244, 245, 246, 247, 248, 249, 250, 251,
        252, 253, 254, 255, 256, 257, 258, 260, 261, 262, 263, 264, 265, 266, 267, 268, 269, 290,
        291, 297, 298, 299, 350, 351, 352, 353, 354, 355, 356, 357, 358, 359, 370, 371, 372, 373,
        374, 375, 376, 377, 378, 379, 380, 381, 382, 383, 385, 386, 387, 389, 590, 591, 592, 593,
        594, 595, 596, 597, 598, 599, 670, 671, 672, 673, 674, 675, 676, 677, 678, 679, 680, 681,
        682, 683, 685, 686, 687, 688, 689, 690, 691, 692, 850, 852, 853, 855, 856, 880, 886, 1, 20,
        27, 30, 31, 32, 33, 34, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 51, 52, 53, 54, 55, 56,
        57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 7, 81, 82, 84, 86, 90, 91, 92, 93, 94, 95, 98,
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

    const helper = await Helper.findById(req.params.id).populate(
      "employee",
      "employeeName employeephotoUrl identificationCardUrl employeeId _id"
    );

    const EMPLOYEE_MONGODB_ID = helper?.employee._id;

    if (!helper) {
      return res.status(404).json({ error: "Helper not found" });
    }

    // Type assertion to treat employee as populated IEmployee
    const employee = helper.employee as unknown as IEmployee | undefined;
    const data = {
      apiBaseUrl: config.API_URL,
      employee_id: helper.employee._id,
      helperName: helper.personalDetails.fullName,
      employeephotoUrl:
        employee && "employeephotoUrl" in employee
          ? employee.employeephotoUrl
          : `https://ui-avatars.com/api/?name=${helper.personalDetails.fullName}&background=random&color=fff&rounded=true&bold=true&size=32`,
      serviceType: helper.serviceDetails.type,
      empId: employee && "employeeId" in employee ? employee.employeeId : "",
      organization: helper.serviceDetails.organization,
      phoneNumber: extractCountryCodeAndLocalNumber(helper.personalDetails.phone),
      joinedDate: formatDate(helper.serviceDetails.joinedOn),
    };

    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.setHeader("Content-Security-Policy", "img-src 'self' data: https://res.cloudinary.com;");
    // Render EJS template for preview (for debugging, not for production PDF)
    // return res.render("helperIdCard", data); // Uncomment if you want to render EJS in Express (requires view engine setup)

    const templatePath = path.join(process.cwd(), "src/views/helperIdCard.ejs");
    const htmlContent = await ejs.renderFile(templatePath, data, { async: true });

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      width: "610px",
      height: "460px",
      printBackground: true,
      pageRanges: "1",
    });

    await browser.close();

    const compressedPdfBuffer = await compressPdfBufferToBuffer(Buffer.from(pdfBuffer));

    const helperFileName = data.helperName.split(" ").join("-").toLowerCase() + "-id-card" + ".pdf";

    const supabaseIDCARDDocumentUrl = await SupabaseService.uploadFileBuffer(
      compressedPdfBuffer,
      helperFileName,
      "application/pdf",
      config.SUPABASE_BUCKET_NAME,
      config.SUPABASE_HELPER_KYCDOCUMENTS_PDFS_FOLDERNAME
    );

    const updatedEmployee = await Employee.findByIdAndUpdate(
      EMPLOYEE_MONGODB_ID,
      { identificationCardUrl: supabaseIDCARDDocumentUrl },
      { new: true }
    );

    res.status(200).json({ result: "Succesfully Fetched ID Card", data: updatedEmployee });
  } catch (error) {
    console.error("Get ID Card Error", error);
    res.status(500).json({ error: "Failed to get helper id card" });
  }
};

export const verifyIDCard = async (req: Request, res: Response) => {
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

export const createHelper = async (req: Request, res: Response) => {
  try {
    const { personalDetails, serviceDetails, vehicleDetails, employee } = req.body;

    console.log(req.body);

    // Parse joinedOn to Date if it's a string
    if (serviceDetails && typeof serviceDetails.joinedOn === "string") {
      serviceDetails.joinedOn = new Date(serviceDetails.joinedOn);
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

export const getAllHelpers = async (_: Request, res: Response) => {
  const helpers = await Helper.find()
    .populate("employee", "employeeId employeephotoUrl identificationCardUrl")
    .skip(10730)
    .limit(100);
  res.json(helpers);
};

export const getAllHelpersMetaData = async (req: Request, res: Response) => {
  try {
    const helpers = await Helper.find({})
      .populate("employee", "employeeName employeephotoUrl")
      .select("serviceDetails.type serviceDetails.assignedHouseholds employee _id");
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

export const getHelpersPaged = async (req: Request, res: Response) => {
  try {
    const { offset = 1, limit = 10 } = req.query;

    let pageNumber = Number.isNaN(Number(offset)) ? 1 : parseInt(offset as string, 10);
    const pageSize = Number.isNaN(Number(limit)) ? 10 : parseInt(limit as string, 10);

    // Ensure pageNumber is at least 1
    pageNumber = pageNumber < 1 ? 1 : pageNumber;

    const total = await Helper.countDocuments();
    const skip = (pageNumber - 1) * pageSize;

    const helpers = await Helper.find()
      .populate("employee", "employeeId employeephotoUrl identificationCardUrl")
      .skip(skip)
      .limit(pageSize);

    res.status(200).json({
      data: helpers,
      meta: {
        total,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.log("Error in Get Heleprs Paged", error);
  }
};

export const getHelperById = async (req: Request, res: Response) => {
  try {
    const helper = await Helper.findById(req.params.id).populate(
      "employee",
      "employeeName employeephotoUrl identificationCardUrl employeeId"
    );
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
    const helper = await Helper.findById(req.params.id);
    if (!helper) {
      return res.status(404).json({ message: "Helper not found" });
    }

    const employeeId = helper.employee;

    // 2️⃣ If employee object exists in body, update the Employee collection
    if (req.body.employee) {
      await Employee.findByIdAndUpdate(
        employeeId,
        { $set: req.body.employee }, // update name, department, photo, idCard, etc.
        { new: true }
      );
    }

    const { employee, ...helperUpdates } = req.body;

    // 4️⃣ Update Helper collection with remaining fields
    const updatedHelper = await Helper.findByIdAndUpdate(
      req.params.id,
      { $set: helperUpdates },
      { new: true }
    ).populate("employee"); // optional: to return updated employee details too

    res.status(200).json({
      result: "Helper Succesfully Updated",
      data: updatedHelper,
    });
  } catch (error) {
    console.log(error);
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

export const downloadIdCard = async (req: Request, res: Response) => {
  const userData = req.body;

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

interface MulterFileLike {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
  destination: string;
  filename: string;
  path: string;
  stream?: any;
}
