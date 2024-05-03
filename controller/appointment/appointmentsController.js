const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
require("dotenv").config();
const { verifyToken } = require("../../utils/tokens");
const Doctor = require("../../models/doctorModel");
const Patient = require("../../models/patientModel");
const Appointment = require("../../models/appointmentModel");

// async function createAppointment(req, res) {
//   try {
//     // const token = req.headers.authorization.split(" ")[1];
//     const { patientName, doctorName, date, time } = req.body;

//     // const decoded = await verifyToken(token);
//     // if (!decoded) {
//     //   return res.status(401).json({
//     //     success: false,
//     //     message: "Unauthorized",
//     //   });
//     // }

//     //  const patient = await Patient.findById(decoded.patientId);
//     //  if (!patient) {
//     //    return res
//     //      .status(404)
//     //      .json({ success: false, message: "Patient not found" });
//     //  }

// const patient = await Patient.findOne({ name: patientName });
// if (!patient) {
//   return res.status(404).json({
//     success: false,
//     message: "Doctor not found",
//   });
// }
//     // Find the doctor by name (assuming doctorName is the doctor's name)
//     const doctor = await Doctor.findOne({ name: doctorName });
//     if (!doctor) {
//       return res.status(404).json({
//         success: false,
//         message: "Doctor not found",
//       });
//     }

//     // Create the appointment object
//     const appointment = {
//       doctor: doctor._id,
//       patient: patient._id,
//       date,
//       time,
//     };

//     doctor.patientappoinment.push(appointment);

//     patient.doctorappoinment.push(appointment);

//     await doctor.save();
//     await patient.save();

//     return res.status(201).json({
//       success: true,
//       message: "Appointment created successfully",
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error",
//     });
//   }
// }
async function createAppointment(req, res) {
  try {
    // Validate input data
    const { patientName, doctorName, date, time } = req.body;
    if (!patientName || !doctorName || !date || !time) {
      return res.status(400).json({
        success: false,
        message: "Patient name, doctor name, date, and time are required",
      });
    }

    // Find patient and doctor
    const patient = await Patient.findOne({ name: patientName });
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    const doctor = await Doctor.findOne({ name: doctorName });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    // Check if appointment has been done before
    const previousAppointment = await Appointment.findOne({
      doctor: doctor._id,
      patient: patient._id,
      date,
      isDone: true, // Check if the appointment is done
    });

    if (previousAppointment) {
      return res.status(400).json({
        success: false,
        message: "Appointment has already been completed",
      });
    }

    const appointment = {
      doctor: {
        _id: doctor._id,
        name: doctor.name,
      },
      patient: {
        _id: patient._id,
        name: patient.name,
      },
      date,
      time,
      isDone: false, // Initialize as not done
    };

    // Update doctor and patient with the new appointment
    doctor.appointments.push(appointment);
    patient.appointments.push(appointment);
    await doctor.save();
    await patient.save();
    // Create appointment instance
    const appointment1 = new Appointment({
      doctor: doctor._id,
      patient: patient._id,
      date,
      time,
      isDone: false, // Initialize as not done
    });

    // Save appointment to the database
    await appointment1.save();

    return res.status(201).json({
      success: true,
      message: "Appointment created successfully",
      appointment, // Optionally, you can send back the created appointment object
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

async function getAllAppointments(req, res) {
  try {
    const { type } = req.params.type;
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({
        success: false,
        message: "Username is required in the request body.",
      });
    }

    let filter = {};
    let userModel;
    
    if (type === "patient") {
      filter.patient = username;
      userModel = Patient;
    } else if (type === "doctor") {
      filter.doctor = username;
      userModel = Doctor;
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid type. Type must be 'patient' or 'doctor'.",
      });
    }

    // Find the user by username
    const user = await userModel.findOne({ name: username });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: `${type} not found`,
      });
    }

    // Retrieve all appointments based on the filter from the database
    const appointments = await Appointment.find(filter);

    return res.status(200).json({
      success: true,
      appointments,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}


module.exports = {
  createAppointment,
getAllAppointments,};